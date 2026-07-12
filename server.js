require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Rate Limiters
const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true });
const freeLimiter = rateLimit({
  windowMs: 60*60*1000, max: 30,
  message: { error: 'Free tier: 30 AI requests/hour. Upgrade to Pro for unlimited!' },
  skip: (req) => req.headers['x-pro-user'] === process.env.PRO_SECRET
});

// Static files
app.use(express.static(path.join(__dirname, '.'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// API Routes
app.use('/api/image', apiLimiter, require('./backend/routes/image'));
app.use('/api/pdf', apiLimiter, require('./backend/routes/pdf'));
app.use('/api/ai', freeLimiter, require('./backend/routes/ai'));
app.use('/api/payment', require('./backend/routes/payment'));
app.use('/api/utility', apiLimiter, require('./backend/routes/utility'));
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/blog', apiLimiter, require('./backend/routes/blog'));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok', name: 'nexkittool', version: '2.0.0', timestamp: new Date()
}));

// Sitemap & Robots served from root
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/sitemap-blog.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-blog.xml')));
app.get('/sitemap-lang.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-lang.xml')));
app.get('/sitemap-index.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-index.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));

// SEO-friendly clean URLs for tool/compare/lang pages (folder-based, served via static index.html)
// e.g. /tools/compress-pdf/ -> /tools/compress-pdf/index.html (handled automatically by express.static)
// Redirect non-trailing-slash tool URLs to canonical trailing-slash version (avoids duplicate content)
app.get(['/tools/:slug', '/compare/:slug', '/lang/:slug'], (req, res, next) => {
  if (!req.path.endsWith('/')) {
    return res.redirect(301, req.path + '/');
  }
  next();
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => console.log(`🚀 Nexkittool running at http://localhost:${PORT}`));
module.exports = app;
