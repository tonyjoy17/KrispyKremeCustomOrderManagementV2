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

## Step 2 — Create a Supabase database

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor**, paste `backend/src/config/schema.sql`, and run it.
3. Open **Project Settings → API Keys** and copy the project URL and secret key.

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
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SECRET_KEY` | your backend-only `sb_secret_...` key |
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

Once the backend is deployed, open its Render **Shell** tab and verify the API connection:

```bash
npm run db:check
```

The schema itself is installed in the Supabase SQL Editor in Step 2.

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
