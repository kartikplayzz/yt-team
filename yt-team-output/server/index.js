// Load .env file if present (ignored in production platforms that set env vars directly)
try { require('dotenv').config(); } catch {}

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api', require('./routes'));

// ─── SPA FALLBACK ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 YT Team Server running → http://localhost:${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Login: bhishma@ytteam.com / bhishma123`);
  console.log(`   Login: kartik@ytteam.com  / kartik123\n`);
});
