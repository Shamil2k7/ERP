# 🚀 Complete Vercel Deployment Guide for ERP System

This guide walks you step-by-step through deploying your fullstack ERP system (Next.js 16 frontend + Express/Prisma backend) to **Vercel**.

---

## 📋 Table of Contents
1. [Architecture & Deployment Options](#1-architecture--deployment-options)
2. [Step 1: Set Up Cloud PostgreSQL Database](#step-1-set-up-cloud-postgresql-database)
3. [Step 2: Initialize Database Schema (Tables)](#step-2-initialize-database-schema-tables)
4. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
5. [Step 4: Deploy Backend](#step-4-deploy-backend)
   - [Option A: Deploy Backend on Vercel (Serverless)](#option-a-deploy-backend-on-vercel-serverless)
   - [Option B: Deploy Backend on Render / Railway (Recommended for WebSockets)](#option-b-deploy-backend-on-render--railway-recommended-for-websockets)
6. [Step 5: Connect Frontend to Backend](#step-5-connect-frontend-to-backend)
7. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Architecture & Deployment Options

Your ERP repository is organized as a monorepo:
- `frontend/` - Next.js 16 App Router (React 19, Tailwind CSS, MUI, Redux Toolkit)
- `backend/` - Node.js Express 5, Prisma ORM, PostgreSQL, Socket.io, Multer

### Which deployment strategy should you use?

| Component | Recommended Host | Why? |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Next.js is developed by Vercel. You get native edge caching, global CDN, instant deployments, and zero configuration. |
| **Backend** | **Vercel (Serverless)** OR **Render / Railway** | **Vercel Serverless** works great for standard REST APIs.<br><br>⚠️ *Note:* If you rely heavily on persistent **real-time WebSockets (`Socket.io`)** for instant kitchen display updates or local `/uploads` storage, deploying the backend to **Render** or **Railway** gives you a persistent Node.js server. |

---

## Step 1: Set Up Cloud PostgreSQL Database

Because Vercel runs in the cloud, it cannot connect to your local `localhost:5432` database. You need a free cloud PostgreSQL database.

### Recommended Providers:
1. **[Neon](https://neon.tech/)** *(Recommended - Fastest serverless Postgres)*:
   - Sign up at [neon.tech](https://neon.tech/).
   - Click **Create Project**.
   - Copy the **Connection String** (choose "Pooled connection" for serverless).
   - Format: `postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/neondb?sslmode=require`

2. **[Supabase](https://supabase.com/)**:
   - Sign up at [supabase.com](https://supabase.com/).
   - Create a new project.
   - Go to **Project Settings > Database > Connection pooling**.
   - Copy the `URI` (transaction mode, port 6543).

---

## Step 2: Initialize Database Schema (Tables)

Before deploying, push your Prisma database schema to your new cloud database from your local machine:

1. In your `backend/.env` file, temporarily update `DATABASE_URL` with your cloud connection string:
   ```env
   DATABASE_URL="your-cloud-postgresql-connection-string"
   ```

2. Open your terminal in the `backend` directory and push the schema:
   ```bash
   cd backend
   npx prisma db push --schema=prisma/schema.prisma
   ```

3. *(Optional)* Seed initial data (admin roles, categories, default settings):
   ```bash
   npm run db:seed
   ```

---

## Step 3: Deploy Frontend to Vercel

1. Push your latest code to your **GitHub** or **GitLab** repository:
   ```bash
   git add .
   git commit -m "Configure project for Vercel deployment"
   git push origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... > Project**.

3. Select your Git repository and click **Import**.

4. Configure the Project Settings:
   - **Project Name**: `erp-frontend` (or any name you prefer)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select **`frontend`**
   - **Build Command**: `next build` (leave default)
   - **Output Directory**: `.next` (leave default)
   - **Install Command**: `npm install` (leave default)

5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://your-backend-url.vercel.app` | Leave as temporary URL or set to your backend URL once deployed. |

6. Click **Deploy**. Vercel will build and launch your frontend! 🎉

---

## Step 4: Deploy Backend

### Option A: Deploy Backend on Vercel (Serverless)

We have already configured `backend/api/index.js` and `backend/vercel.json` for you.

1. In your [Vercel Dashboard](https://vercel.com/dashboard), click **Add New... > Project**.
2. Select the **same Git repository** and click **Import**.
3. Configure the Project Settings:
   - **Project Name**: `erp-backend`
   - **Framework Preset**: `Other`
   - **Root Directory**: Click **Edit** and select **`backend`**
   - **Build Command**: `npm run build` *(This generates the Prisma Client automatically)*
   - **Output Directory**: Leave empty
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `DATABASE_URL` | `your-cloud-postgresql-connection-string?sslmode=require` |
   | `JWT_SECRET` | `your-production-jwt-secret-key` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `EMAIL_USER` | `your-email@gmail.com` |
   | `EMAIL_PASS` | `your-app-specific-password` |
5. Click **Deploy**.
6. When complete, copy your deployed backend URL (e.g. `https://erp-backend-xyz.vercel.app`).

---

### Option B: Deploy Backend on Render / Railway (Recommended for WebSockets)

If you need continuous **Socket.io** connections for real-time kitchen orders/POS or local image uploads:

#### Deploying on [Render](https://render.com/):
1. Create a new **Web Service** on Render and connect your GitHub repo.
2. Settings:
   - **Name**: `erp-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Add the environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.).
4. Click **Deploy**.

---

## Step 5: Connect Frontend to Backend

Now that your backend is running:

1. Copy your live backend URL (e.g., `https://erp-backend-xyz.vercel.app` or `https://erp-backend.onrender.com`).
2. Go to your **`erp-frontend`** project in the Vercel Dashboard.
3. Navigate to **Settings > Environment Variables**.
4. Update or add `NEXT_PUBLIC_API_URL`:
   - Value: `https://erp-backend-xyz.vercel.app` *(without trailing slash)*
5. Go to the **Deployments** tab and click **Redeploy** on the latest deployment so the new environment variable takes effect.

Your frontend is now fully connected to your live cloud backend! 🚀

---

## Troubleshooting & FAQs

### Q: Why do I get a database connection error during build?
**A**: Ensure `DATABASE_URL` is configured in your Vercel project's Environment Variables and that the PostgreSQL database allows connections from anywhere (`0.0.0.0/0`, default on Neon/Supabase).

### Q: Why are my uploads not saving permanently on Vercel serverless backend?
**A**: Vercel Serverless Functions have an ephemeral (temporary) file system. For permanent file storage, use a persistent host (Render/Railway) or upload to a cloud service (Cloudinary, AWS S3, or Supabase Storage).

### Q: Does CORS block requests between frontend and backend?
**A**: Your backend `app.js` has `cors({ origin: true, credentials: true })` and normalized cookies (`sameSite: "none", secure: true`), which automatically accommodates cross-origin requests between your Vercel frontend and backend.
