const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '../data.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL,
    role      TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    app_number TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    contact    TEXT NOT NULL,
    discord    TEXT NOT NULL,
    skills     TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id   TEXT,
    admin_name TEXT,
    action     TEXT NOT NULL,
    details    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── SEED OWNERS ───────────────────────────────────────────
function seedOwner(id, name, email, password, role) {
  const exists = db.prepare('SELECT id FROM admins WHERE id = ?').get(id);
  if (!exists) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admins (id, name, email, password, role) VALUES (?,?,?,?,?)')
      .run(id, name, email, hash, role);
    console.log(`[DB] Seeded ${role}: ${name}`);
  }
}

seedOwner('owner-bhishma', 'Bhishma Rajput', 'bhishma@ytteam.com', 'bhishma123', 'dark-owner');
seedOwner('owner-kartik',  'Kartik',         'kartik@ytteam.com',  'kartik123',  'owner');

module.exports = db;
