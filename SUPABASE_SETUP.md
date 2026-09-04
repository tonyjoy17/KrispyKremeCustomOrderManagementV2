# Supabase setup

1. In Supabase SQL Editor, run `backend/src/config/schema.sql`. It preserves existing OrderFlow rows while adding any missing structures and the private image bucket.
2. In Supabase **Connect > ORMs**, choose the **Transaction pooler** connection string.
3. Configure these variables on the Render backend service:

```env
SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:DATABASE_PASSWORD@POOLER_HOST:6543/postgres
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_server_only_key
SUPABASE_STORAGE_BUCKET=order-images
```

Use the Supabase database password in `SUPABASE_DB_URL`. URL-encode special characters in the password. Never put the service-role key in the Angular frontend.

4. Remove the old `DATABASE_URL` and `UPLOAD_DIR` variables from Render after the new deployment is healthy.
5. Redeploy the backend, then confirm `/api/health` responds before testing login.

The backend keeps SQL transactions through Supabase's PostgreSQL pooler. Reference images are stored privately in Supabase Storage; authorized order-detail responses receive signed URLs valid for one hour.
