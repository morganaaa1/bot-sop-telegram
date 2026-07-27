# 🚀 Panduan Hosting Gratis Telegram Bot SOP (Vercel & Webhook)

Dokumen ini berisi panduan langkah demi langkah untuk mempublikasikan (*deploy*) Telegram Bot SOP ke layanan **Vercel** secara **100% Gratis** dan dapat berjalan **24/7 tanpa *sleep*** menggunakan metode **Webhook**.

---

## 📋 Persyaratan Sebelum Memulai
1. Memiliki **Akun GitHub** ([github.com](https://github.com)).
2. Memiliki **Akun Vercel** ([vercel.com](https://vercel.com)) yang sudah terhubung dengan akun GitHub.
3. Kredensial di file `.env` kamu:
   - `BOT_TOKEN` (dari @BotFather)
   - `SUPABASE_URL` & `SUPABASE_KEY`

---

## 🛠️ Langkah 1: Push Kode Proyek ke GitHub

1. Buka Terminal / PowerShell di folder proyek `D:\Bot_SOP`.
2. Inisialisasi repositori Git (jika belum ada):
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Telegram Bot SOP"
   ```
3. Buat repositori baru di [GitHub](https://github.com/new) (nama repositori bebas, misal: `bot-sop-telegram`).
4. Hubungkan repositori lokal ke GitHub dan push kodenya:
   ```bash
   git remote add origin https://github.com/USERNAME_KAMU/bot-sop-telegram.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 Langkah 2: Deploy ke Vercel

1. Buka [Dashboard Vercel](https://vercel.com/dashboard) dan klik **Add New...** -> **Project**.
2. Cari repositori `bot-sop-telegram` yang baru saja kamu push, lalu klik **Import**.
3. Di halaman konfigurasi deployment:
   - **Framework Preset**: Biarkan `Other` (atau `Node.js`).
   - Buka bagian **Environment Variables**, masukkan 3 variabel berikut satu per satu:
     - `BOT_TOKEN` = `8626557596:AAEU_nmZTXaH_08nyaYU...` (Token Bot kamu)
     - `SUPABASE_URL` = `https://burzzowifnzhjgemxzqw.supabase.co`
     - `SUPABASE_KEY` = `sb_secret_...` (atau Anon Key Supabase kamu)
4. Klik tombol **Deploy**.
5. Tunggu proses *build* selesai (sekitar 30 detik). Setelah berhasil, Vercel akan memberikan kamu URL aplikasi, contoh:
   `https://bot-sop-telegram.vercel.app`

---

## 🔗 Langkah 3: Daftarkan Webhook ke Telegram

Agar Telegram tahu harus mengirim pesan user ke server Vercel kamu, daftarkan URL Webhook bot-mu dengan cara berikut:

1. Buka Browser (Chrome/Edge/Firefox) atau Postman.
2. Buka URL berikut di browser (ganti `<BOT_TOKEN>` dan `<VERCEL_URL>` dengan milikmu):

   ```text
   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<VERCEL_URL>/api/webhook
   ```

   **Contoh Asli:**
   ```text
   https://api.telegram.org/bot8626557596:AAEU_nmZTXaH_08nyaYU-PWzH4FEsn8Jv3M/setWebhook?url=https://bot-sop-telegram.vercel.app/api/webhook
   ```

3. Jika berhasil, browser akan menampilkan respon JSON seperti ini:
   ```json
   {
     "ok": true,
     "result": true,
     "description": "Webhook was set"
   }
   ```

> ⚠️ **Catatan Penting saat menggunakan Webhook:**  
> Ketika Webhook sudah didaftarkan, **matikan** bot yang berjalan di laptop kamu (`npm start` lokal di-stop dengan `Ctrl+C`). Jika tidak dimatikan, Telegram akan bingung karena menerima 2 koneksi sekaligus (Polling & Webhook).

---

## 🔍 Cara Cek Status & Debugging Webhook

- **Cek Informasi Webhook:**
  Buka URL berikut di browser untuk melihat apakah Webhook aktif:
  `https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo`

- **Melihat Log Error Vercel:**
  Jika bot tidak merespon di Telegram, masuk ke Dashboard Vercel -> Pilih Proyek Kamu -> Tab **Logs**. Di sana akan terlihat setiap pesan yang masuk beserta error (jika ada).

- **Membatalkan Webhook (Kembali ke Testing Lokal):**
  Jika ingin kembali menjalankan bot di laptop lokal (`npm start`), hapus Webhook Vercel dengan membuka URL ini:
  `https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook`

---

## 📌 Alternatif: Deploy di Render.com (Mode Polling)

Jika kamu tidak ingin menggunakan Webhook dan ingin tetap menggunakan mode Polling biasa:

1. Buat akun di [Render.com](https://render.com).
2. Buat **New Web Service**, hubungkan ke GitHub kamu.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Masukkan variabel environment di menu **Environment**.
6. Karena Render *Free Tier* akan *sleep* jika tidak ada trafik HTTP selama 15 menit, kamu perlu mendaftar di [cron-job.org](https://cron-job.org) dan buat *cron job* untuk menembak URL Render kamu setiap 5 menit sekali agar server tidak tidur.
