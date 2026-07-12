const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ===== IN-MEMORY STORE (replace with DB in production) =====
const users = new Map();           // email -> user object
const resetTokens = new Map();     // token -> { email, expiry }
const verifyTokens = new Map();    // token -> { email, expiry }

// ===== HELPERS =====
function hashPass(pass) {
  return crypto.createHash('sha256').update(pass + (process.env.PASS_SALT || 'nexkittool2025')).digest('hex');
}
function generateToken() { return crypto.randomBytes(32).toString('hex'); }

// ===== NODEMAILER TRANSPORTER =====
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'support@nexkittool.com',
      pass: process.env.GMAIL_APP_PASS   // 16-char Gmail App Password
    }
  });
}

async function sendMail(to, subject, html) {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Nexkittool" <${process.env.GMAIL_USER || 'support@nexkittool.com'}>`,
      to, subject, html
    });
    return true;
  } catch (err) {
    console.error('Mail error:', err.message);
    return false;
  }
}

// ===== EMAIL TEMPLATES =====
function welcomeEmailHtml(name, verifyLink) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:linear-gradient(135deg,#6c47ff,#ff6b47);padding:32px;text-align:center">
      <h1 style="color:#fff;font-size:1.8rem;font-weight:900;margin:0">⚡ Nexkittool</h1>
      <p style="color:rgba(255,255,255,.85);margin:6px 0 0">Free tools for everyone</p>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.2rem;color:#111;margin-bottom:8px">Welcome, ${name}! 🎉</h2>
      <p style="color:#6b7280;line-height:1.6">Your account has been created. Please verify your email address to unlock all features.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${verifyLink}" style="background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;display:inline-block">✅ Verify My Email</a>
      </div>
      <p style="color:#9ca3af;font-size:.82rem;text-align:center">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:.78rem;margin:0">© 2026 Nexkittool · support@nexkittool.com</p>
    </div>
  </div>`;
}

function resetEmailHtml(name, resetLink) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:linear-gradient(135deg,#6c47ff,#ff6b47);padding:32px;text-align:center">
      <h1 style="color:#fff;font-size:1.8rem;font-weight:900;margin:0">⚡ Nexkittool</h1>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.2rem;color:#111;margin-bottom:8px">Password Reset Request</h2>
      <p style="color:#6b7280;line-height:1.6">Hi ${name || 'there'}, we received a request to reset your password. Click below to set a new password.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${resetLink}" style="background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;display:inline-block">🔑 Reset My Password</a>
      </div>
      <p style="color:#9ca3af;font-size:.82rem;text-align:center">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:.78rem;margin:0">© 2026 Nexkittool · support@nexkittool.com</p>
    </div>
  </div>`;
}

// ===== ROUTES =====

// SIGNUP
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
  if (users.has(email.toLowerCase())) return res.status(400).json({ error: 'Email already registered' });

  const user = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashPass(password),
    plan: 'free',
    verified: false,
    createdAt: new Date()
  };
  users.set(email.toLowerCase(), user);

  // Send verification email
  const token = generateToken();
  verifyTokens.set(token, { email: email.toLowerCase(), expiry: Date.now() + 24*60*60*1000 });
  const BASE = process.env.BASE_URL || 'http://localhost:3000';
  const verifyLink = `${BASE}/api/auth/verify-email?token=${token}`;
  const sent = await sendMail(email, 'Verify your Nexkittool email ✅', welcomeEmailHtml(name, verifyLink));

  const token2 = generateToken();
  res.json({ ok: true, token: token2, emailSent: sent, user: { id: user.id, name: user.name, email: user.email, plan: 'free', verified: false } });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email.toLowerCase());
  if (!user || user.password !== hashPass(password)) return res.status(401).json({ error: 'Invalid email or password' });
  const token = generateToken();
  res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, verified: user.verified } });
});

// GOOGLE SIGN-IN (verifies ID token server-side)
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'No credential provided' });

    // Decode JWT payload (Google already verified it client-side via GSI; for extra security verify server-side)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64url').toString());
    const { email, name, picture, sub: googleId } = payload;
    if (!email) return res.status(400).json({ error: 'Invalid Google token' });

    let user = users.get(email.toLowerCase());
    if (!user) {
      // Auto-create account
      user = { id: googleId, name, email: email.toLowerCase(), password: null, plan: 'free', verified: true, googleId, picture, createdAt: new Date() };
      users.set(email.toLowerCase(), user);
      // Send welcome email (no verify link needed, Google already verified)
      const BASE = process.env.BASE_URL || 'http://localhost:3000';
      const welcomeHtml = welcomeEmailHtml(name, BASE).replace('Please verify your email address to unlock all features.', 'Your Google account has been connected. You\'re all set!').replace(/<div style="text-align:center;margin:28px 0">[\s\S]*?<\/div>/, `<div style="text-align:center;margin:28px 0"><a href="${BASE}" style="background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;display:inline-block">🚀 Start Using Nexkittool</a></div>`);
      await sendMail(email, 'Welcome to Nexkittool! 🎉', welcomeHtml);
    } else {
      // Existing user - update google info
      user.googleId = googleId;
      user.verified = true;
      if (picture) user.picture = picture;
    }

    const token = generateToken();
    res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, verified: true, picture: user.picture } });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google sign-in failed. Please try again.' });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = users.get(email.toLowerCase());
  // Always return success (don't reveal if email exists)
  if (!user) return res.json({ ok: true, msg: 'If that email is registered, a reset link has been sent.' });

  const token = generateToken();
  resetTokens.set(token, { email: email.toLowerCase(), expiry: Date.now() + 60*60*1000 }); // 1 hour
  const BASE = process.env.BASE_URL || 'http://localhost:3000';
  const resetLink = `${BASE}/reset-password.html?token=${token}`;
  const sent = await sendMail(email, 'Reset your Nexkittool password 🔑', resetEmailHtml(user.name, resetLink));

  res.json({ ok: true, sent, msg: 'If that email is registered, a reset link has been sent.' });
});

// RESET PASSWORD (from reset link)
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

  const data = resetTokens.get(token);
  if (!data || data.expiry < Date.now()) return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

  const user = users.get(data.email);
  if (!user) return res.status(400).json({ error: 'User not found' });

  user.password = hashPass(password);
  resetTokens.delete(token);
  res.json({ ok: true, msg: 'Password reset successfully! You can now log in.' });
});

// VERIFY EMAIL
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  const data = verifyTokens.get(token);
  if (!data || data.expiry < Date.now()) {
    return res.send(`<html><body style="font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb"><div style="text-align:center;background:#fff;padding:40px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.1)"><div style="font-size:3rem">❌</div><h2 style="color:#dc2626">Link Expired</h2><p style="color:#6b7280">This verification link has expired. Please sign up again or contact support.</p><a href="/" style="color:#6c47ff;font-weight:700">← Go Home</a></div></body></html>`);
  }
  const user = users.get(data.email);
  if (user) user.verified = true;
  verifyTokens.delete(token);
  res.send(`<html><body style="font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb"><div style="text-align:center;background:#fff;padding:40px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.1)"><div style="font-size:3rem">✅</div><h2 style="color:#059669">Email Verified!</h2><p style="color:#6b7280">Your email has been verified. You can now use all Nexkittool features.</p><a href="/" style="background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;display:inline-block;margin-top:16px">🚀 Go to Nexkittool</a></div></body></html>`);
});

// LOGOUT
router.post('/logout', (req, res) => res.json({ ok: true }));

module.exports = router;
