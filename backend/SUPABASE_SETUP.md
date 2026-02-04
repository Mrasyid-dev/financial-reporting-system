# 🚀 Supabase Setup Guide

## 📋 Environment Variables

Create a `.env` file in the `backend` folder with the following content:

```env
# Database Configuration (Supabase)
# Direct connection untuk migration dan running backend
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_USER=postgres.your-project-ref
DB_PASS=your_supabase_password
DB_NAME=postgres
DB_SCHEMA=your-schema-name

# Server Configuration
SERVER_PORT=8080
SERVER_HOST=0.0.0.0

# JWT Secret (untuk production, ganti dengan secret yang lebih secure)
JWT_SECRET=your_secure_jwt_secret_key_here

# Environment (development/production)
ENVIRONMENT=development
```

## 🗄️ Database Migration Steps

### Step 1: Create Schema

Di Supabase SQL Editor, jalankan:

```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS "financial-reporting-db";

-- Set search path
SET search_path TO "financial-reporting-db", public;
```

Atau jalankan file: `migrations/00_create_schema.sql`

### Step 2: Run Migration 1 - Init Schema

```sql
-- Set search path first
SET search_path TO "financial-reporting-db", public;

-- Then paste all content from migrations/0001_init.sql
-- Note: Migration now uses gen_random_uuid() (built-in, no extension needed)
```

### Step 3: Run Migration 2 - Stored Procedures

```sql
-- Set search path first
SET search_path TO "financial-reporting-db", public;

-- Then paste all content from migrations/0002_stored_procedures.sql
```

### Step 4: Run Migration 3 - Seed Data

⚠️ **Warning**: This will generate 100,000+ transactions and take 5-10 minutes!

```sql
-- Set search path first
SET search_path TO "financial-reporting-db", public;

-- Then paste all content from migrations/0003_seed_data.sql
```

## ✅ Verify Migration

After all migrations complete, verify in Supabase SQL Editor:

```sql
-- Check tables in schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'financial-reporting-db'
ORDER BY table_name;

-- Check data counts
SET search_path TO "financial-reporting-db";
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM accounts) as accounts,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM transaction_items) as transaction_items;
```

Expected results:
- users: 1
- categories: 8
- customers: 1,000
- accounts: 9
- transactions: ~100,000
- transaction_items: ~200,000

## 🧪 Test Backend Connection

```bash
# Navigate to backend folder
cd backend

# Run backend
go run cmd/api/main.go
```

Expected output:
```
Server starting on :8080
Database connected successfully
```

## 🔐 Demo Credentials

```
Username: demo
Password: demo123
```

## 🌐 Test API Endpoints

### Health Check
```bash
curl http://localhost:8080/api/health
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

### Get Profit & Loss Report
```bash
curl http://localhost:8080/api/reports/profit-loss?start_date=2025-01-01&end_date=2025-12-31 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deploy to Railway

After successful local testing:

1. **Push to GitHub**
2. **Create Railway Project**
3. **Add Environment Variables** (same as `.env` above)
4. **Deploy**

Railway will automatically:
- Detect Go project
- Run `go build`
- Start the server

## 📝 Notes

- Custom schema `financial-reporting-db` is used to stay within Supabase free tier (2 projects max)
- SSL is automatically enabled when connecting to Supabase
- Search path is set via connection string parameter
- All migrations must be run with `SET search_path` first
