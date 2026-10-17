-- ============================================================================
--  BAZAAR DANUS PTA LITTLE DARBI — Skema Supabase
--  Dibuat 17 Oktober 2026. Jalankan SEKALI di Supabase SQL Editor, lalu Run.
--
--  Keputusan yang sudah diambil dan tercermin di skema ini:
--    - Pembeli tanpa login. Order dibuat lewat fungsi create_order(), bukan
--      INSERT langsung, sehingga pembeli tidak pernah bisa membaca order
--      orang lain dan tidak bisa mengirim harga karangan sendiri.
--    - Admin cukup satu akun, lewat Supabase Auth. Password HARUS baru,
--      bukan password admin yang lama (yang itu sudah terekspos publik).
--    - Varian jadi tabel tersendiri. Inilah yang menutup bug rekap Rp 0.
--    - order_items menyimpan harga SAAT TRANSAKSI, bukan menghitung ulang
--      dari master produk. Order lama tetap benar walau harga produk diubah.
-- ============================================================================

-- ---------------------------------------------------------------- MASTER ----

create table if not exists public.tenants (
  id          text primary key,              -- id lama dipertahankan: t-1786827080301
  name        text not null,
  owner       text,
  phone       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.classes (
  id          text primary key,              -- c-1786829285926
  name        text not null,
  phone       text,                          -- nomor WA PIC kelas
  created_at  timestamptz not null default now()
);

create table if not exists public.batches (
  id          text primary key,              -- b-1786961429014
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  ready_date  date,
  is_active   boolean not null default false,
  description text,
  created_at  timestamptz not null default now(),
  constraint batches_tanggal_masuk_akal check (end_date >= start_date)
);

create table if not exists public.products (
  id              text primary key,          -- p-1786959261685
  tenant_id       text not null references public.tenants(id) on delete restrict,
  name            text not null,
  price_owner     integer not null default 0 check (price_owner >= 0),
  price_organizer integer not null default 0 check (price_organizer >= 0),
  description     text,
  category        text,
  image_url       text,                      -- URL ke Storage, bukan lagi base64
  available       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists products_tenant_idx on public.products (tenant_id);

-- Inti perbaikannya. Dulu ini JSON di dalam satu sel yang bisa hilang diam-diam.
create table if not exists public.product_variants (
  id              bigserial primary key,
  product_id      text not null references public.products(id) on delete cascade,
  name            text not null,
  price_owner     integer not null default 0 check (price_owner >= 0),
  price_organizer integer not null default 0 check (price_organizer >= 0),
  sort_order      integer not null default 0,
  unique (product_id, name)
);

create index if not exists product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------- ORDER -----

create table if not exists public.orders (
  id          bigserial primary key,
  code        text not null unique,          -- BZ-839816
  batch_id    text not null references public.batches(id) on delete restrict,
  nama_anak   text not null,
  kelas       text not null,
  nama_ortu   text not null,
  catatan     text,
  status      text not null default 'Unpaid' check (status in ('Paid', 'Unpaid')),
  created_at  timestamptz not null default now()
);

create index if not exists orders_batch_idx on public.orders (batch_id);

create table if not exists public.order_items (
  id              bigserial primary key,
  order_id        bigint not null references public.orders(id) on delete cascade,
  product_id      text references public.products(id) on delete set null,
  variant_id      bigint references public.product_variants(id) on delete set null,
  product_name    text not null,             -- snapshot nama, ikut varian
  tenant_id       text references public.tenants(id) on delete set null,
  qty             integer not null check (qty > 0),
  price_owner     integer not null check (price_owner >= 0),
  price_organizer integer not null check (price_organizer >= 0)
);

create index if not exists order_items_order_idx  on public.order_items (order_id);
create index if not exists order_items_tenant_idx on public.order_items (tenant_id);

-- ------------------------------------------------------- REKAP PER TENANT ---
-- security_invoker: aturan akses tetap berlaku, jadi hanya admin yang bisa baca.

create or replace view public.v_tenant_recap
with (security_invoker = on) as
select
  o.batch_id,
  o.status,
  oi.tenant_id,
  t.name                                                  as tenant_name,
  sum(oi.qty)                                             as total_qty,
  sum(oi.qty * oi.price_owner)                            as hak_vendor,
  sum(oi.qty * oi.price_organizer)                        as hak_panitia,
  sum(oi.qty * (oi.price_owner + oi.price_organizer))     as total_tagihan
from public.order_items oi
join public.orders  o on o.id = oi.order_id
left join public.tenants t on t.id = oi.tenant_id
group by o.batch_id, o.status, oi.tenant_id, t.name;

-- ------------------------------------------------- FUNGSI PEMBUAT ORDER -----
-- Satu-satunya pintu masuk order bagi pembeli.
-- Harga diambil dari database, BUKAN dari yang dikirim browser.
-- Periode batch dicek di server, bukan cuma di tombol.

create or replace function public.create_order(
  p_batch_id  text,
  p_nama_anak text,
  p_kelas     text,
  p_nama_ortu text,
  p_catatan   text,
  p_items     jsonb   -- [{"product_id":"p-…","variant_id":12,"qty":2}, …]
) returns table (code text, total_tagihan integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch   public.batches%rowtype;
  v_code    text;
  v_order   bigint;
  v_item    jsonb;
  v_prod    public.products%rowtype;
  v_var     public.product_variants%rowtype;
  v_qty     integer;
  v_owner   integer;
  v_org     integer;
  v_name    text;
  v_total   integer := 0;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong.';
  end if;

  if coalesce(btrim(p_nama_anak), '') = '' or coalesce(btrim(p_nama_ortu), '') = '' then
    raise exception 'Nama anak dan nama orang tua wajib diisi.';
  end if;

  select * into v_batch from public.batches where id = p_batch_id;
  if not found then
    raise exception 'Batch tidak ditemukan.';
  end if;

  -- Penjaga periode di sisi server. Toleransi sampai akhir hari tanggal berakhir.
  if current_date < v_batch.start_date then
    raise exception 'Periode % belum dibuka.', v_batch.name;
  end if;
  if current_date > v_batch.end_date then
    raise exception 'Periode % sudah ditutup.', v_batch.name;
  end if;

  -- Kode order unik, dicoba ulang kalau bentrok.
  loop
    v_code := 'BZ-' || lpad((100000 + floor(random() * 900000))::int::text, 6, '0');
    exit when not exists (select 1 from public.orders o where o.code = v_code);
  end loop;

  insert into public.orders (code, batch_id, nama_anak, kelas, nama_ortu, catatan, status)
  values (v_code, p_batch_id, btrim(p_nama_anak), p_kelas, btrim(p_nama_ortu),
          nullif(btrim(coalesce(p_catatan, '')), ''), 'Unpaid')
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'qty')::integer, 0);
    if v_qty <= 0 then
      raise exception 'Jumlah pesanan tidak valid.';
    end if;

    select * into v_prod from public.products
      where id = (v_item ->> 'product_id') and available;
    if not found then
      raise exception 'Produk % tidak tersedia.', (v_item ->> 'product_id');
    end if;

    v_name  := v_prod.name;
    v_owner := v_prod.price_owner;
    v_org   := v_prod.price_organizer;

    if (v_item ->> 'variant_id') is not null then
      select * into v_var from public.product_variants
        where id = (v_item ->> 'variant_id')::bigint and product_id = v_prod.id;
      if not found then
        raise exception 'Varian tidak cocok dengan produk %.', v_prod.name;
      end if;
      v_name  := v_prod.name || ' [' || v_var.name || ']';
      v_owner := v_var.price_owner;
      v_org   := v_var.price_organizer;
    else
      -- Produk bervarian wajib menyebut varian; ini yang dulu bikin rekap Rp 0.
      if exists (select 1 from public.product_variants pv where pv.product_id = v_prod.id) then
        raise exception 'Produk % punya varian, varian wajib dipilih.', v_prod.name;
      end if;
    end if;

    insert into public.order_items
      (order_id, product_id, variant_id, product_name, tenant_id, qty, price_owner, price_organizer)
    values
      (v_order, v_prod.id, nullif(v_item ->> 'variant_id', '')::bigint, v_name,
       v_prod.tenant_id, v_qty, v_owner, v_org);

    v_total := v_total + v_qty * (v_owner + v_org);
  end loop;

  return query select v_code, v_total;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- ------------------------------------------------------ ATURAN AKSES (RLS) --

alter table public.tenants          enable row level security;
alter table public.classes          enable row level security;
alter table public.batches          enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- Katalog: siapa pun boleh BACA. Tidak ada yang boleh menulis selain admin.
create policy "katalog boleh dibaca siapa pun" on public.tenants          for select using (true);
create policy "katalog boleh dibaca siapa pun" on public.classes          for select using (true);
create policy "katalog boleh dibaca siapa pun" on public.batches          for select using (true);
create policy "katalog boleh dibaca siapa pun" on public.products         for select using (true);
create policy "katalog boleh dibaca siapa pun" on public.product_variants for select using (true);

-- Admin (siapa pun yang login) boleh apa saja atas katalog.
create policy "admin kelola katalog" on public.tenants          for all to authenticated using (true) with check (true);
create policy "admin kelola katalog" on public.classes          for all to authenticated using (true) with check (true);
create policy "admin kelola katalog" on public.batches          for all to authenticated using (true) with check (true);
create policy "admin kelola katalog" on public.products         for all to authenticated using (true) with check (true);
create policy "admin kelola katalog" on public.product_variants for all to authenticated using (true) with check (true);

-- Order: pembeli TIDAK punya policy apa pun, jadi tidak bisa baca maupun tulis
-- langsung. Satu-satunya jalan masuk adalah create_order() di atas.
create policy "admin kelola order" on public.orders      for all to authenticated using (true) with check (true);
create policy "admin kelola order" on public.order_items for all to authenticated using (true) with check (true);

-- ------------------------------------------------------- STORAGE GAMBAR -----

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "gambar produk boleh dilihat siapa pun"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "admin kelola gambar produk"
  on storage.objects for all to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- ============================================================================
--  Selesai. Langkah berikutnya:
--    1. Authentication -> Users -> Add user, pakai PASSWORD BARU.
--    2. Settings -> API, kirim Project URL dan anon key.
--    3. service_role key simpan di .env.local, jangan dikirim ke mana pun.
-- ============================================================================
