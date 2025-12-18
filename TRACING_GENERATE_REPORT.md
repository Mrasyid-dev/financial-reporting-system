# Tracing Alur Kode: Generate Report

Dokumentasi ini menjelaskan alur lengkap kode dari saat tombol "Generate Report" diklik hingga data ditampilkan di layar.

---

## 📋 Ringkasan Alur

```
Frontend (React/Next.js) 
    ↓
Tombol "Generate Report" diklik
    ↓
Handler Function (handleGenerate)
    ↓
React Query Refetch
    ↓
Service Layer (reportsService)
    ↓
API Client (axios)
    ↓
HTTP Request ke Backend
    ↓
Backend Go - Router (Gin)
    ↓
Auth Middleware (cek token)
    ↓
Handler (GetProfitLoss/GetRevenueByCategory/GetTopCustomers)
    ↓
Service Layer (Go)
    ↓
Cache Check
    ↓
Database Query (Stored Procedure)
    ↓
Response kembali ke Frontend
    ↓
React Query Update State
    ↓
UI Update (tampilkan data)
```

---

## 🔍 Detail Tracing Per Langkah

### 1️⃣ FRONTEND: Tombol Generate Report (page.tsx)

**File:** `frontend/app/reports/page.tsx`

**Lokasi:** Baris 115-131

```tsx
<button
  onClick={handleGenerate}  // ← INI YANG DIPANGGIL SAAT KLIK
  disabled={isLoading}
  className="..."
>
  Generate Report
</button>
```

**Apa yang terjadi:**
- User klik tombol "Generate Report"
- Function `handleGenerate` dipanggil

---

### 2️⃣ FRONTEND: Handler Function (handleGenerate)

**File:** `frontend/app/reports/page.tsx`

**Lokasi:** Baris 54-58

```tsx
const handleGenerate = () => {
  if (reportType === 'profit-loss') refetchPL()      // ← Jika Profit & Loss
  if (reportType === 'revenue-category') refetchRev() // ← Jika Revenue by Category
  if (reportType === 'top-customers') refetchTop()    // ← Jika Top Customers
}
```

**Apa yang terjadi:**
- Cek tipe report yang dipilih (`reportType`)
- Panggil fungsi `refetch` yang sesuai:
  - `refetchPL()` untuk Profit & Loss
  - `refetchRev()` untuk Revenue by Category
  - `refetchTop()` untuk Top Customers

**Catatan:** `refetchPL`, `refetchRev`, `refetchTop` adalah fungsi dari React Query yang dibuat di baris 36-52.

---

### 3️⃣ FRONTEND: React Query Setup

**File:** `frontend/app/reports/page.tsx`

**Lokasi:** Baris 36-52

```tsx
// Untuk Profit & Loss
const { data: profitLoss, isLoading: loadingPL, refetch: refetchPL } = useQuery({
  queryKey: ['profitLoss', startDate, endDate],  // ← Key untuk cache
  queryFn: () => reportsService.getProfitLoss(new Date(startDate), new Date(endDate)),
  enabled: reportType === 'profit-loss',
})

// Untuk Revenue by Category
const { data: revenueCategory, isLoading: loadingRev, refetch: refetchRev } = useQuery({
  queryKey: ['revenueCategory', startDate, endDate],
  queryFn: () => reportsService.getRevenueByCategory(new Date(startDate), new Date(endDate)),
  enabled: reportType === 'revenue-category',
})

// Untuk Top Customers
const { data: topCustomers, isLoading: loadingTop, refetch: refetchTop } = useQuery({
  queryKey: ['topCustomers', startDate, endDate],
  queryFn: () => reportsService.getTopCustomers(new Date(startDate), new Date(endDate), 10),
  enabled: reportType === 'top-customers',
})
```

**Apa yang terjadi:**
- React Query menyiapkan query dengan:
  - `queryKey`: identifier untuk cache
  - `queryFn`: function yang akan dipanggil untuk fetch data
  - `enabled`: hanya aktif jika report type sesuai
- Saat `refetch()` dipanggil, React Query akan menjalankan `queryFn`

**Contoh untuk Profit & Loss:**
- `refetchPL()` → memanggil `reportsService.getProfitLoss(startDate, endDate)`

---

### 4️⃣ FRONTEND: Service Layer (reportsService)

