# Deploying OrderFlow to Render (Free Tier)

## Prerequisites
- GitHub account
- Render account (render.com)
- Gmail account (for email notifications)

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Create repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/orderflow.git
git push -u origin main
```

---

## Step 2 — Create PostgreSQL Database on Render

1. Render dashboard → **New +** → **PostgreSQL**
2. Name: `orderflow-db` | Plan: **Free** → Create
3. Once created, go to the database page and copy the **Internal Database URL**

---

## Step 3 — Deploy Backend (Web Service)

1. Render dashboard → **New +** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `orderflow-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Plan**: Free

4. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (paste Internal Database URL from Step 2) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (any long random string, e.g. `orderflow_super_secret_2024_xyz`) |
| `JWT_EXPIRES_IN` | `8h` |
| `FACTORY_EMAIL` | your factory email |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | your Gmail App Password |
| `UPLOAD_DIR` | `uploads` |
| `FRONTEND_URL` | (fill in AFTER deploying frontend in Step 5) |

5. Click **Create Web Service** — wait for deploy
6. Copy your backend URL e.g. `https://orderflow-backend.onrender.com`

---

## Step 4 — Run Database Schema

Once backend is deployed, open the Render **Shell** tab for your backend service and run:

```bash
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const sql = fs.readFileSync('src/config/schema.sql', 'utf8');
pool.query(sql).then(() => { console.log('Schema created!'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
"
```

Then create your factory admin user:

```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(\"INSERT INTO stores (name, store_code, username, password_hash, is_factory, is_active) VALUES ('Factory Admin', 'FACTORY', 'factory', 'factory123', true, true) ON CONFLICT DO NOTHING\").then(() => { console.log('Admin created! Login: factory / factory123'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
"
```

---

## Step 5 — Deploy Frontend (Static Site)

1. **Before deploying**, update `frontend/src/environments/environment.prod.ts`:
   ```ts
   export const environment = {
     production: true,
     apiUrl: 'https://orderflow-backend.onrender.com/api'
   };
   ```
   Commit and push this change.

2. Render dashboard → **New +** → **Static Site**
3. Connect same GitHub repo
4. Settings:
   - **Name**: `orderflow-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npx ng build --configuration production`
   - **Publish Directory**: `frontend/dist/frontend/browser`

5. Click **Create Static Site** — wait for build (~3-5 mins)
6. Copy your frontend URL e.g. `https://orderflow-frontend.onrender.com`

---

## Step 6 — Link Frontend URL to Backend

1. Go to your **backend** service on Render
2. Environment → Edit `FRONTEND_URL` → paste your frontend URL
3. Click **Save** — backend will redeploy automatically

---

## Done! 🎉

Open your frontend URL and login with:
- **Username**: `factory`
- **Password**: `factory123`

---

## Notes

- **Free tier spins down** after 15 mins of inactivity — first load may take 30-60 seconds
- **Uploaded images** will be lost on redeploy (free tier has no persistent disk) — for demo this is fine
- To keep the service warm, you can use a free uptime monitor like uptimerobot.com to ping `/api/health` every 10 mins
