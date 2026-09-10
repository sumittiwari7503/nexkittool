const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument, PDFName, PDFRawStream, PDFNumber, rgb, StandardFonts } = require('pdf-lib');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Image to PDF
router.post('/image-to-pdf', upload.array('file'), async (req, res) => {
  try {
    const sharp = require('sharp');
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded.' });
    }
    
    const pageSizeOption = req.body.pageSize || 'a4';
    const orientation = req.body.orientation || 'portrait';
    const margin = Math.max(0, parseInt(req.body.margin) || 0);

    const pdfDoc = await PDFDocument.create();

    const PAGE_SIZES = {
      a4: [595.28, 841.89],
      letter: [612, 792]
    };

    for (const file of req.files) {
      const normalized = await sharp(file.buffer).png().toBuffer();
      const img = await pdfDoc.embedPng(normalized);

      let pageWidth, pageHeight;
      if (pageSizeOption === 'fit') {
        pageWidth = img.width + margin * 2;
        pageHeight = img.height + margin * 2;
      } else {
        const baseDims = PAGE_SIZES[pageSizeOption] || PAGE_SIZES.a4;
        if (orientation === 'landscape') {
          pageWidth = baseDims[1];
          pageHeight = baseDims[0];
        } else {
          pageWidth = baseDims[0];
          pageHeight = baseDims[1];
        }
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const imgRatio = img.width / img.height;
      const boxRatio = availableWidth / availableHeight;

      let drawWidth, drawHeight;
      if (pageSizeOption === 'fit') {
        drawWidth = img.width;
        drawHeight = img.height;
      } else {
        if (imgRatio > boxRatio) {
          drawWidth = availableWidth;
          drawHeight = availableWidth / imgRatio;
        } else {
          drawHeight = availableHeight;
          drawWidth = availableHeight * imgRatio;
        }
      }

      const x = margin + (availableWidth - drawWidth) / 2;
      const y = margin + (availableHeight - drawHeight) / 2;

      page.drawImage(img, { x, y, width: drawWidth, height: drawHeight });
    }
    const pdfBytes = await pdfDoc.save();
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="nexkittool-converted.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('image-to-pdf error:', err.message);
    res.status(500).json({ error: 'Could not convert images to PDF.' });
  }
});

// Merge PDFs
router.post('/merge', upload.array('file'), async (req, res) => {
  try {
    const merged = await PDFDocument.create();
    for (const file of req.files) {
      const doc = await PDFDocument.load(file.buffer);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }
    const pdfBytes = await merged.save();
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="nexkittool-merged.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Compress PDF (Safe raster stream downsampling + object stream packing)
router.post('/compress', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const sharp = require('sharp');
    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const context = doc.context;

    // Collect compressible image indirect objects
    const imageRefs = [];
    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream) {
        const dict = obj.dict;
        const subtype = dict.get(PDFName.of('Subtype'));
        if (subtype === PDFName.of('Image')) {
          const filter = dict.get(PDFName.of('Filter'));
          if (filter === PDFName.of('DCTDecode')) {
            imageRefs.push(ref);
          }
        }
      }
    }

    // Process each image sequentially to control memory footprint
    for (const ref of imageRefs) {
      try {
        const obj = context.lookup(ref);
        if (!obj || !(obj instanceof PDFRawStream)) continue;
        const dict = obj.dict;
        const contents = obj.getContents();
        if (!contents || contents.length < 5000) continue; // Skip tiny icons/decorations < 5KB

        const meta = await sharp(contents).metadata();
        if (!meta || !meta.width || !meta.height) continue;

        let sharpPipeline = sharp(contents);
        let targetWidth = meta.width;
        let targetHeight = meta.height;

        // Downsample high-resolution images exceeding 1400px
        const maxDim = 1400;
        if (meta.width > maxDim || meta.height > maxDim) {
          if (meta.width >= meta.height) {
            targetWidth = maxDim;
            targetHeight = Math.round((meta.height * maxDim) / meta.width);
          } else {
            targetHeight = maxDim;
            targetWidth = Math.round((meta.width * maxDim) / meta.height);
          }
          sharpPipeline = sharpPipeline.resize(targetWidth, targetHeight, { fit: 'inside' });
        }

        // Recompress to JPEG quality 70 with mozjpeg
        const recompressedJpg = await sharpPipeline.jpeg({ quality: 70, mozjpeg: true }).toBuffer();

        // Only replace if recompression actually saved bytes
        if (recompressedJpg && recompressedJpg.length < contents.length) {
          const replacementStream = context.stream(recompressedJpg, {
            Type: PDFName.of('XObject'),
            Subtype: PDFName.of('Image'),
            Width: PDFNumber.of(targetWidth),
            Height: PDFNumber.of(targetHeight),
            ColorSpace: dict.get(PDFName.of('ColorSpace')) || PDFName.of('DeviceRGB'),
            BitsPerComponent: PDFNumber.of(8),
            Filter: PDFName.of('DCTDecode')
          });

          const smask = dict.get(PDFName.of('SMask'));
          if (smask) replacementStream.dict.set(PDFName.of('SMask'), smask);

          context.assign(ref, replacementStream);
        }
      } catch (imgErr) {
        // Continue processing other objects if one image stream fails
      }
    }

    const pdfBytes = await doc.save({ useObjectStreams: true });
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="nexkittool-compressed.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: 'Could not compress this PDF: ' + err.message });
  }
});