**File:** `frontend/lib/reports.ts`

**Lokasi:** Baris 45-50 (untuk Profit & Loss)

```typescript
getProfitLoss: async (startDate?: Date, endDate?: Date): Promise<ProfitLossResponse> => {
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  
  const response = await api.get<ProfitLossResponse>(`/reports/profit-loss?start_date=${start}&end_date=${end}`)
  return response.data
}
```

**Apa yang terjadi:**
1. Format tanggal menjadi string `yyyy-MM-dd`
2. Panggil `api.get()` dengan URL: `/reports/profit-loss?start_date=...&end_date=...`
3. Return data dari response

**Catatan:** `api` adalah instance axios yang sudah dikonfigurasi (lihat `lib/api.ts`)

---

### 5️⃣ FRONTEND: API Client (axios)

**File:** `frontend/lib/api.ts`

**Lokasi:** Baris 1-53

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

const api = axios.create({
  baseURL: `${API_URL}/api`,  // ← Base URL: http://localhost:8081/api
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor untuk menambahkan token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`  // ← Token ditambahkan di sini
    }
  }
  return config
})
```

**Apa yang terjadi:**
1. Buat HTTP request ke: `http://localhost:8081/api/reports/profit-loss?start_date=...&end_date=...`
2. Tambahkan header `Authorization: Bearer <token>` dari localStorage
3. Kirim request ke backend Go

**Request yang dikirim:**
```
GET http://localhost:8081/api/reports/profit-loss?start_date=2025-11-18&end_date=2025-12-18
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
```

---

### 6️⃣ BACKEND: Router Setup (Gin Framework)

**File:** `backend/internal/server/server.go`

**Lokasi:** Baris 31-70

```go
func (s *Server) setupRoutes() {
    // ... CORS middleware ...
    
    // API routes
    api := s.router.Group("/api")
    {
        // Report routes (auth required)
        reports := api.Group("/reports")
        reports.Use(s.authHandler.RequireAuth())  // ← Middleware auth dulu
        {
            reports.GET("/profit-loss", s.reportHandler.GetProfitLoss)  // ← Route ini yang dipanggil
            reports.GET("/revenue-category", s.reportHandler.GetRevenueByCategory)
            reports.GET("/top-customers", s.reportHandler.GetTopCustomers)
        }
    }
}
```

**Apa yang terjadi:**
1. Request masuk ke route `/api/reports/profit-loss`
2. Middleware `RequireAuth()` dipanggil dulu untuk cek token
3. Jika token valid, lanjut ke handler `GetProfitLoss`

---

### 7️⃣ BACKEND: Auth Middleware

**File:** `backend/internal/auth/middleware.go`

**Lokasi:** Baris 1-51

```go
func (h *Handler) RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Ambil token dari header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }
        
        // Validasi token
        // ... (cek token valid atau tidak)
        
        // Jika valid, lanjut ke handler berikutnya
        c.Next()
    }
}
```

**Apa yang terjadi:**
1. Ambil header `Authorization: Bearer <token>`
2. Validasi token (cek apakah token valid dan belum expired)
3. Jika valid → `c.Next()` (lanjut ke handler)
4. Jika tidak valid → return error 401

---

### 8️⃣ BACKEND: Handler (GetProfitLoss)

**File:** `backend/internal/reports/handler.go`

**Lokasi:** Baris 22-36

```go
func (h *Handler) GetProfitLoss(c *gin.Context) {
    // 1. Parse tanggal dari query parameter
    startDate, endDate, err := parseDateRange(c)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 2. Panggil service layer
    result, err := h.service.GetProfitLoss(c.Request.Context(), startDate, endDate)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // 3. Return JSON response
    c.JSON(http.StatusOK, result)
}
```

**Apa yang terjadi:**
1. Parse `start_date` dan `end_date` dari query parameter
2. Panggil `h.service.GetProfitLoss()` dengan tanggal tersebut
3. Jika ada error, return error response
4. Jika sukses, return JSON dengan data

**Fungsi `parseDateRange` (baris 95-114):**
- Ambil `start_date` dan `end_date` dari query string
- Parse string menjadi `time.Time`
- Validasi bahwa `startDate` tidak lebih besar dari `endDate`

---

### 9️⃣ BACKEND: Service Layer (GetProfitLoss)

**File:** `backend/internal/reports/service.go`

**Lokasi:** Baris 66-111

```go
func (s *Service) GetProfitLoss(ctx context.Context, startDate, endDate time.Time) (*ProfitLossResponse, error) {
    start := time.Now()  // ← Mulai timer untuk hitung execution time
    
    // 1. Buat cache key
    cacheKey := fmt.Sprintf("profit_loss:%s:%s", 
        startDate.Format("2006-01-02"), 
        endDate.Format("2006-01-02"))

    // 2. Cek cache dulu
    if cached, found := s.cache.Get(cacheKey); found {
        if data, ok := cached.(*ProfitLossResponse); ok {
            data.Cached = true
            data.ExecutionTimeMs = time.Since(start).Milliseconds()
            return data, nil  // ← Return dari cache jika ada
        }
    }

    // 3. Jika tidak ada di cache, query database
    rows, err := s.db.Query(ctx, "SELECT * FROM sp_profit_loss($1, $2)", startDate, endDate)
    if err != nil {
        return nil, fmt.Errorf("failed to execute stored procedure: %w", err)
    }
    defer rows.Close()

    // 4. Scan hasil query ke struct
    var results []ProfitLossRow
    for rows.Next() {
        var row ProfitLossRow
        err := rows.Scan(&row.CategoryName, &row.CategoryType, &row.TotalAmount, &row.TransactionCount)
        if err != nil {
            return nil, fmt.Errorf("failed to scan row: %w", err)
        }
        results = append(results, row)
    }

    // 5. Hitung execution time
    executionTime := time.Since(start)
    response := &ProfitLossResponse{
        Data:            results,
        ExecutionTimeMs: executionTime.Milliseconds(),
        Cached:          false,
    }

    // 6. Simpan ke cache untuk request berikutnya
    s.cache.Set(cacheKey, response)

    return response, nil
}
```

**Apa yang terjadi:**
1. **Timer dimulai** untuk hitung waktu eksekusi
2. **Cek cache** dengan key `profit_loss:2025-11-18:2025-12-18`
   - Jika ada → return langsung (cepat!)
   - Jika tidak ada → lanjut ke database
3. **Query database** menggunakan stored procedure `sp_profit_loss($1, $2)`
   - `$1` = startDate
   - `$2` = endDate
4. **Scan hasil** dari database ke struct `ProfitLossRow`
5. **Hitung execution time** (berapa milidetik yang dibutuhkan)
6. **Simpan ke cache** untuk request berikutnya
7. **Return response** dengan data, execution time, dan flag cached

**Stored Procedure:**
- `sp_profit_loss` adalah function di PostgreSQL yang sudah dibuat di migration
- File: `backend/migrations/0002_stored_procedures.sql`

---

### 🔟 BACKEND: Response Kembali ke Frontend

**Response JSON yang dikirim:**
```json
{
  "data": [
    {
      "category_name": "Cost of Goods Sold",
      "category_type": "expense",
      "total_amount": 50069700,
      "transaction_count": 795
    },
    {
      "category_name": "Marketing",
      "category_type": "expense",
      "total_amount": 50556534,
      "transaction_count": 795
    },
    // ... dst
  ],
  "execution_time_ms": 45,
  "cached": false
}
```

---

### 1️⃣1️⃣ FRONTEND: React Query Menerima Response

**File:** `frontend/app/reports/page.tsx`

**Lokasi:** Baris 36-40

```tsx
const { data: profitLoss, isLoading: loadingPL, refetch: refetchPL } = useQuery({
  queryKey: ['profitLoss', startDate, endDate],
  queryFn: () => reportsService.getProfitLoss(new Date(startDate), new Date(endDate)),
  enabled: reportType === 'profit-loss',
})
```

**Apa yang terjadi:**
1. React Query menerima response dari `reportsService.getProfitLoss()`
2. Update state `profitLoss` dengan data baru
3. Update state `isLoading` menjadi `false`
4. Trigger re-render komponen

---

### 1️⃣2️⃣ FRONTEND: UI Update (Tampilkan Data)

**File:** `frontend/app/reports/page.tsx`

**Lokasi:** Baris 137-206

```tsx
{reportType === 'profit-loss' && profitLoss && (
  <div className="bg-white rounded-xl ...">
    <h2>Profit & Loss Report</h2>
    
    {/* Tampilkan execution time dan cache status */}
    <div>
      {profitLoss.execution_time_ms}ms
      {profitLoss.cached && <span>✓ Cached</span>}
    </div>
    
    {/* Tampilkan tabel */}
    <table>
      <thead>...</thead>
      <tbody>
        {profitLoss.data.map((item: any, index: number) => (
          <tr key={index}>
            <td>{item.category_name}</td>
            <td>{item.category_type}</td>
            <td>{formatRupiah(item.total_amount)}</td>
            <td>{item.transaction_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

**Apa yang terjadi:**
1. Cek apakah `reportType === 'profit-loss'` dan `profitLoss` ada
2. Render tabel dengan data dari `profitLoss.data`
3. Tampilkan execution time dan status cache
4. Format currency dengan `formatRupiah()`

---

## 🎯 Ringkasan File yang Terlibat

### Frontend:
1. **`frontend/app/reports/page.tsx`** - UI dan handler tombol
2. **`frontend/lib/reports.ts`** - Service layer untuk API calls
3. **`frontend/lib/api.ts`** - Axios client dengan interceptors

### Backend:
1. **`backend/internal/server/server.go`** - Router setup
2. **`backend/internal/auth/middleware.go`** - Auth middleware
3. **`backend/internal/reports/handler.go`** - HTTP handler
4. **`backend/internal/reports/service.go`** - Business logic dan database query
5. **`backend/migrations/0002_stored_procedures.sql`** - Stored procedure di database

---

## 🔑 Konsep Penting

### 1. **React Query (Frontend)**
- Library untuk manage server state
- Otomatis handle loading, error, dan caching
- `useQuery` untuk fetch data
- `refetch()` untuk fetch ulang

### 2. **Axios Interceptors**
- Otomatis tambahkan token ke setiap request
- Handle error response (misal: 401 → redirect ke login)

### 3. **Gin Framework (Backend Go)**
- Web framework untuk Go
- `Group()` untuk grouping routes
- `Use()` untuk middleware
- `c.JSON()` untuk return JSON response

### 4. **Cache Layer**
- Cek cache dulu sebelum query database
- Jika ada di cache → return cepat (0-5ms)
- Jika tidak ada → query database (bisa 50-200ms)
- Simpan hasil ke cache untuk request berikutnya

### 5. **Stored Procedure**
- Function di PostgreSQL yang sudah dibuat
- Lebih cepat daripada query biasa
- Logic kompleks di database, bukan di aplikasi

---

## 🐛 Tips Debugging

### Jika data tidak muncul:
1. **Cek Network Tab** di browser DevTools
   - Apakah request dikirim?
   - Apakah response 200 OK?
   - Apakah ada error?

2. **Cek Console** di browser
   - Apakah ada error JavaScript?
   - Apakah React Query error?

3. **Cek Backend Logs**
   - Apakah request sampai ke backend?
   - Apakah ada error di handler/service?

4. **Cek Database**
   - Apakah stored procedure ada?
   - Apakah ada data di tabel?

### Jika request lambat:
1. Cek apakah cache bekerja (lihat flag `cached: true/false`)
2. Cek execution time di response
3. Cek apakah database query lambat

---

## 📝 Catatan untuk Developer Baru

### Frontend (TypeScript/React):
- `'use client'` di baris 1 = ini adalah Client Component (bisa pakai hooks)
- `useState` = untuk state management
- `useQuery` = untuk fetch data dari API
- `async/await` = untuk handle asynchronous operations

### Backend (Go):
- `func (h *Handler) MethodName()` = method pada struct Handler
- `c *gin.Context` = context dari HTTP request
- `ctx context.Context` = context untuk database operations
- `defer rows.Close()` = pastikan rows ditutup setelah selesai

---

## 🚀 Next Steps

Untuk memahami lebih dalam:
1. Baca dokumentasi React Query: https://tanstack.com/query
2. Baca dokumentasi Gin Framework: https://gin-gonic.com/docs/
3. Baca tentang PostgreSQL Stored Procedures
4. Coba tambahkan logging di setiap step untuk debugging

---

**Dibuat untuk membantu tracing alur kode Generate Report** 📊

