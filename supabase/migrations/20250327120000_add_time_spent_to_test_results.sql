-- Durasi pengerjaan pre-test / post-test (detik) — untuk penelitian & admin
-- Jalankan di Supabase SQL Editor jika project sudah ada sebelum migrasi ini.

ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.test_results.time_spent_seconds IS 'Lama pengerjaan tes dalam detik';
