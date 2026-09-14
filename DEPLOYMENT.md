# Deployment Guide - Venture Built Club

Deploy frontend + backend to Vercel with Supabase PostgreSQL database.

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up (free)
2. Create a new project
3. In Project Settings → Database, copy the connection string
4. Run migrations:
   - Go to SQL Editor in Supabase
   - Copy the entire content of `backend/schema.sql`
   - Paste and run in Supabase SQL Editor

## Step 2: Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your Venture Built Club project
3. Go to Settings → Environment Variables
4. Add these variables:

```
DATABASE_URL = postgresql://[user]:[password]@[host]:[port]/[database]
JWT_SECRET = your-secret-key-here (generate a random string)
```

Get DATABASE_URL from Supabase:
- Go to Supabase Project Settings → Database
- Copy "URI" under Connection Pooling (use this for serverless)

## Step 3: Deploy to Vercel

```bash
git push origin main
```

Vercel will automatically:
- Build the frontend (index.html)
- Deploy serverless API functions from `/api` folder
- Use environment variables you set

## API Endpoints

Your API will be available at:
```
https://your-vercel-domain.vercel.app/api/auth/login
https://your-vercel-domain.vercel.app/api/auth/register
https://your-vercel-domain.vercel.app/api/events/list
```

## Testing Locally

1. Create `.env.local`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret
```

2. Run:
```bash
npm install
vercel dev
```

Server runs on http://localhost:3000

## Troubleshooting

**Connection pooling issues:**
- Use Connection Pooling URI from Supabase (not direct connection)
- Set to "Transaction" mode if using Prisma/ORM

**Environment variables not loading:**
- Redeploy after adding env vars: `vercel --prod`
- Check Vercel dashboard Function Logs

**Database migration errors:**
- Ensure all tables created in Supabase SQL Editor
- Check user/role permissions in database

## Next Steps

1. Connect frontend Log In button to `/api/auth/login`
2. Build admin dashboard app
3. Add file upload to resources
4. Set up email notifications
