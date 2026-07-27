# Project: Telegram Bot SOP (Standard Operating Procedure)

Dokumen ini berisi panduan teknis dan tahapan implementasi (issue tracker) untuk membangun Telegram Bot SOP yang ditujukan bagi tim L2 Application Support.

## 1. Spesifikasi Fitur Utama
1. **Role-Based Access Control (RBAC)**:
   - **Admin/Owner**: Memiliki hak penuh untuk Create, Read, Update, dan Delete (CRUD) SOP.
   - **User Biasa**: Hanya memiliki hak untuk Read (View) dan Search SOP.
2. **Code Formatting (Code Block Output & Input)**:
   - Output pesan di Telegram (seperti query SQL, command Linux, log) harus menggunakan *Code Block* agar langsung dikenali sebagai teks kode dan menyediakan tombol "Copy" bawaan Telegram.
3. **Inline Keyboard UI**:
   - Navigasi antar menu dan aksi-aksi (seperti next/prev page, detail SOP, edit, delete) harus menggunakan *Inline Keyboard* (tombol di bawah pesan).
4. **Search & Pagination**:
   - Dapat mencari SOP berdasarkan judul atau tag.
   - Menampilkan daftar SOP menggunakan *paging* (misal: 5 baris per halaman) agar chat tidak penuh (*spammy*).

## 2. Pilihan Tech Stack & Infrastruktur
- **Bahasa Pemrograman**: Node.js (dengan library `telegraf`) atau Python (dengan library `aiogram`). Keduanya sangat direkomendasikan karena mature.
- **Database**: **Supabase** (PostgreSQL). Sangat cocok karena gratis (*free tier* cukup besar), modern, dan memiliki SDK yang bagus.
- **Hosting (Gratis)**:
  - **Vercel** (Serverless): Sangat stabil untuk bot gratis jika bot dikonfigurasi menggunakan mode **Webhook**.
  - **Render.com** (Web Service): Bisa menggunakan mode *Polling*, namun karena *free tier* akan "tidur" setelah 15 menit tidak ada request, diperlukan setup *cron-job* pihak ketiga (misal: `cron-job.org`) untuk menembak endpoint port dummy setiap 5-10 menit.
  - **PythonAnywhere**: (Khusus jika menggunakan Python) Menyediakan free hosting yang cukup untuk polling bot kecil.

## 3. Skema Database (Supabase)

Silakan jalankan SQL berikut di *SQL Editor* Supabase Anda:

```sql
-- Tabel untuk menyimpan data pengguna dan hak akses (RBAC)
CREATE TABLE users (
    chat_id BIGINT PRIMARY KEY, -- Chat ID dari Telegram
    username VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan data SOP / Command / Query
CREATE TABLE sops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL, -- Judul SOP (misal: Restart Nginx)
    category VARCHAR(100),       -- Kategori (misal: SQL, Linux, App)
    description TEXT,            -- Penjelasan singkat SOP
    code_content TEXT,           -- Isi command/query (ini yang akan diformat sebagai code block)
    created_by BIGINT REFERENCES users(chat_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk mempercepat pencarian (Search feature)
CREATE INDEX idx_sops_title ON sops (title);
```

## 4. Tahapan Implementasi (Action Items)

Tahapan di bawah ini dirancang untuk dieksekusi secara berurutan oleh *developer* (Junior/AI model).

### Tahap 1: Setup Proyek & Konfigurasi Bot
- [ ] Buat bot baru di `@BotFather` (Telegram) dan simpan `BOT_TOKEN`.
- [ ] Buat proyek Supabase dan dapatkan `SUPABASE_URL` dan `SUPABASE_KEY`.
- [ ] Inisialisasi proyek kode (misal `npm init` atau `python -m venv`).
- [ ] Install library Telegram Bot (`telegraf` atau `aiogram`), SDK Supabase, dan `dotenv`.
- [ ] Buat file `.env` dan masukkan kredensial token dan database.

### Tahap 2: Setup Database & Middleware (RBAC)
- [ ] Koneksikan aplikasi ke Supabase.
- [ ] Buat *middleware* yang akan berjalan di setiap pesan masuk:
  - Middleware mengecek apakah `chat_id` user sudah ada di tabel `users`.
  - Jika belum, masukkan data user baru dengan role default `user`.
  - Simpan `role` user ke dalam konteks aplikasi agar mudah dicek oleh fungsi lain (`isAdmin(ctx)`).
- [ ] Secara manual via UI Supabase, ubah `role` akun Anda sendiri menjadi `admin`.

### Tahap 3: Fitur View & Paging (Untuk Semua User)
- [ ] **Command `/start`**: Tampilkan sapaan dan tombol *Inline Keyboard*: [ 🔍 Cari SOP ] dan [ 📜 List SOP ].
- [ ] **Fitur List (Pagination)**:
  - Buat query Supabase dengan `LIMIT` (misal 5) dan `OFFSET` (berdasarkan parameter halaman).
  - Tampilkan hasilnya dalam bentuk list pesan.
  - Tambahkan tombol *Inline Keyboard* [ ⬅️ Prev ] dan [ Next ➡️ ] menggunakan *Callback Data* (misal `list_page_1`, `list_page_2`).
