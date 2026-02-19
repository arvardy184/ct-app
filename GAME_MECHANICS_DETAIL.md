# Detail Mekanisme Game & Scoring

Dokumen ini menjelaskan secara rinci aturan main, sistem poin, dan perbedaan mode gamifikasi untuk kebutuhan skripsi.

## 1. Sistem Poin & Penilaian (Scoring Logic)

Apakah hanya bergantung pada BENAR/SALAH? **Tidak.**
Untuk data penelitian yang valid ($Y_3$), penilaian harus lebih detail (granular).

### Rumus Nilai (Base Score)
Setiap level memiliki **Nilai Maksimal = 100 poin**.
Nilai akhir berkurang jika:
1.  **Salah Percobaan (Attempts):** Setiap kali salah, nilai berkurang.
2.  **Waktu Lama (Time Penalty):** (Opsional) Bonus cepat habis jika terlalu lama.
3.  **Menggunakan Hint (Bantuan):** Menggunakan bantuan mengurangi nilai signifikan.

### Skenario Usulan:
*   **Attempt Penalty:** -10 poin per kesalahan.
*   **Hint Penalty:** -25 poin jika membuka kunci jawaban/hint.
*   **Time Bonus:** +10 poin jika selesai < 30 detik (Speedster).

> **Contoh Kasus:**
> Siswa menyelesaikan Level 1.
> - Salah 2x (-20 poin).
> - Tidak pakai hint.
> - Waktu 45 detik (tidak dapat bonus).
> **Total Nilai:** 100 - 20 = **80 poin**.

---

## 2. Fitur "Nyawa" & "Hint" (Bantuan)

### Sistem Nyawa (Lives / Hearts)
**Rekomendasi:** **JANGAN gunakan sistem nyawa (Game Over) yang memaksa ulang dari awal.**
*Alasan:* Ini aplikasi edukasi, tujuannya *mastery learning*. Siswa harus boleh mencoba sampai bisa.
*Ganti dengan:* **Infinite Tries** tapi nilai terus berkurang (minimum nilai 10 supaya tidak nol).

### Sistem Hint (Bantuan)
Fitur ini penting untuk *scaffolding* (bantuan bertahap).
*   **Muncul Kapan?** Tombol Hint aktif otomatis setelah siswa salah 2x berturut-turut.
*   **Bentuk Hint:**
    *   *Descriptive:* "Coba perhatikan pola warna Merah-Biru..."
    *   *Visual:* Menandai blok yang salah dengan warna merah.
*   **Konsekuensi:** Menggunakan hint mengurangi skor (-25), tapi memastikan siswa bisa lanjut level.

---

## 3. Perbedaan Tegas: Gamifikasi vs Non-Gamifikasi

Ini adalah *variabel bebas* penelitian kamu. Perbedaannya harus sangat kontras agar data valid.

| Fitur | Mode Gamifikasi (Eksperimen) | Mode Non-Gamifikasi (Kontrol) |
| :--- | :--- | :--- |
| **Tampilan Visual** | Warna-warni, Header ada XP Bar, Level Badge. | Minimalis, polos, tidak ada header status. |
| **Feedback Benar** | Muncul Popup "LEVEL UP!", Suara "Ting!", Animasi Konfeti. | Hanya teks "Jawaban Benar. Lanjut ke soal berikutnya." |
| **Feedback Salah** | Suara "Tetot!", Animasi Guncang/Shake, "Coba Lagi Yuk!". | Hanya teks "Jawaban Salah." |
| **Sistem Nilai** | Ditampilkan sebagai **XP (Experience Points)**. "Kamu dapat +80 XP!". | Nilai direkam di database tapi **TIDAK DITAMPILKAN** ke siswa. |
| **Progres** | Ada **Level Up** (Level 1 -> 2) dan **Badge** (Lencana). | Hanya nomor soal (1/10). |
| **Leaderboard** | (Opsional) Menampilkan peringkat kelas. | Tidak ada. |

---

## 4. Daftar Pertanyaan untuk Diperjelas (Konfirmasi ke Dosen/Tim)

Bagian ini yang mungkin "kurang jelas" dan perlu kamu putuskan:

1.  **Time Limit:** Apakah ada batas waktu total (misal 40 menit per bab)? Atau bebas sepuasnya?
    *   *Saran:* Bebas, tapi waktu direkam ($Y_1$).
2.  **Minimum Passing Grade:** Apakah siswa BOLEH lanjut ke Level 2 jika nilai Level 1 cuma 20?
    *   *Saran Education:* Sebaiknya TIDAK. Harus minimal nilai 60 (remidial di tempat) baru boleh lanjut. Ini mencegah "asal klik".
3.  **Dependency Level:** Apakah Bab 7 (Coding) baru terbuka setelah Bab 2 selesai? Atau boleh loncat?
    *   *Saran Research:* Harus, urutannya penting untuk desain Crossover.
4.  **Jenis Data $Y_1$ (Waktu):** Waktu *total* di aplikasi atau waktu *aktif* mengerjakan soal?
    *   *Saran:* Waktu aktif per level (timer pause kalau keluar aplikasi).

## 5. Ringkasan Implementasi (Yang akan kita buat)

1.  **Hooks `useScoring`:** Menghitung skor real-time (100 - (errors * 10)).
2.  **Komponen `GamificationWrapper`:** Logic kondisional untuk menampilkan efek/suara hanya jika `isGamified = true`.
3.  **Database:** Menyimpan detail: `initial_score`, `final_score`, `hints_used`, `time_taken`.
