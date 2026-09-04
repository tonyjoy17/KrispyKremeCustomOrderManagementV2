# OrderFlow — Retail Order Management System

A full-stack application for managing orders across retail stores and a production factory.

## Tech stack

- Frontend: Angular 17 + TypeScript
- Backend: Node.js + Express
- Database and file storage: Supabase
- Authentication: existing server-issued JWT login
- Email: Nodemailer (SMTP)

The Supabase service-role key is used only by the Express backend. It must never be placed in the Angular environment files or committed to source control.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste [backend/src/config/schema.sql](backend/src/config/schema.sql), and run it.
3. In **Project Settings > API**, copy the project URL and service-role key.
4. Copy `backend/.env.example` to `backend/.env` and fill in the values:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=order-images

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=8h
APP_TIME_ZONE=Australia/Adelaide

FACTORY_EMAIL=factory@yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_email@gmail.com
SMTP_PASS=your_app_password

MAX_FILE_SIZE=5242880
FRONTEND_URL=http://localhost:4200
```

The migration performs a destructive reset, then creates the tables, indexes, update triggers, atomic order-number function, public `order-images` Storage bucket, factory account, and retail test account.

## Run locally

```bash
cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`. The backend health endpoint is `http://localhost:3000/health`.

## Default login

| Role | Username | Password |
|---|---|---|
| Factory | `factory` | `factory123` |
| Retail test store | `teststore` | `test123` |

Change the factory password after first login.

## Migrating existing PostgreSQL data

If this app already has production data, create the Supabase schema first and then copy the `stores` and `orders` rows using `pg_dump`/`psql` or Supabase's database migration tooling. Preserve UUIDs and import `stores` before `orders`. After importing, set the order-number sequence above the largest existing numeric suffix:

```sql
select setval(
  'public.order_number_seq',
  greatest(
    1000,
    coalesce((select max(split_part(order_number, '-', 3)::bigint) from public.orders), 1000)
  )
);
```

Existing local image files are not copied automatically. Upload them to the `order-images` bucket and update `orders.reference_image_path` with each object's bucket-relative path.

## API

The frontend-facing endpoints are unchanged:

- `POST /api/auth/login`, `PUT /api/auth/change-password`, `GET /api/auth/me`
- `POST /api/orders`
- `GET /api/orders/retail/dashboard`, `GET /api/orders/retail/orders`
- `GET /api/orders/factory/dashboard`, `GET /api/orders/factory/orders`
- `PUT /api/orders/:id/status`, `GET /api/orders/:id`
- `GET /api/stores`, `GET /api/stores/dropdown`, `POST /api/stores`
- `PATCH /api/stores/:id/toggle-status`, `PUT /api/stores/:id/reset-password`
