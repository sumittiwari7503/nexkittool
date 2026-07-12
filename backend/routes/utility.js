const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Health check
router.get('/ping', (req, res) => res.json({ ok: true }));

// UUID generate
router.get('/uuid', (req, res) => res.json({ uuid: uuidv4() }));

// Lorem ipsum
router.get('/lorem', (req, res) => {
  const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
  const count = parseInt(req.query.count) || 1;
  res.json({ text: Array(count).fill(lorem).join('\n\n') });
});

module.exports = router;
