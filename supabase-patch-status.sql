-- ============================================================================
--  TAMBALAN SKEMA — status pesanan
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-schema.sql.
--
--  Kenapa: dropdown status di Panel Admin menyediakan empat pilihan
--  (Unpaid, Paid, Selesai, Batal), tapi skema awal hanya mengizinkan
--  'Paid' dan 'Unpaid'. Tanpa tambalan ini, menyimpan status "Selesai"
--  atau "Batal" akan ditolak database.
-- ============================================================================

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('Unpaid', 'Paid', 'Selesai', 'Batal'));

-- Periksa hasilnya: harusnya hanya Paid dan Unpaid yang muncul untuk saat ini.
select status, count(*) as jumlah
from public.orders
group by status
order by status;
