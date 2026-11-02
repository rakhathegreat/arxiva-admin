# Taslim Admin

Aplikasi web (React + Vite + TypeScript + Tailwind v4) untuk admin inventori Taslim.
Tidak lagi memakai Tauri — build berupa SPA statis yang di-deploy ke Vercel.

## Menjalankan

```bash
cp .env.example .env   # isi VITE_URL ke base URL backend
npm install
npm run dev            # http://localhost:5173
```

## Skrip

| Skrip             | Fungsi                        |
| ----------------- | ----------------------------- |
| `npm run dev`     | Dev server Vite (semua host)  |
| `npm run build`   | Typecheck (`tsc`) + build SPA |
| `npm run preview` | Preview hasil build           |
| `npm run test`    | Unit test (vitest)            |
| `npm run lint`    | ESLint                        |

## Deploy ke Vercel

1. Import repo, set **Root Directory** ke `arxiva-admin`.
2. Framework terdeteksi otomatis sebagai Vite (`vercel.json` menetapkan build & rewrite SPA).
3. Tambahkan environment variable `VITE_URL` (base URL backend, tanpa trailing slash).
   `URL` juga masih didukung untuk kompatibilitas.
4. Routing memakai `BrowserRouter`, jadi semua path di-rewrite ke `index.html`.

API diakses langsung dari browser, sehingga backend harus mengizinkan origin Vercel
lewat `CORS_ORIGINS`.