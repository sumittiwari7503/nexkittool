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

// Flip
router.post('/flip', upload.single('image'), async (req, res) => {
  try {
    const sharp = require('sharp');
    const output = await sharp(req.file.buffer).flop().toBuffer();
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
    const sharp = require('sharp');
    const output = await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'cover' })
      .toBuffer();
    res.set('Content-Type', req.file.mimetype);
    res.send(output);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
