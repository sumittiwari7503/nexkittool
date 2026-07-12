const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Image to PDF
router.post('/image-to-pdf', upload.array('file'), async (req, res) => {
  try {
    const sharp = require('sharp');
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded.' });
    }
    const pdfDoc = await PDFDocument.create();
    for (const file of req.files) {
      // Normalize every image to a clean baseline PNG via sharp first.
      // pdf-lib's built-in JPEG parser does not support progressive JPEGs
      // or all chroma-subsampling variants and can throw "SOI not found"
      // on otherwise-valid real-world photos. Routing everything through
      // sharp guarantees pdf-lib always receives a format it can embed.
      const normalized = await sharp(file.buffer).png().toBuffer();
      const img = await pdfDoc.embedPng(normalized);
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const pdfBytes = await pdfDoc.save();
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="nexkittool-converted.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('image-to-pdf error:', err.message);
    res.status(500).json({ error: 'Could not convert one or more images to PDF. Please make sure each file is a valid JPG, PNG, or WEBP image.' });
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

// Compress PDF (re-save)
router.post('/compress', upload.single('file'), async (req, res) => {
  try {
    const doc = await PDFDocument.load(req.file.buffer);
    const pdfBytes = await doc.save({ useObjectStreams: true });
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="nexkittool-compressed.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) { res.status(500).json({ error: err.message }); }
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

// Split PDF
router.post('/split', upload.single('file'), async (req, res) => {
  try {
    const doc = await PDFDocument.load(req.file.buffer);
    const newDoc = await PDFDocument.create();
    const [firstPage] = await newDoc.copyPages(doc, [0]);
    newDoc.addPage(firstPage);
    const pdfBytes = await newDoc.save();
    res.set('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (err) { res.status(500).json({ error: err.message }); }
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
