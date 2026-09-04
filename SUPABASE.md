# Supabase setup

This application uses the Supabase Data API through the official JavaScript client. Access remains server-side through Express; no secret key belongs in the Angular frontend.

## Connect

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → API Keys**.
3. Copy the project URL and the backend-only secret key (`sb_secret_...`). A legacy `service_role` key also works.
4. Create `backend/.env` from `backend/.env.example` and set:

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_secret_key
SUPABASE_STORAGE_BUCKET=order-images
```

Never commit `.env`, and never put the secret key in an Angular environment file.

## Install and verify the schema

Paste `backend/src/config/schema.sql` into the Supabase SQL Editor and run it. Schema creation cannot be performed through the Data API.

Then verify the backend connection:

```bash
cd backend
npm install
npm run db:check
```

Existing PostgreSQL data is not copied automatically. Export it with `pg_dump` and restore it to Supabase before switching the production backend to the Supabase API configuration.

## Architecture note

The backend uses `@supabase/supabase-js` for database operations and the private `order-images` Storage bucket. Authentication remains the application's JWT store login.
