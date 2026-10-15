# CMNTY Deploy — Cloud Edge Deployment Platform

<p align="center">
  <strong>Platform Deployment Web Real-Time Berkinerja Tinggi dengan Routing Edge Otomatis.</strong><br>
  Deploy berkas HTML atau arsip ZIP proyek web statis secara instan dengan subdomain otomatis (*.cmnty.biz.id), sertifikat SSL otomatis, dan deteksi variabel lingkungan real-time.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.4-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/Database-Pure_JSON-amber?style=flat-square" alt="Database JSON">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

---
### One-click Deployment
Cara tercepat untuk menggunakannya secara privat di PaaS yang tersedia.

<a href="https://vercel.com/new/clone?repository-url=https://github.com%2FCreatorsitee%2Fdeploy%2Ftree%2Fmain">
  <img alt="Deploy with Vercel" src="https://vercel.com/button" height="32" />
</a>
<a href="https://app.koyeb.com/deploy?type=git&repository=github.com/Creatorsitee/deploy=main&name=deploy">
  <img alt="Deploy with Koyeb" src="https://www.koyeb.com/static/images/deploy/button.svg" height="32" />
</a>
<a href="https://render.com/deploy">
  <img alt="Deploy with Render" src="https://render.com/images/deploy-to-render-button.svg" height="32" />
</a>

### Open in

<a href="https://idx.google.com/import?url=https://github.com/Creatorsitee/deploy">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.idx.dev/btn/open_light_32.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://cdn.idx.dev/btn/open_dark_32.svg">
    <img height="32" alt="Open in IDX" src="https://cdn.idx.dev/btn/open_purple_32.svg">
  </picture>
</a>
<a href="https://gitpod.io/#https://github.com/Creatorsitee/deploy">
  <img alt="Open in Gitpod" src="https://gitpod.io/button/open-in-gitpod.svg" height="32" />
</a>
<a href="https://codespaces.new/Creatorsitee/deploy">
  <img alt="Open in GitHub Codespaces" src="https://github.com/codespaces/badge.svg" height="32" />
</a>


## Daftar Isi

