const express = require('express');
const router = express.Router();
const db = require('../db');

let currentKeyIndex = 0;

async function callGemini(prompt) {
  const apiKeysStr = process.env.GEMINI_API_KEY || '';
  const apiKeys = apiKeysStr.split(',').map(k => k.trim()).filter(Boolean);

  // Demo mode check
  if (apiKeys.length === 0 || apiKeys.every(k => k.startsWith('YOUR_GEMINI_KEY'))) {
    return 'Demo Mode: Please add valid GEMINI_API keys to your .env file. Get free keys from https://aistudio.google.com';
  }

  // Filter out placeholder keys
  const validKeys = apiKeys.filter(k => !k.startsWith('YOUR_GEMINI_KEY'));

  if (validKeys.length === 0) {
    return 'No valid API keys found. Please replace YOUR_GEMINI_KEY placeholders with real keys.';
  }

  const versions = ['v1', 'v1beta'];
  let lastError = null;

  // Try each key in rotation
  for (let attempt = 0; attempt < validKeys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % validKeys.length;
    const apiKey = validKeys[keyIndex];

    for (const ver of versions) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/${ver}/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );

        const data = await res.json();

        if (data.error) {
          console.warn(`Key #${keyIndex + 1} failed (${ver}): ${data.error.message}`);
          lastError = new Error(data.error.message);
          break; // try next key
        }

        // Success
        currentKeyIndex = (keyIndex + 1) % validKeys.length;
        console.log(`✅ Request served by Key #${keyIndex + 1} of ${validKeys.length}`);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

      } catch (err) {
        console.warn(`Key #${keyIndex + 1} error:`, err.message);
        lastError = err;
      }
    }
  }

  throw new Error(
    `All ${validKeys.length} API keys failed. Last error: ${lastError?.message || 'Unknown'}. ` +
    `Make sure Generative Language API is enabled in Google Cloud Console.`
  );
}

// In-memory request trackers for rate limits (key -> { count, resetTime })
const rateLimitCache = new Map();
const freeIpWindow = 60 * 60 * 1000; // 1 hour
const freeIpMax = 30;
const proUserWindow = 60 * 60 * 1000; // 1 hour
const proUserMax = 1000; // Large/practically unlimited for Pro

async function checkAiRateLimit(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  let user = null;
  if (token) {
    try {
      const session = await db.get('SELECT * FROM sessions WHERE token = ?', [token]);
      if (session) {
        user = await db.getUserById(session.userId);
      }
    } catch (e) {
      console.error('Session lookup failed:', e.message);
    }
  }

  let limitKey = '';
  let maxRequests = freeIpMax;
  let windowMs = freeIpWindow;
  let isPro = false;

  if (user) {
    isPro = user.plan === 'pro';
    limitKey = `user_${user.id}`;
    maxRequests = isPro ? proUserMax : freeIpMax;
  } else {
    limitKey = `ip_${req.ip}`;
    maxRequests = freeIpMax;
  }

  const now = Date.now();
  let record = rateLimitCache.get(limitKey);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
  }

  record.count++;
  rateLimitCache.set(limitKey, record);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

  if (record.count > maxRequests) {
    return res.status(429).json({
      error: isPro
        ? 'Pro tier rate limit exceeded. Please try again later.'
        : 'Free tier: 30 AI requests/hour. Upgrade to Pro for unlimited!'
    });
  }

  req.user = user;
  next();
}

router.post('/generate', checkAiRateLimit, async (req, res) => {
  try {
    const { prompt, toolId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    const result = await callGemini(prompt);
    res.json({ result, toolId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