// PDF Watermark
router.post('/watermark', upload.single('file'), async (req, res) => {
  try {
    const doc = await PDFDocument.load(req.file.buffer);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const text = req.body.text || 'Nexkittool';
    const pages = doc.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawText(text, {
        x: width / 2 - 80, y: height / 2,
        size: 48, font,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.4,
        rotate: { type: 'degrees', angle: 45 }
      });
    });
    const pdfBytes = await doc.save();
    res.set('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function parsePageRange(rangeStr, maxPages) {
  const pages = new Set();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    if (/^\d+$/.test(p)) {
      const page = parseInt(p, 10);
      if (page < 1 || page > maxPages) {
        throw new Error(`Page number ${page} out of bounds (1-${maxPages}).`);
      }
      pages.add(page - 1);
    } else if (/^\d+-\d+$/.test(p)) {
      const [startStr, endStr] = p.split('-');
      let start = parseInt(startStr, 10);
      let end = parseInt(endStr, 10);
      if (start < 1 || start > maxPages || end < 1 || end > maxPages) {
        throw new Error(`Page range ${p} out of bounds (1-${maxPages}).`);
      }
      if (start > end) {
        [start, end] = [end, start]; // Swap reversed range
      }
      for (let i = start; i <= end; i++) {
        pages.add(i - 1);
      }
    } else {
      throw new Error(`Invalid range format: "${p}". Use numbers or ranges like 1-5.`);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

// Split PDF
router.post('/split', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });
    const doc = await PDFDocument.load(req.file.buffer);
    const maxPages = doc.getPageCount();
    const rangeText = req.body.pages || '';
    
    let indices = [];
    if (rangeText.trim()) {
      indices = parsePageRange(rangeText, maxPages);
      if (indices.length === 0) {
        return res.status(400).json({ error: 'No valid pages selected.' });
      }
    } else {
      // If empty range, extract all pages
      indices = Array.from({ length: maxPages }, (_, i) => i);
    }
    
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(doc, indices);
    copiedPages.forEach(page => newDoc.addPage(page));
    
    const pdfBytes = await newDoc.save();
    res.set('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

// PDF to Image (real rendering — returns a single JPG for 1-page PDFs, or a ZIP of JPGs for multi-page PDFs)
router.post('/pdf-to-image', upload.single('file'), async (req, res) => {
  let tmpPath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });
    const sharp = require('sharp');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const { pdf } = await import('pdf-to-img');

    // pdf-to-img reads from a file path, so write the uploaded buffer to a temp file
    tmpPath = path.join(os.tmpdir(), `nkt-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
    fs.writeFileSync(tmpPath, req.file.buffer);

    const document = await pdf(tmpPath, { scale: 2 });
    const jpgBuffers = [];
    for await (const pngBuffer of document) {
      const jpg = await sharp(pngBuffer).jpeg({ quality: 85 }).toBuffer();
      jpgBuffers.push(jpg);
    }

    if (jpgBuffers.length === 0) {
      return res.status(422).json({ error: 'This PDF has no renderable pages.' });
    }

    if (jpgBuffers.length === 1) {
      res.set('Content-Type', 'image/jpeg');
      res.set('Content-Disposition', 'attachment; filename="nexkittool-page1.jpg"');
      return res.send(jpgBuffers[0]);
    }

    const JSZip = require('jszip');
    const zip = new JSZip();
    jpgBuffers.forEach((buf, i) => zip.file(`page-${i + 1}.jpg`, buf));
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="nexkittool-pages.zip"');
    res.send(zipBuffer);
  } catch (err) {
    console.error('pdf-to-image error:', err.message);
    res.status(500).json({ error: 'Could not convert this PDF to images. Please make sure the file is a valid, non-corrupted PDF.' });
  } finally {
    if (tmpPath) { try { require('fs').unlinkSync(tmpPath); } catch (_) {} }
  }
});

// Word to PDF (placeholder)
router.post('/word-to-pdf', upload.single('file'), async (req, res) => {
  res.status(501).json({ error: 'Word to PDF requires LibreOffice on server. Coming soon!' });
});

// PDF to Word (placeholder)
router.post('/pdf-to-word', upload.single('file'), async (req, res) => {
  res.status(501).json({ error: 'PDF to Word conversion coming soon!' });
});

module.exports = router;
