# Deploying OrderFlow to Render (Free Tier)

## Prerequisites
- GitHub account
- Render account (render.com)
- Resend account with `kkcustomorders.com` verified

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
| `JWT_EXPIRES_IN` | `30d` |
| `FACTORY_EMAIL` | your factory email |
| `EMAIL_FROM` | `Krispy Kreme Custom Orders <orders@kkcustomorders.com>` |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `2465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | your Resend API key (`re_...`) |
| `APP_TIME_ZONE` | `Australia/Adelaide` |
| `DAILY_FACTORY_REPORT_TIME` | `14:30` |
| `DAILY_RETAIL_REPORT_TIME` | `06:00` |
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
7. Under **Headers**, add `Cache-Control: no-cache` for path `/*`. This prevents cached HTML from referencing JavaScript chunks removed by a newer deployment.

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

---

## Daily email jobs

1. In Supabase SQL Editor, run `backend/supabase/migrations/20260906_scheduled_email_log.sql`.
2. Make sure every retail/pickup store that should receive a morning report has an email address in its store profile.
3. In Render, create one **Cron Job** from the same repository:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Command: `npm run email:scheduled`
   - Schedule: `*/30 * * * *`
4. Add the same Supabase and Resend environment variables used by the backend, plus the three scheduling variables shown above.

The command checks Adelaide local time, so daylight-saving changes are handled automatically. The database log prevents the same report being sent twice. At 2:30 PM the factory receives tomorrow's production list. At 6:00 AM each active retail store with an email receives its own pickup list for today, including a zero-order confirmation when applicable.