- [ ] **Fitur Tampil Detail & Code Formatting**:
  - Ketika sebuah judul di klik (via ID dari *Callback Data*), ambil baris data tersebut.
  - **PENTING (Format Output)**: Gunakan parse mode `HTML` (sangat direkomendasikan karena lebih aman dari *escape character* di Telegram).
  - Format pesan kembaliannya seperti ini:
    ```html
    <b>SOP: {title}</b>
    Kategori: {category}

    {description}

    <i>Command/Query:</i>
    <code>{code_content}</code>
    ```
    *Tag `<code>` akan secara otomatis di-render sebagai code block yang bisa disalin.*

### Tahap 4: Fitur Search (Untuk Semua User)
- [ ] **State Pencarian**: Saat user klik tombol [ 🔍 Cari SOP ], buat aplikasi menunggu inputan user selanjutnya (State Management).
- [ ] Lakukan query Supabase menggunakan operator `.ilike('title', '%keyword%')`.
- [ ] Tampilkan hasil berupa *Inline Keyboard* dari judul-judul yang cocok.

### Tahap 5: Fitur CRUD (Khusus Admin)
- [ ] Tambahkan fungsi penjaga (Guard/Middleware) agar fitur ini hanya dieksekusi jika `role == 'admin'`.
- [ ] **Fitur Add SOP**:
  - Buat alur multi-step (*Conversation State*). 
  - Langkah: Tanya Judul -> Tanya Kategori -> Tanya Deskripsi -> Tanya Code/Query (Gunakan `ctx.message.text` mentah) -> Simpan ke DB.
- [ ] **Fitur Edit & Delete**:
  - Pada tampilan Detail SOP (Tahap 3), jika user yang membuka adalah Admin, tampilkan tombol tambahan: [ ✏️ Edit ] dan [ 🗑️ Hapus ].
  - Jika [ 🗑️ Hapus ] di-klik, munculkan popup konfirmasi, lalu eksekusi query `DELETE` ke Supabase.

### Tahap 6: Format Input Code Block
- [ ] **Parsing Input**: Agar bot bisa mengerti teks kode, edukasi Admin untuk mengirim kode dengan *backticks* (```) atau mendeteksi entitas Telegram (`MessageEntity` bertipe `code` atau `pre`).
- [ ] Saat menyimpan ke Supabase, bot harus mengambil nilai teks di dalam `pre` atau mengambil teks mentah (*raw text*) dari pesan tanpa mempedulikan format jika sedang dalam tahap "Tanya Code/Query".

### Tahap 7: Deployment ke Server Gratis (Vercel direkomendasikan)
- [ ] Pindahkan cara bot menerima pesan dari `Polling` ke `Webhook`.
- [ ] Buat handler untuk endpoint `/api/webhook` sesuai dengan format framework (contoh: Vercel serverless function).
- [ ] Daftarkan URL Webhook Vercel ke API Telegram (`https://api.telegram.org/bot<TOKEN>/setWebhook?url=<VERCEL_URL>/api/webhook`).
- [ ] Push kode ke GitHub, tautkan ke Vercel, dan deploy.

## 5. Struktur Folder (Direkomendasikan)

Untuk menjaga agar *codebase* tetap rapi, *scalable*, dan profesional (mengikuti standar pengembangan aplikasi), disarankan menggunakan struktur folder modular berikut. Contoh di bawah mengasumsikan penggunaan **Node.js (Telegraf)** yang dideploy ke **Vercel**:

```text
Bot_SOP/
│
├── api/                   # (Khusus Vercel) Endpoint Webhook
│   └── webhook.js         # Entry point untuk menerima payload HTTP dari Telegram
│
├── src/                   # Source code utama
│   ├── config/            # Konfigurasi aplikasi
│   │   └── supabase.js    # Setup dan instance koneksi database (Supabase client)
│   │
│   ├── middlewares/       # Middleware (dijalankan sebelum request masuk ke handler)
│   │   ├── auth.js        # Logika RBAC (cek user di DB dan validasi role 'admin')
│   │   └── state.js       # (Opsional) Mengelola session/state jika menggunakan multiple steps
│   │
│   ├── handlers/          # Business logic spesifik per aksi/fitur bot
│   │   ├── start.js       # Handler untuk command /start dan menu utama
│   │   ├── sops.js        # Handler untuk view list, pagination, dan view detail SOP
│   │   ├── search.js      # Handler untuk fitur pencarian
│   │   └── admin.js       # Handler khusus aksi CRUD Admin (Add, Edit, Delete SOP)
│   │
│   ├── utils/             # Helper functions (kode yang dapat digunakan berulang)
│   │   └── formatter.js   # Logic mem-parsing / membungkus text menjadi code block (HTML tags)
│   │
│   └── bot.js             # Setup awal instance Bot (Telegraf) dan mendaftarkan middleware/handler
│
├── .env                   # Environment variables lokal (BOT_TOKEN, SUPABASE_URL, dll)
├── .env.example           # Contoh template variabel environment (aman di-push ke GitHub)
├── .gitignore             # Mengabaikan direktori tertentu (node_modules, .env)
├── package.json           # Definisi project dan daftar dependencies npm
└── README.md              # Dokumentasi internal proyek
```

**Kenapa struktur ini penting?**
- **Vercel Compatibility**: Folder `api/` secara otomatis di-detect sebagai *Serverless Functions* oleh Vercel.
- **Modular & Clean**: Menghindari *spaghetti code* (di mana semua logika numpuk di satu file `index.js`). Dengan struktur ini, *junior programmer* akan sangat mudah mencari *file* mana yang harus diedit (misal ada *bug* di pencarian, tinggal buka `src/handlers/search.js`).
- **Maintainable**: Mudah ditambahkan fitur baru ke depannya tanpa merusak fitur lama.
