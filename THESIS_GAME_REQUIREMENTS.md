# Thesis Game Logic & Requirements

Dokumen ini menjelaskan **inti materi pembelajaran** dan **syarat game** berdasarkan implementasi yang kita buat (Bab 2 & Bab 7), serta metodologi penelitian skripsi.

## 1. Konsep Dasar Penelitian
Skripsi ini meneliti efektivitas pembelajaran **Berpikir Komputasional (Computational Thinking)** dengan metode **Gamifikasi**.

### Variabel Penelitian (Data yang Wajib Direkam)
Aplikasi harus merekam 3 hal ini secara otomatis ke database (Supabase):
1.  **Efisiensi Waktu ($Y_1$):** Berapa lama siswa menyelesaikan level (detik).
2.  **Validitas/Akurasi ($Y_2$):** Berapa kali siswa mencoba (attempt count) sebelum benar.
3.  **Praktikalitas/Skor ($Y_3$):** Total nilai yang didapat.

### Desain Eksperimen (Crossover)
Siswa dibagi menjadi 2 grup (A & B) yang akan bertukar metode diperjalanan:
-   **Grup A**: Bab 2 (Gamified) -> Bab 7 (Non-Gamified)
-   **Grup B**: Bab 2 (Non-Gamified) -> Bab 7 (Gamified)
*Game harus punya fitur "Toggle Mode" untuk memfasilitasi ini.*

---

## 2. Detail Materi & Game

### BAB 2: Pengenalan Pola (Pattern Recognition)
**Topik:** Kemampuan mengenali keteraturan atau pola yang berulang.
**Aktivitas:** "Meronce Gelang Manik-manik".

**Mekanik Game:**
1.  **Tampilan:** Deretan manik-manik dengan pola tertentu (contoh: Merah - Biru - Merah - Biru - ?).
2.  **Tugas:** Siswa harus men-drag manik yang benar ke posisi kosong.
3.  **Leveling:**
    -   *Mudah:* Pola 2 warna sederhana (ABAB).
    -   *Sedang:* Pola 3 warna atau selang-seling (ABC ABC / AAB AAB).
    -   *Sulit:* Pola kompleks atau missing middle (A ? A B).
4.  **Validasi:** Jika salah, beri *hint* (petunjuk). Jika benar, lanjut level.

### BAB 7: Algoritma & Pemrograman (Algorithm Design)
**Topik:** Menyusun langkah-langkah logis untuk menyelesaikan masalah (Algoritma).
**Aktivitas:** "Visual Programming" (mirip Scratch).

**Mekanik Game:**
1.  **Interface:** Area Canvas (Stage) dengan karakter Kucing + Area Blocks.
2.  **Blocks (Bahasa Indonesia):**
    -   `Gerak Maju`: Memindahkan karakter.
    -   `Putar Kanan/Kiri`: Mengubah arah hadap.
    -   `Ulangi (Loop)`: Efisiensi kode.
3.  **Tantangan (Challenges):**
    -   *Level 1:* Gerakkan kucing ke titik tujuan.
    -   *Level 2:* Buat kucing berjalan membentuk persegi (Maju, Putar, Maju, Putar...).
    -   *Level 3:* Gunakan block `Ulangi` untuk membuat persegi dengan lebih sedikit block (Optimasi).
4.  **Goal:** Mengajarkan konsep **Sequence** (urutan) dan **Loop** (perulangan).

---

## 3. Syarat Sistem Gamifikasi
Jika mode **Gamified** aktif, aplikasi harus menampilkan:

1.  **Points (XP):** Setiap aksi benar dapat XP.
2.  **Levels:** Akumulasi XP menaikkan Level user (Level 1 -> Level 2 -> Master).
3.  **Badges (Lencana):** Penghargaan khusus, misal:
    -   *Sniper Badge:* Menyelesaikan level tanpa salah dalam 1x coba.
    -   *Speedster Badge:* Menyelesaikan dibawah 30 detik.
4.  **Feedback Visual:** Animasi confetti/bintang saat menang, suara positif.

*Jika Non-Gamified, semua fitur di atas disembunyikan (tampilan polos).*
