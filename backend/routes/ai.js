const express = require('express');
const router = express.Router();
const db = require('../db');

let currentKeyIndex = 0;

async function callGemini(prompt) {
  const apiKeysStr = process.env.GEMINI_API_KEY || '';
  const rawKeys = apiKeysStr.split(',').map(k => k.trim()).filter(Boolean);

  // Filter out empty or placeholder keys
  const validKeys = rawKeys.filter(k => 
    k && 
    !k.toLowerCase().startsWith('your_gemini_key') && 
    k !== 'your_api_key_here'
  );

  if (validKeys.length === 0) {
    throw new Error('Gemini API key is not configured. Please add a valid GEMINI_API_KEY to your server environment (.env file).');
  }

  const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter(m => m !== PRIMARY_MODEL)];

  let lastError = null;

  // Try each key in rotation
  for (let attempt = 0; attempt < validKeys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % validKeys.length;
    const apiKey = validKeys[keyIndex];

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(30000)
          }
        );

        const data = await res.json();

        if (data.error) {
          const errMsg = data.error.message || JSON.stringify(data.error);
          console.warn(`Key #${keyIndex + 1} model ${model} failed: ${errMsg}`);
          lastError = new Error(errMsg);
          
          // If model was not found (404), try fallback model on same key
          if (data.error.code === 404 || errMsg.toLowerCase().includes('not found')) {
            continue;
          }
          // For key quota exhaustion (429) or key authentication errors, rotate to next key
          break;
        }

        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) {
          lastError = new Error('Empty response received from AI service.');
          continue;
        }

        // Success
        currentKeyIndex = (keyIndex + 1) % validKeys.length;
        console.log(`✅ AI request served by Key #${keyIndex + 1} (${model})`);
        return textOutput;

      } catch (err) {
        console.warn(`Key #${keyIndex + 1} model ${model} network/timeout error:`, err.message);
        lastError = err;
      }
    }
  }

  throw new Error(
    `AI generation failed. Last error: ${lastError?.message || 'Unknown service error'}. ` +
    `Please ensure Generative Language API is enabled and quota is available.`
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
    // Safely determine client IP behind reverse proxy / Cloudflare / Hostinger
    const clientIp = req.headers['cf-connecting-ip'] ||
                     req.headers['x-real-ip'] ||
                     (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
                     req.ip ||
                     req.socket?.remoteAddress ||
                     'unknown_client';
    limitKey = `ip_${clientIp}`;
    maxRequests = freeIpMax;
  }

  const now = Date.now();
  let record = rateLimitCache.get(limitKey);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
  }

  record.count++;
  rateLimitCache.set(limitKey, record);

  // Periodic prune to prevent memory leaks in rateLimitCache
  if (rateLimitCache.size > 1000) {
    for (const [key, val] of rateLimitCache.entries()) {
      if (now > val.resetTime) rateLimitCache.delete(key);
    }
  }

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
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required and cannot be empty.' });
    }
    if (prompt.length > 50000) {
      return res.status(400).json({ error: 'Input text exceeds maximum allowed length of 50,000 characters.' });
    }
    const result = await callGemini(prompt.trim());
    res.json({ result, toolId });
  } catch (err) {
    console.error('AI generation route error:', err.message);
    const isRateLimit = err.message.toLowerCase().includes('quota') || err.message.includes('429');
    res.status(isRateLimit ? 429 : 500).json({ error: err.message });
  }
});

module.exports = router;
