# Setup Guide - Getting Your Project Running

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Create Environment File

Create a `.env.local` file in the project root with the following:

```env
# Database Connection (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/mauluna_db?schema=public"

# JWT Secrets (REQUIRED)
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_ADMIN_SECRET="your-admin-secret-key-change-this-in-production"

# AWS S3 Configuration (Required for image uploads)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="eu-north-1"
AWS_S3_BUCKET_NAME="mauluna-immobiliare-photobucket"

# Email Service (Resend) - Optional for development
RESEND_API_KEY="re_4YWGnPgh_Mq867tg553vNXQE81TZB4zSo"

# Google Maps API - Optional for development
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
```

**Important:** Replace `DATABASE_URL` with your actual PostgreSQL connection string.

### 4. Run Database Migrations
```bash
npm run prisma:migrate
```

This will create all the database tables.

### 5. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Troubleshooting

### Error: "DATABASE_URL is not set"
- Make sure you created `.env.local` file in the project root
- Check that `DATABASE_URL` is correctly formatted
- Restart your terminal/IDE after creating `.env.local`

### Error: "Prisma Client not generated"
- Run `npm run prisma:generate`
- Make sure `node_modules/.prisma` folder exists

### Error: "Cannot connect to database"
- Verify your PostgreSQL server is running
- Check your `DATABASE_URL` connection string
- Ensure the database exists (create it if needed)

### Error: "Port 3000 already in use"
- Stop other processes using port 3000
- Or change the port: `npm run dev -- -p 3001`

## Database Setup

### Option 1: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database: `CREATE DATABASE mauluna_db;`
3. Update `DATABASE_URL` in `.env.local`

### Option 2: Cloud Database (Recommended)
- Use services like:
  - [Neon](https://neon.tech) (Free tier available)
  - [Supabase](https://supabase.com) (Free tier available)
  - [Railway](https://railway.app) (Free tier available)
- Copy the connection string to `DATABASE_URL`

## Next Steps

After setup:
1. Create an admin user in the database (see PROJECT_STATUS.md)
2. Test the login/register functionality
3. Try adding a property listing
4. Access admin dashboard at `/admin`




