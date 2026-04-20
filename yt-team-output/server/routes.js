const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db      = require('./db');
const { authMiddleware, SECRET } = require('./auth');

const router = express.Router();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function genAppNumber() {
  const n = String(Math.floor(Math.random() * 90000) + 10000);
  return 'YT-' + n;
}

function log(adminId, adminName, action, details = null) {
  db.prepare('INSERT INTO activity_log (admin_id, admin_name, action, details) VALUES (?,?,?,?)')
    .run(adminId, adminName, action, details);
}

// ─── PUBLIC: STATS ────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const total    = db.prepare('SELECT COUNT(*) AS c FROM applications').get().c;
  const pending  = db.prepare("SELECT COUNT(*) AS c FROM applications WHERE status='pending'").get().c;
  const accepted = db.prepare("SELECT COUNT(*) AS c FROM applications WHERE status='accepted'").get().c;
  const rejected = db.prepare("SELECT COUNT(*) AS c FROM applications WHERE status='rejected'").get().c;
  const today    = db.prepare("SELECT COUNT(*) AS c FROM applications WHERE DATE(applied_at)=DATE('now')").get().c;
  res.json({ total, pending, accepted, rejected, today });
});

// ─── PUBLIC: APPLY ────────────────────────────────────────────────────────────
router.post('/apply', (req, res) => {
  const { name, email, contact, discord, skills } = req.body;
  if (!name || !email || !contact || !discord || !skills)
    return res.status(400).json({ error: 'All fields required' });

  // Check duplicate email
  const dup = db.prepare('SELECT id FROM applications WHERE email = ?').get(email.toLowerCase());
  if (dup) return res.status(409).json({ error: 'This email has already applied' });

  let appNumber;
  // Ensure unique app number
  for (let i = 0; i < 10; i++) {
    appNumber = genAppNumber();
    if (!db.prepare('SELECT id FROM applications WHERE app_number = ?').get(appNumber)) break;
  }

  db.prepare(`
    INSERT INTO applications (app_number, name, email, contact, discord, skills)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(appNumber, name.trim(), email.toLowerCase().trim(), contact.trim(), discord.trim(), skills.trim());

  log('SYSTEM', 'SYSTEM', 'New application submitted', `${name} — ${appNumber}`);
  res.json({ success: true, appNumber, message: 'Application submitted!' });
});

// ─── PUBLIC: STATUS CHECK ────────────────────────────────────────────────────
router.get('/status/:email', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE email = ?').get(req.params.email.toLowerCase());
  if (!app) return res.status(404).json({ error: 'No application found for this email' });
  res.json({
    app_number: app.app_number,
    name:       app.name,
    status:     app.status,
    applied_at: app.applied_at?.slice(0, 10),
    updated_at: app.updated_at?.slice(0, 10),
  });
});

// ─── AUTH: LOGIN ──────────────────────────────────────────────────────────────
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email.toLowerCase());
  if (!admin || !bcrypt.compareSync(password, admin.password))
    return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: admin.id, name: admin.name, email: admin.email, role: admin.role }, SECRET, { expiresIn: '8h' });
  log(admin.id, admin.name, 'Logged in', null);
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
});

// ─── PROTECTED: ALL APPLICATIONS ─────────────────────────────────────────────
router.get('/applications', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY applied_at DESC').all();
  res.json(apps);
});

// ─── PROTECTED: UPDATE STATUS ─────────────────────────────────────────────────
router.patch('/applications/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'accepted', 'rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  db.prepare("UPDATE applications SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status, req.params.id);
  log(req.admin.id, req.admin.name, `Marked ${status}`, `${app.name} — ${app.app_number}`);
  res.json({ success: true });
});

// ─── PROTECTED: DELETE APPLICATION ───────────────────────────────────────────
router.delete('/applications/:id', authMiddleware, (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  log(req.admin.id, req.admin.name, 'Deleted application', `${app.name} — ${app.app_number}`);
  res.json({ success: true });
});

// ─── PROTECTED: EXPORT CSV ───────────────────────────────────────────────────
router.get('/applications/export/csv', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY applied_at DESC').all();
  const header = 'App#,Name,Email,Contact,Discord,Skills,Status,Applied At\n';
  const rows = apps.map(a =>
    [a.app_number, a.name, a.email, a.contact, a.discord, `"${a.skills?.replace(/"/g, '""')}"`, a.status, a.applied_at].join(',')
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
  res.send(header + rows);
});

// ─── PROTECTED: ADMINS LIST ───────────────────────────────────────────────────
router.get('/admins', authMiddleware, (req, res) => {
  const admins = db.prepare('SELECT id, name, email, role, created_at FROM admins ORDER BY created_at ASC').all();
  res.json(admins);
});

// ─── PROTECTED: ADD ADMIN ─────────────────────────────────────────────────────
router.post('/admins', authMiddleware, (req, res) => {
  if (!['owner', 'dark-owner'].includes(req.admin.role))
    return res.status(403).json({ error: 'Only owners can add admins' });

  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Fill all fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars' });

  const dup = db.prepare('SELECT id FROM admins WHERE email = ?').get(email.toLowerCase());
  if (dup) return res.status(409).json({ error: 'Email already exists' });

  const id = 'admin-' + uuidv4().slice(0, 8);
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admins (id, name, email, password, role) VALUES (?,?,?,?,?)').run(id, name, email.toLowerCase(), hash, 'admin');
  log(req.admin.id, req.admin.name, 'Added admin', name + ' <' + email + '>');
  res.json({ success: true });
});

// ─── PROTECTED: REMOVE ADMIN ──────────────────────────────────────────────────
router.delete('/admins/:id', authMiddleware, (req, res) => {
  if (!['owner', 'dark-owner'].includes(req.admin.role))
    return res.status(403).json({ error: 'Only owners can remove admins' });

  const LOCKED = ['owner-kartik', 'owner-bhishma'];
  if (LOCKED.includes(req.params.id))
    return res.status(403).json({ error: 'This account is protected and cannot be removed' });

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.params.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  db.prepare('DELETE FROM admins WHERE id = ?').run(req.params.id);
  log(req.admin.id, req.admin.name, 'Removed admin', admin.name);
  res.json({ success: true });
});

// ─── PROTECTED: ACTIVITY LOG ──────────────────────────────────────────────────
router.get('/activity', authMiddleware, (req, res) => {
  const logs = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
});

module.exports = router;