- [Arsitektur & Gambaran Umum](#arsitektur--gambaran-umum)
- [Fitur Utama](#fitur-utama)
- [Struktur Direktori Proyek](#struktur-direktori-proyek)
- [Alur Kerja Deployment](#alur-kerja-deployment)
- [Struktur Database JSON](#struktur-database-json)
- [Panduan Environment Variables](#panduan-environment-variables)
- [Instalasi & Menjalankan Proyek](#instalasi--menjalankan-proyek)
- [Daftar Endpoint API](#daftar-endpoint-api)
- [Konfigurasi DNS & Domain](#konfigurasi-dns--domain)
- [Admin Panel](#admin-panel)

---

## Arsitektur & Gambaran Umum

CMNTY Deploy dibangun menggunakan Next.js 15 App Router dan Tailwind CSS v4 dengan sistem database file JSON atomik (`.data/cmnty_db.json`). Seluruh proses deployment beroperasi secara langsung dan real-time melalui integrasi Vercel Edge Cloud API tanpa dependensi eksternal yang rumit.

```text
               +-------------------------------------------------+
               |              Pengguna / Developer               |
               +-------------------------------------------------+
                                       |
                   (Upload ZIP / HTML Tunggal & Atur Env)
                                       v
               +-------------------------------------------------+
               |              CMNTY Web Platform                 |
               |  (Next.js 15, Tailwind v4, Motion Animations)   |
               +-------------------------------------------------+
                         /             |             \
                        /              |              \
                       v               v               v
          +------------------+ +---------------+ +------------------+
          |  Auth & Session  | | Database JSON | |   Env Scanner    |
          |  (PBKDF2/Cookie) | | (.data/*.json)| | (Auto-Detect Env)|
          +------------------+ +---------------+ +------------------+
                                       |
                                       v
               +-------------------------------------------------+
               |             Vercel Cloud Edge API               |
               |      (Global Edge Routing, CDN & SSL Auto)      |
               +-------------------------------------------------+
                                       |
                                       v
               +-------------------------------------------------+
               |    Live URL: https://[project-slug].cmnty.biz.id |
               +-------------------------------------------------+
```

---

## Fitur Utama

- **Real-Time Instant Deploy**: Unggah berkas tunggal HTML atau arsip ZIP proyek web statis (React, Vite, HTML/CSS/JS, Astro, Svelte). Seluruh pipeline diproses secara langsung dan real-time.
- **Subdomain Otomatis & Gratis**: Setiap proyek langsung mendapatkan live subdomain publik aktif `[slug].cmnty.biz.id` dengan SSL otomatis.
- **Smart Environment Auto-Detector**: Memindai berkas `.env`, `.env.example`, `.env.sample`, dan kode sumber di dalam ZIP saat proses upload untuk mendeteksi key dan value secara otomatis.
- **Dukungan Custom Domain**: Pengguna dapat menambahkan domain kustom sendiri lengkap dengan instruksi verifikasi DNS dan pemantauan status SSL.
- **Minimalist Build Inspector**: Tampilan modal log ringkas untuk memantau proses deployment baris demi baris secara real-time.
- **Transisi Antarmuka Halus**: Navigasi responsif dan modal dilengkapi animasi halus menggunakan `motion/react`.
- **Fair-Use Quotas & Proteksi**:
  - Kuota maksimal proyek per akun (3 proyek).
  - Batas maksimal deployment harian (10 build per hari).
  - Proteksi kata kunci reserved (mencegah pembuatan subdomain seperti `api`, `admin`, `login`, `dashboard`, `docs`, `www`).
- **Admin Panel Terintegrasi**: Pengelolaan pengguna terdaftar, audit aktivitas sistem, manajemen domain dasar, dan konfigurasi server.

---

## Struktur Direktori Proyek

```text
├── app/
│   ├── admin/
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── admin/
│   │   │   ├── database/reset/route.ts
│   │   │   ├── overview/route.ts
│   │   │   ├── projects/[id]/suspend/route.ts
│   │   │   ├── settings/route.ts
│   │   │   └── users/[id]/route.ts
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── reset-password/route.ts
│   │   ├── config/route.ts
│   │   ├── deployments/[id]/route.ts
│   │   ├── domains/[id]/verify/route.ts
│   │   ├── frameworks/route.ts
│   │   └── projects/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── deploy/route.ts
│   │           ├── deployments/route.ts
│   │           ├── domains/
│   │           │   ├── route.ts
│   │           │   └── verify/route.ts
│   │           ├── env/route.ts
│   │           └── route.ts
│   ├── dashboard/
│   │   ├── new/
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── usage/
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── docs/
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── forgot-password/
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── login/
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── register/
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── page.tsx
│
├── components/
│   ├── DashboardLayout.tsx
│   ├── DeploymentStatusBadge.tsx
│   ├── EnvVarEditor.tsx
│   ├── Footer.tsx
│   ├── FrameworkIcon.tsx
│   ├── Navbar.tsx
│   ├── NavigationSkeleton.tsx
│   ├── Providers.tsx
│   └── SslStatusBadge.tsx
│
├── lib/
│   ├── auth/
│   │   ├── client.ts
│   │   ├── crypto.ts
│   │   └── session.ts
│   ├── contexts/
│   │   └── ToastContext.tsx
│   ├── db/
│   │   └── store.ts
│   ├── security/
│   │   ├── rate-limit.ts
│   │   └── sanitize.ts
│   ├── vercel/
│   │   ├── client.ts
│   │   ├── deployments.ts
│   │   ├── diagnostics.ts
│   │   ├── domains.ts
│   │   ├── frameworks.ts
│   │   └── projects.ts
│   ├── deployment-service.ts
│   ├── env-detector.ts
│   ├── fetch-utils.ts
│   ├── types.ts
│   ├── utils.ts
│   └── validation.ts
│
├── .data/
│   └── cmnty_db.json
├── .env.example
├── next.config.ts
├── package.json
├── railway.json
└── tsconfig.json
```

---

## Alur Kerja Deployment

1. **Pemilihan Sumber Proyek**:
   Pengguna mengunggah arsip berkas ZIP proyek web atau satu berkas HTML mandiri.
2. **Inspeksi Berkas & Auto-Detect**:
   Sistem mengekstrak struktur berkas di memory buffer, memindai deklarasi environment variables, dan mengisi konfigurasi yang disarankan secara otomatis.
3. **Penyimpanan Metadata & Quota Check**:
   Sistem memvalidasi kuota aktif (maksimal 3 proyek) dan ketersediaan batas deploy harian (10 build) di database JSON, serta memastikan slug subdomain valid dan bukan reserved keyword.
4. **Provisioning ke Cloud Edge**:
   Proyek dikirim langsung ke Vercel Edge API menggunakan token yang terkonfigurasi pada server. Subdomain `[slug].cmnty.biz.id` dipetakan secara real-time.
5. **Live Monitoring**:
   Status deployment dan URL publik langsung tersedia setelah proses sinkronisasi selesai.

---

## Struktur Database JSON

Data aplikasi disimpan secara terstruktur dan terisolasi pada berkas `.data/cmnty_db.json`:

```json
{
  "users": [
    {
      "id": "usr_xxxx",
      "email": "user@example.com",
      "name": "Developer Name",
      "passwordHash": "pbkdf2_xxxxxxxx",
      "role": "user",
      "createdAt": "2026-09-29T02:00:00.000Z"
    }
  ],
  "projects": [
    {
      "id": "prj_xxxx",
      "userId": "usr_xxxx",
      "name": "Portofolio Web",
      "slug": "portofolio-web",
      "framework": "vite",
      "subdomain": "portofolio-web.cmnty.biz.id",
      "latestDeploymentStatus": "READY",
      "createdAt": "2026-09-29T02:10:00.000Z"
    }
  ],
  "deployments": [],
  "domains": [],
  "environmentVariables": [],
  "auditLogs": [],
  "systemConfig": {
    "vercelToken": "",
    "baseDomain": "cmnty.biz.id",
    "availableDomains": ["cmnty.biz.id"],
    "allowPublicRegistration": true,
    "maxProjectsPerUser": 3,
    "maxDeploymentsPerDay": 10
  }
}
```

---

## Panduan Environment Variables

Salin berkas `.env.example` menjadi `.env` atau `.env.local`:

```bash
cp .env.example .env.local
```

Rincian variabel lingkungan:

| Variabel | Deskripsi | Wajib / Opsional | Contoh Nilai |
|:---|:---|:---|:---|
| `ADMIN_NAME` | Nama akun Administrator | Opsional | `"System Admin"` |
| `ADMIN_EMAIL` | Email login Administrator | Wajib | `"admin@cmnty.biz.id"` |
| `ADMIN_PASSWORD` | Kata sandi login Administrator | Wajib | `"PasswordKuat123!"` |
| `VERCEL_TOKEN` | Token otentikasi Vercel API | Wajib untuk deploy | `"vck_xxxxxxxx"` |
| `BASE_DOMAIN` | Domain dasar untuk subdomain otomatis | Opsional | `"cmnty.biz.id"` |
| `SESSION_SECRET` | Kunci enkripsi token sesi (min 32 karakter) | Wajib | `"cmnty-deploy-super-secure-key-32-chars-min"` |
| `APP_URL` | URL publik aplikasi | Opsional | `"https://cmnty.biz.id"` |

---

## Deploy ke Railway

Platform ini sudah menyertakan konfigurasi `railway.json`:

1. **Hubungkan Repositori**:
   Pada dashboard Railway, pilih opsi pembuatan service baru dari repositori Git.
2. **Atur Variabel Lingkungan**:
   Buka menu **Variables**, gunakan **Raw Editor**, lalu tempel konfigurasi dari `.env.example` dan isi nilai yang diperlukan (`VERCEL_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`).
3. **Konfigurasi Domain**:
   Buka menu **Networking** pada pengaturan service, buat public domain, dan atur variabel `APP_URL` sesuai domain tersebut.

---

## Instalasi & Menjalankan Proyek

### Prasyarat
- Node.js versi 18.18+ atau 20+
- npm atau pnpm

### Langkah Menjalankan:

1. **Kloning Repositori**:
   ```bash
   git clone <repo-url>
   cd cmnty-deploy
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Atur Berkas Konfigurasi**:
   ```bash
   cp .env.example .env.local
   ```

4. **Jalankan Mode Pengembangan**:
   ```bash
   npm run dev
   ```
   Buka peramban di http://localhost:3000

5. **Kompilasi Produksi**:
   ```bash
   npm run build
   npm run start
   ```

---

## Daftar Endpoint API

### Autentikasi (`/api/auth`)
- `POST /api/auth/register` — Mendaftarkan akun pengguna baru
- `POST /api/auth/login` — Autentikasi dan pembuatan cookie sesi
- `POST /api/auth/logout` — Menghapus sesi aktif
- `GET /api/auth/me` — Mengambil data profil sesi pengguna
- `POST /api/auth/reset-password` — Mengatur ulang kata sandi akun

### Manajemen Proyek (`/api/projects`)
- `GET /api/projects` — Mengambil daftar proyek milik pengguna
- `POST /api/projects` — Membuat dan mendeploy proyek baru
- `GET /api/projects/:id` — Detail proyek, riwayat build, dan daftar domain
- `DELETE /api/projects/:id` — Menghapus proyek
- `POST /api/projects/:id/deploy` — Memicu deployment ulang
- `GET /api/projects/:id/domains` — Mendapatkan daftar custom domain proyek
- `POST /api/projects/:id/domains` — Menambahkan custom domain ke proyek
- `POST /api/projects/:id/domains/verify` — Memvalidasi status konfigurasi DNS domain
- `GET /api/projects/:id/env` — Mendapatkan daftar variabel lingkungan
- `POST /api/projects/:id/env` — Menambahkan atau memperbarui variabel lingkungan

### Administrator (`/api/admin`)
- `GET /api/admin/overview` — Ringkasan metrik pengguna, proyek, dan statistik sistem
- `GET /api/admin/settings` — Membaca pengaturan infrastruktur dan domain
- `POST /api/admin/settings` — Memperbarui pengaturan Vercel token dan domain dasar
- `POST /api/admin/database/reset` — Reset data proyek dan log
- `POST /api/admin/users/:id` — Mengubah role atau status pengguna
- `POST /api/admin/projects/:id/suspend` — Menangguhkan proyek

---

## Konfigurasi DNS & Domain

Untuk menghubungkan domain ke infrastruktur edge routing:

| Tipe Record | Host | Target | Fungsi |
|:---|:---|:---|:---|
| **CNAME** | `*` atau `*.cmnty.biz.id` | `cname.vercel-dns.com` | Wildcard untuk subdomain otomatis |
| **A** | `@` | `76.76.21.21` | Domain root / apex |

---

## Admin Panel

Panel kontrol administrator dapat diakses melalui rute `/admin` dengan kredensial yang ditentukan pada `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.

Fitur Admin Panel:
1. **Ringkasan Metrik**: Total pengguna, total proyek aktif, dan total deployment.
2. **Manajemen Pengguna**: Pengelolaan hak akses dan status akun pengguna.
3. **Pengawasan Proyek**: Memantau seluruh proyek yang aktif serta status deployment real-time.
4. **Audit Trail**: Pencatatan aktivitas sistem untuk kepatuhan dan pelacakan riwayat operasional.

---

<p align="center">
  Dibuat untuk ekosistem pengembang modern &bull; <strong>CMNTY Deploy</strong>
</p>
