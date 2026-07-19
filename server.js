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

// Static files with optimized browser caching
app.use(express.static(path.join(__dirname, '.'), {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (filePath.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
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

// Sitemap, Robots & LLMs.txt served from root
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/sitemap-blog.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-blog.xml')));
app.get('/sitemap-lang.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-lang.xml')));
app.get('/sitemap-index.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-index.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/llms.txt', (req, res) => res.sendFile(path.join(__dirname, 'llms.txt')));

// SEO-friendly clean URLs redirection
// Redirect non-trailing-slash URLs to canonical trailing-slash version (avoids duplicate content)
app.use((req, res, next) => {
  if (req.path.indexOf('.') === -1 && !req.path.startsWith('/api/')) {
    if (!req.path.endsWith('/')) {
      const query = req.url.slice(req.path.length);
      return res.redirect(301, req.path + '/' + query);
    }
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
