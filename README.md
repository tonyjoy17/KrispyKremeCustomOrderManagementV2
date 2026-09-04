# OrderFlow — Retail Order Management System

A full-stack web application for managing orders across 7 retail stores and 1 production factory.

## Tech Stack
- **Frontend**: Angular 17 + TypeScript (standalone components)
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT
- **Email**: Nodemailer (SMTP)

---

## Project Structure

```
orderflow/
├── backend/
│   ├── .env.example              ← copy to .env and fill in your values
│   ├── package.json
│   └── src/
│       ├── index.js              ← Express app entry point
│       ├── config/
│       │   ├── database.js       ← PostgreSQL connection pool
│       │   ├── email.js          ← Nodemailer + HTML email template
│       │   └── schema.sql        ← Run this to set up the database
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── orders.controller.js
│       │   └── stores.controller.js
│       ├── middleware/
│       │   └── auth.js           ← JWT verify, factory/retail guards
│       └── routes/
│           ├── auth.routes.js
│           ├── orders.routes.js
│           └── stores.routes.js
│
└── frontend/
    ├── angular.json
    ├── tsconfig.json
    ├── proxy.conf.json           ← Dev proxy → backend:3000
    ├── package.json
    └── src/
        ├── index.html
        ├── main.ts
        ├── styles.css
        ├── environments/
        │   ├── environment.ts
        │   └── environment.prod.ts
        └── app/
            ├── app.component.ts
            ├── app.config.ts
            ├── app.routes.ts
            ├── guards/
            │   └── auth.guard.ts
            ├── models/
            │   └── index.ts
            ├── services/
            │   ├── auth.service.ts
            │   ├── auth.interceptor.ts
            │   ├── orders.service.ts
            │   └── stores.service.ts
            └── pages/
                ├── login/
                │   └── login.component.ts
                ├── retail/
                │   ├── retail-layout.component.ts
                │   ├── dashboard/dashboard.component.ts
                │   ├── new-order/new-order.component.ts
                │   └── orders/orders.component.ts
                └── factory/
                    ├── factory-layout.component.ts
                    ├── dashboard/factory-dashboard.component.ts
                    ├── orders/factory-orders.component.ts
                    └── stores/stores.component.ts
```

---

## Setup Instructions

### Step 1 — Supabase database

Create a Supabase project, copy its Transaction pooler URI, and follow [SUPABASE.md](SUPABASE.md). Then run:

```bash
# Configure the Supabase API client
cd backend
npm install
cp .env.example .env
# Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env

# Verify the connection
npm run db:check
```

### Step 2 — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_secret_key

JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=8h

FACTORY_EMAIL=factory@yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

> **Gmail tip**: Use an App Password (not your regular password). Go to Google Account → Security → 2-Step Verification → App passwords.

```bash
npm run dev     # starts on http://localhost:3000
```

### Step 3 — Frontend

```bash
cd frontend
npm install
ng serve        # starts on http://localhost:4200
```

Open **http://localhost:4200**

---

## Default Login

| Role    | Username  | Password     |
|---------|-----------|--------------|
| Factory | `factory` | `factory123` |

> ⚠️ Change the factory password immediately after first login via the database or by adding a change-password feature.

Retail store accounts are created by the Factory admin under **Manage Stores**.

---

## Features

### Retail Portal
- Login with store credentials
- **New Order** form: customer name, phone, email (optional), order details, paid/unpaid toggle, reference image upload, pickup store, pickup date
- Auto-sends branded HTML email to factory on submission
- **Dashboard**: today's pickups + stats (today / upcoming / paid / total)
- **All Orders**: filter by today / upcoming / past, paginated table

### Factory Portal
- **Dashboard**: tomorrow's pickup orders highlighted (make today!)
- **All Orders**: view all stores, filter by tomorrow / upcoming / past, update order status live
- **Manage Stores**: register new retail stores with login credentials, activate/deactivate stores, reset passwords

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (retail or factory) |
| PUT | `/api/auth/change-password` | Change password |
| GET | `/api/auth/me` | Get current store info |

### Orders
| Method | Path | Access |
|--------|------|--------|
| POST | `/api/orders` | Retail — create order |
| GET | `/api/orders/retail/dashboard` | Retail — dashboard stats |
| GET | `/api/orders/retail/orders` | Retail — order list |
| GET | `/api/orders/factory/dashboard` | Factory — tomorrow's orders |
| GET | `/api/orders/factory/orders` | Factory — all orders |
| PUT | `/api/orders/:id/status` | Factory — update status |
| GET | `/api/orders/:id` | Get single order |

### Stores
| Method | Path | Access |
|--------|------|--------|
| GET | `/api/stores` | Factory — all retail stores |
| GET | `/api/stores/dropdown` | Auth — stores for dropdown |
| POST | `/api/stores` | Factory — register store |
| PATCH | `/api/stores/:id/toggle-status` | Factory — activate/deactivate |
| PUT | `/api/stores/:id/reset-password` | Factory — reset password |
