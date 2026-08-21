const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// Compress Image
router.post('/compress', upload.single('image'), async (req, res) => {
  try {
    const sharp = require('sharp');
    const output = await sharp(req.file.buffer)
      .jpeg({ quality: 70 })
      .toBuffer();
    res.set('Content-Type', 'image/jpeg');
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resize Image
router.post('/resize', upload.single('image'), async (req, res) => {
  try {
    const sharp = require('sharp');
    const w = parseInt(req.body.width) || 800;
    const h = parseInt(req.body.height) || 600;
    const output = await sharp(req.file.buffer).resize(w, h, { fit: 'inside' }).toBuffer();
    res.set('Content-Type', req.file.mimetype);
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Grayscale
router.post('/grayscale', upload.single('image'), async (req, res) => {
  try {
    const sharp = require('sharp');
    const output = await sharp(req.file.buffer).grayscale().toBuffer();
    res.set('Content-Type', req.file.mimetype);
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Flip & Rotate
router.post('/flip', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });
    const sharp = require('sharp');
    const mode = req.body.mode || 'horizontal';
    
    let image = sharp(req.file.buffer);
    if (mode === '90') {
      image = image.rotate(90);
    } else if (mode === '180') {
      image = image.rotate(180);
    } else if (mode === '270') {
      image = image.rotate(270);
    } else if (mode === 'vertical') {
      image = image.flip();
    } else {
      image = image.flop(); // default horizontal
    }

    const output = await image.toBuffer();
    res.set('Content-Type', req.file.mimetype);
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Watermark
router.post('/watermark', upload.single('image'), async (req, res) => {
  try {
    const sharp = require('sharp');
    const text = req.body.text || 'Nexkittool';
    const meta = await sharp(req.file.buffer).metadata();
    const svg = `<svg width="${meta.width}" height="${meta.height}">
      <text x="50%" y="90%" text-anchor="middle" font-size="40" fill="rgba(255,255,255,0.6)" font-family="Arial">${text}</text>
    </svg>`;
    const output = await sharp(req.file.buffer)
      .composite([{ input: Buffer.from(svg), gravity: 'south' }])
      .toBuffer();
    res.set('Content-Type', req.file.mimetype);
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Convert format
router.post('/convert', upload.single('image'), async (req, res) => {
  try {
    const sharp = require('sharp');
    const fmt = req.body.format || 'jpeg';
    const output = await sharp(req.file.buffer).toFormat(fmt).toBuffer();
    res.set('Content-Type', 'image/' + fmt);
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Background Remove (simple threshold method)
router.post('/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const sharp = require('sharp');
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();
    
    // Convert to raw RGBA buffer
    const raw = await image.ensureAlpha().raw().toBuffer();
    
    // Sample top-left pixel color as the reference background color
    const r_bg = raw[0];
    const g_bg = raw[1];
    const b_bg = raw[2];
    
    // Distance threshold (how close color must be to background to be removed)
    const threshold = 35;
    
    for (let i = 0; i < raw.length; i += 4) {
      const r = raw[i];
      const g = raw[i+1];
      const b = raw[i+2];
      
      const distToBg = Math.sqrt(
        Math.pow(r - r_bg, 2) + 
        Math.pow(g - g_bg, 2) + 
        Math.pow(b - b_bg, 2)
      );
      
      const isWhite = r > 235 && g > 235 && b > 235;
      
      if (distToBg < threshold || isWhite) {
        raw[i+3] = 0; // Make pixel transparent
      }
    }
    
    // Convert raw buffer back to PNG image buffer
    const output = await sharp(raw, {
      raw: {
        width: metadata.width,
        height: metadata.height,
        channels: 4
      }
    }).png().toBuffer();
    
    res.set('Content-Type', 'image/png');
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Crop
router.post('/crop', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });
    const sharp = require('sharp');
    const x = Math.round(parseFloat(req.body.x || 0));
    const y = Math.round(parseFloat(req.body.y || 0));
    const w = Math.round(parseFloat(req.body.width || 0));
    const h = Math.round(parseFloat(req.body.height || 0));

    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();

    const left = Math.max(0, Math.min(x, metadata.width - 1));
    const top = Math.max(0, Math.min(y, metadata.height - 1));
    const width = Math.max(1, Math.min(w, metadata.width - left));
    const height = Math.max(1, Math.min(h, metadata.height - top));

    const output = await image
      .extract({ left, top, width, height })
      .toBuffer();

    res.set('Content-Type', req.file.mimetype);
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
