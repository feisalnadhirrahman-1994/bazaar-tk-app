-- ============================================================================
--  PENYESUAIAN 3 — Urutan tampil stand
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-02-bank-dan-batch.sql.
--
--  Menambahkan satu kolom urutan di tabel tenants. Angka kecil tampil lebih
--  dulu di halaman pembeli. Nilai awal diisi mengikuti urutan abjad, jadi
--  tampilan tidak berubah sampai Anda mengaturnya sendiri di Kelola Stand.
-- ============================================================================

alter table public.tenants
  add column if not exists sort_order integer not null default 1000;

comment on column public.tenants.sort_order is
  'Urutan tampil di halaman pembeli. Angka kecil lebih dulu. Diatur lewat Kelola Stand.';

-- Isi nilai awal: kelipatan 10 mengikuti abjad, supaya ada ruang menyisipkan.
with urut as (
  select id, (row_number() over (order by name)) * 10 as n
  from public.tenants
)
update public.tenants t
set sort_order = urut.n
from urut
where urut.id = t.id
  and t.sort_order = 1000;

create index if not exists tenants_sort_idx on public.tenants (sort_order, name);

-- Periksa hasilnya.
select sort_order, name from public.tenants order by sort_order, name;
