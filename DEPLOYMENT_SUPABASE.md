# 🚀 Deployment Guide - Supabase Setup

## ✅ Perubahan yang Sudah Diimplementasikan

### 1. **Backend Config Updated** (`backend/internal/config/config.go`)
- ✅ Tambah field `DBSchema` untuk support custom schema
- ✅ Auto-detect SSL mode (require untuk Supabase)
- ✅ Auto-append `search_path` parameter ke connection string
- ✅ Backward compatible dengan setup Docker lokal

### 2. **File Baru yang Dibuat**

| File | Deskripsi |
|------|-----------|
| `backend/migrations/00_create_schema.sql` | SQL untuk create schema di Supabase |
| `backend/SUPABASE_SETUP.md` | Panduan lengkap setup Supabase |
| `backend/ENV_TEMPLATE.txt` | Template file .env dengan credentials Anda |

### 3. **Documentation Updated**
- ✅ README.md - tambah info Supabase di infrastructure
- ✅ Deployment guide lengkap

---

## 📝 Langkah Selanjutnya (Yang Perlu Anda Lakukan)

### Step 1: Buat File `.env`

```bash
# Di folder backend
cd D:\porto\financial-reporting-system\backend

# Copy template
copy ENV_TEMPLATE.txt .env
```

File `.env` template (update dengan credentials Anda):

```env
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_USER=postgres.your-project-ref
DB_PASS=your_supabase_password
DB_NAME=postgres
DB_SCHEMA=your-schema-name
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
JWT_SECRET=your_secure_jwt_secret_key_here
ENVIRONMENT=development
```

### Step 2: Jalankan Migration di Supabase

Buka **Supabase Dashboard** → **SQL Editor**

#### Migration 0: Create Schema
```sql
CREATE SCHEMA IF NOT EXISTS "financial-reporting-db";
SET search_path TO "financial-reporting-db", public;
```

#### Migration 1: Init Tables
```sql
SET search_path TO "financial-reporting-db", public;
-- Copy paste semua isi dari backend/migrations/0001_init.sql
-- Note: Uses gen_random_uuid() (built-in PostgreSQL 13+, no extension needed)
```

#### Migration 2: Stored Procedures
```sql
SET search_path TO "financial-reporting-db", public;
-- Copy paste semua isi dari backend/migrations/0002_stored_procedures.sql
```

#### Migration 3: Seed Data (⚠️ Takes 5-10 minutes)
```sql
SET search_path TO "financial-reporting-db", public;
-- Copy paste semua isi dari backend/migrations/0003_seed_data.sql
```

### Step 3: Verifikasi Migration

```sql
-- Check tables
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
  (SELECT COUNT(*) FROM transactions) as transactions;
```

Expected:
- users: 1
- categories: 8
- customers: 1,000
- transactions: ~100,000

### Step 4: Test Backend Locally

```bash
# Di folder backend
cd D:\porto\financial-reporting-system\backend

# Run backend
go run cmd/api/main.go
```

Expected output:
```
Server starting on :8080
Database connected successfully
```

### Step 5: Test API

Buka browser atau Postman:

```bash
# Health check
http://localhost:8080/api/health

# Login
POST http://localhost:8080/api/auth/login
Body: {"username":"demo","password":"demo123"}
```

---

## 🎯 Demo Credentials

```
Username: demo
Password: demo123
```

---

## 🚀 Deploy ke Railway (Setelah Testing Berhasil)

### Environment Variables untuk Railway:

```env
DB_HOST=your-supabase-host.supabase.com
DB_PORT=5432
DB_USER=postgres.your-project-ref
DB_PASS=your_supabase_password_url_encoded
DB_NAME=postgres
DB_SCHEMA=your-schema-name
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
JWT_SECRET=your_secure_jwt_secret_key_here
ENVIRONMENT=production
```

### Railway Build Settings:

- **Build Command**: `go build -o main ./cmd/api`
- **Start Command**: `./main`
- **Root Directory**: `backend`

---

## 📊 Monitoring

### Check Database Size di Supabase:
- Dashboard → Database → Database Size
- Free tier: 500 MB

### Check API Performance:
- Railway Dashboard → Metrics
- Monitor CPU, Memory, Response time

---

## ⚠️ Troubleshooting

### Error: "relation does not exist"
**Solution**: Pastikan `DB_SCHEMA` di `.env` sudah benar dan migration sudah dijalankan dengan `SET search_path`

### Error: "SSL connection required"
**Solution**: Sudah auto-handled di config.go, pastikan `DB_HOST` bukan localhost

### Error: "password authentication failed"
**Solution**: Check password di Supabase Dashboard → Settings → Database → Reset password

---

## 📚 Referensi

- [SUPABASE_SETUP.md](backend/SUPABASE_SETUP.md) - Panduan detail setup
- [ENV_TEMPLATE.txt](backend/ENV_TEMPLATE.txt) - Template environment variables
- [DEPLOYMENT_PLAN.md](../porto2.0/DEPLOYMENT_PLAN.md) - Master deployment plan

---

**Status**: ✅ Backend siap untuk testing migration ke Supabase!

**Next Step**: Jalankan migration di Supabase SQL Editor, lalu test backend locally.
