const express = require('express');
const router = express.Router();

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

  // Try each key in rotation — ek fail ho to agla chalaye
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

        // Success — next request ko agla key milega
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

router.post('/generate', async (req, res) => {
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
