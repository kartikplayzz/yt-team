# 🎬 YT Team — Recruitment Platform

A production-ready YouTube team recruitment web app.  
Built with **Node.js + Express + SQLite** on the backend, and a fully custom dark-themed **SPA frontend** — no frameworks needed.

[![CI](https://github.com/YOUR_USERNAME/yt-team/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/yt-team/actions)

---

## ✨ Features

- 📝 **Public application form** — name, email, phone, Discord, skills
- 🔍 **Status checker** — applicants can check their status by email
- 🔐 **JWT-secured admin dashboard** — 8-hour sessions
- 📊 **Live stats** — total, pending, accepted, rejected, today
- 🔎 **Search & filter** across all fields
- ✅ **One-click status updates** + cycle button
- 📜 **Activity log** — every admin action timestamped
- ✉️ **Email modal** — pre-filled mailto links
- 📥 **CSV export** of all applications
- 👥 **Admin management** — add/remove (owner-only), protected founders
- 💾 **SQLite** — zero external database required

---

## 🗂 Project Structure

```
yt-team/
├── server/
│   ├── index.js       ← Express entry point
│   ├── routes.js      ← All 12 API endpoints
│   ├── db.js          ← SQLite schema + seed owners
│   └── auth.js        ← JWT middleware
├── public/
│   └── index.html     ← Full SPA (1 file, no build step)
├── .github/
│   └── workflows/
│       └── ci.yml     ← GitHub Actions CI
├── .env.example       ← Copy to .env for local dev
├── render.yaml        ← One-click Render.com deploy
├── railway.toml       ← One-click Railway deploy
└── package.json
```

---

## 🚀 Run Locally

**Requirements:** Node.js 18+

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/yt-team.git
cd yt-team

# 2. Install dependencies
npm install

# 3. Set up environment (optional for local)
cp .env.example .env
# Edit .env and set a real JWT_SECRET

# 4. Start
npm start

# 5. Open
open http://localhost:3000
```

> `data.sqlite` is created automatically on first run. No setup needed.

---

## 🔐 Default Login Credentials

| Name           | Email                  | Password   | Role          |
|----------------|------------------------|------------|---------------|
| Bhishma Rajput | bhishma@ytteam.com     | bhishma123 | ⚔️ Dark Owner  |
| Kartik         | kartik@ytteam.com      | kartik123  | 👑 Owner       |

> Change passwords after first login via the Admins tab.

---

## 🌐 Deploy to GitHub + Render (Free)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "🎬 Initial commit — YT Team platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yt-team.git
git push -u origin main
```

### Step 2 — Deploy on Render.com (Free Tier)

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Render auto-detects `render.yaml` — click **Apply**
4. Set environment variable:
   - `JWT_SECRET` → click **Generate** for a secure random value
5. Click **Deploy** — done! 🎉

Your app will be live at `https://yt-team.onrender.com` (or similar)

> ⚠️ **Free tier note:** Render free services spin down after 15 min of inactivity.  
> For always-on, upgrade to Starter ($7/mo) or use Railway.

---

## 🚂 Deploy to Railway (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login & deploy
railway login
railway init
railway up
railway open
```

Or connect via the [Railway dashboard](https://railway.app) → New Project → Deploy from GitHub.

Set `JWT_SECRET` in Railway's **Variables** tab.

---

## ⚙️ Environment Variables

| Variable     | Default                | Description                          |
|--------------|------------------------|--------------------------------------|
| `PORT`       | `3000`                 | Server port (auto-set by Render/Railway) |
| `JWT_SECRET` | `yt-team-secret-2025`  | **Change this in production!**       |
| `NODE_ENV`   | `development`          | Set to `production` on deploy        |

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 API Reference

### Public (no auth required)

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/api/stats`          | Aggregate stats              |
| POST   | `/api/apply`          | Submit application           |
| GET    | `/api/status/:email`  | Check application by email   |
| POST   | `/api/auth/login`     | Login → returns JWT token    |

### Protected (Bearer token required)

| Method | Endpoint                           | Description              |
|--------|------------------------------------|--------------------------|
| GET    | `/api/applications`                | List all applications    |
| PATCH  | `/api/applications/:id/status`     | Update status            |
| DELETE | `/api/applications/:id`            | Delete application       |
| GET    | `/api/applications/export/csv`     | Download CSV             |
| GET    | `/api/admins`                      | List admins              |
| POST   | `/api/admins`                      | Add admin (owner only)   |
| DELETE | `/api/admins/:id`                  | Remove admin (owner only)|
| GET    | `/api/activity`                    | Activity log             |

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (10 rounds)
- **JWT** tokens expire in 8 hours
- Founder accounts (`owner-bhishma`, `owner-kartik`) are **undeletable**
- Only `owner` / `dark-owner` roles can manage admins
- Always set a strong `JWT_SECRET` in production

---

## 📄 License

MIT — free to use, modify, and deploy.
