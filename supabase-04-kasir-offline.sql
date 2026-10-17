-- ============================================================================
--  PENYESUAIAN 4 — Modul Kasir Bazaar Offline
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-03-urutan-stand.sql.
--
--  Konsep:
--   - Produk offline adalah BARIS TERSENDIRI di tabel products, ditandai
--     channel = 'offline'. Setupnya terpisah di menu admin, harganya bebas
--     berbeda, tapi varian/gambar/rekap/export tetap memakai jalur yang sudah ada.
--   - Transaksi kasir masuk ke tabel orders yang sama, ditandai
--     channel = 'offline' dan langsung berstatus Paid.
--   - Kasir TIDAK lewat create_order: fungsi itu menolak pesanan di luar
--     tanggal batch, padahal bazaar offline justru digelar setelah periode
--     pesan ditutup. Kasir punya fungsinya sendiri, khusus admin yang login.
-- ============================================================================

-- --------------------------------------------------------- 1. Kolom baru ---

alter table public.products
  add column if not exists channel text not null default 'online';

do $$ begin
  alter table public.products
    add constraint products_channel_check check (channel in ('online', 'offline'));
exception when duplicate_object then null; end $$;

alter table public.orders
  add column if not exists channel text not null default 'online';

do $$ begin
  alter table public.orders
    add constraint orders_channel_check check (channel in ('online', 'offline'));
exception when duplicate_object then null; end $$;

alter table public.orders
  add column if not exists payment_method text;

do $$ begin
  alter table public.orders
    add constraint orders_payment_check
    check (payment_method is null or payment_method in ('Tunai', 'QRIS', 'Transfer'));
exception when duplicate_object then null; end $$;

comment on column public.products.channel is
  'online = tampil di halaman pembeli. offline = hanya untuk kasir bazaar.';
comment on column public.orders.payment_method is
  'Diisi untuk transaksi kasir. Pesanan online dibayar transfer ke tenant, di luar app.';

create index if not exists products_channel_idx on public.products (channel);
create index if not exists orders_channel_idx   on public.orders (channel);

-- ------------------------------------------- 2. Rekap: pisahkan per kanal ---

drop view if exists public.v_tenant_recap;

create view public.v_tenant_recap
with (security_invoker = on) as
select
  o.batch_id,
  o.status,
  o.channel,
  oi.tenant_id,
  t.name                                              as tenant_name,
  sum(oi.qty)                                         as total_qty,
  sum(oi.qty * oi.price_owner)                        as hak_vendor,
  sum(oi.qty * oi.price_organizer)                    as hak_panitia,
  sum(oi.qty * (oi.price_owner + oi.price_organizer)) as total_tagihan
from public.order_items oi
join public.orders  o on o.id = oi.order_id
left join public.tenants t on t.id = oi.tenant_id
group by o.batch_id, o.status, o.channel, oi.tenant_id, t.name;

-- ------------------------------------ 3. Katalog online tetap bersih --------
-- create_order (pesanan pembeli) hanya boleh menjual produk kanal online.

create or replace function public.create_order(
  p_batch_id  text,
  p_nama_anak text,
  p_kelas     text,
  p_nama_ortu text,
  p_catatan   text,
  p_items     jsonb
) returns table (code text, total_tagihan integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.batches%rowtype;
  v_code  text;
  v_order bigint;
  v_item  jsonb;
  v_prod  public.products%rowtype;
  v_var   public.product_variants%rowtype;
  v_qty   integer;
  v_owner integer;
  v_org   integer;
  v_name  text;
  v_total integer := 0;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong.';
  end if;
  if coalesce(btrim(p_nama_anak), '') = '' or coalesce(btrim(p_nama_ortu), '') = '' then
    raise exception 'Nama anak dan nama orang tua wajib diisi.';
  end if;

  select * into v_batch from public.batches where id = p_batch_id;
  if not found then raise exception 'Batch tidak ditemukan.'; end if;
  if current_date < v_batch.start_date then
    raise exception 'Periode % belum dibuka.', v_batch.name;
  end if;
  if current_date > v_batch.end_date then
    raise exception 'Periode % sudah ditutup.', v_batch.name;
  end if;

  loop
    v_code := 'BZ-' || lpad((100000 + floor(random() * 900000))::int::text, 6, '0');
    exit when not exists (select 1 from public.orders o where o.code = v_code);
  end loop;

  insert into public.orders (code, batch_id, nama_anak, kelas, nama_ortu, catatan, status, channel)
  values (v_code, p_batch_id, btrim(p_nama_anak), p_kelas, btrim(p_nama_ortu),
          nullif(btrim(coalesce(p_catatan, '')), ''), 'Unpaid', 'online')
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'qty')::integer, 0);
    if v_qty <= 0 then raise exception 'Jumlah pesanan tidak valid.'; end if;

    select * into v_prod from public.products
      where id = (v_item ->> 'product_id') and available and channel = 'online';
    if not found then
      raise exception 'Produk % tidak tersedia untuk pesanan online.', (v_item ->> 'product_id');
    end if;

    if not exists (select 1 from public.batch_tenants bt
                   where bt.batch_id = p_batch_id and bt.tenant_id = v_prod.tenant_id) then
      raise exception 'Stand pemilik produk % tidak ikut periode %.', v_prod.name, v_batch.name;
    end if;
    if exists (select 1 from public.batch_product_exclusions e
               where e.batch_id = p_batch_id and e.product_id = v_prod.id) then
      raise exception 'Produk % tidak dijual di periode %.', v_prod.name, v_batch.name;
    end if;

    v_name := v_prod.name; v_owner := v_prod.price_owner; v_org := v_prod.price_organizer;

    if (v_item ->> 'variant_id') is not null then
      select * into v_var from public.product_variants
        where id = (v_item ->> 'variant_id')::bigint and product_id = v_prod.id;
      if not found then raise exception 'Varian tidak cocok dengan produk %.', v_prod.name; end if;
      v_name  := v_prod.name || ' [' || v_var.name || ']';
      v_owner := v_var.price_owner; v_org := v_var.price_organizer;
    else
      if exists (select 1 from public.product_variants pv where pv.product_id = v_prod.id) then
        raise exception 'Produk % punya varian, varian wajib dipilih.', v_prod.name;
      end if;
    end if;

    insert into public.order_items
      (order_id, product_id, variant_id, product_name, tenant_id, qty, price_owner, price_organizer)
    values (v_order, v_prod.id, nullif(v_item ->> 'variant_id', '')::bigint, v_name,
            v_prod.tenant_id, v_qty, v_owner, v_org);

    v_total := v_total + v_qty * (v_owner + v_org);
  end loop;

  return query select v_code, v_total;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- -------------------------------------------- 4. Fungsi transaksi kasir -----
--  Beda dari create_order:
--   - Hanya bisa dipanggil admin yang sudah login (anon ditolak mentah).
--   - TIDAK memeriksa tanggal batch; bazaar offline memang digelar setelahnya.
--   - Hanya menjual produk kanal offline.
--   - Langsung berstatus Paid, karena bayar di tempat.
--  Harga tetap diambil dari database, bukan dari yang dikirim layar kasir.

create or replace function public.create_pos_order(
  p_batch_id       text,
  p_nama_pembeli   text,
  p_catatan        text,
  p_payment_method text,
  p_items          jsonb
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
  v_pembeli text;
  v_total   integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Hanya admin yang sudah login yang boleh membuat transaksi kasir.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong.';
  end if;

  if coalesce(p_payment_method, '') not in ('Tunai', 'QRIS', 'Transfer') then
    raise exception 'Metode pembayaran harus Tunai, QRIS, atau Transfer.';
  end if;

  select * into v_batch from public.batches where id = p_batch_id;
  if not found then raise exception 'Batch tidak ditemukan.'; end if;

  -- Nama pembeli boleh dikosongkan.
  v_pembeli := nullif(btrim(coalesce(p_nama_pembeli, '')), '');
  if v_pembeli is null then v_pembeli := 'admin offline'; end if;

  loop
    v_code := 'OF-' || lpad((100000 + floor(random() * 900000))::int::text, 6, '0');
    exit when not exists (select 1 from public.orders o where o.code = v_code);
  end loop;

  insert into public.orders
    (code, batch_id, nama_anak, kelas, nama_ortu, catatan, status, channel, payment_method)
  values
    (v_code, p_batch_id, v_pembeli, 'Bazaar Offline', '-',
     nullif(btrim(coalesce(p_catatan, '')), ''), 'Paid', 'offline', p_payment_method)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'qty')::integer, 0);
    if v_qty <= 0 then raise exception 'Jumlah tidak valid.'; end if;

    select * into v_prod from public.products
      where id = (v_item ->> 'product_id') and available and channel = 'offline';
    if not found then
      raise exception 'Produk % bukan produk offline atau sedang tidak tersedia.',
        (v_item ->> 'product_id');
    end if;

    if not exists (select 1 from public.batch_tenants bt
                   where bt.batch_id = p_batch_id and bt.tenant_id = v_prod.tenant_id) then
      raise exception 'Stand pemilik produk % tidak ikut periode %.', v_prod.name, v_batch.name;
    end if;
    if exists (select 1 from public.batch_product_exclusions e
               where e.batch_id = p_batch_id and e.product_id = v_prod.id) then
      raise exception 'Produk % tidak dijual di periode %.', v_prod.name, v_batch.name;
    end if;

    v_name := v_prod.name; v_owner := v_prod.price_owner; v_org := v_prod.price_organizer;

    if (v_item ->> 'variant_id') is not null then
      select * into v_var from public.product_variants
        where id = (v_item ->> 'variant_id')::bigint and product_id = v_prod.id;
      if not found then raise exception 'Varian tidak cocok dengan produk %.', v_prod.name; end if;
      v_name  := v_prod.name || ' [' || v_var.name || ']';
      v_owner := v_var.price_owner; v_org := v_var.price_organizer;
    else
      if exists (select 1 from public.product_variants pv where pv.product_id = v_prod.id) then
        raise exception 'Produk % punya varian, varian wajib dipilih.', v_prod.name;
      end if;
    end if;

    insert into public.order_items
      (order_id, product_id, variant_id, product_name, tenant_id, qty, price_owner, price_organizer)
    values (v_order, v_prod.id, nullif(v_item ->> 'variant_id', '')::bigint, v_name,
            v_prod.tenant_id, v_qty, v_owner, v_org);

    v_total := v_total + v_qty * (v_owner + v_org);
  end loop;

  return query select v_code, v_total;
end;
$$;

-- Anon TIDAK boleh menyentuh fungsi kasir sama sekali.
revoke all on function public.create_pos_order(text, text, text, text, jsonb) from public;
revoke all on function public.create_pos_order(text, text, text, text, jsonb) from anon;
grant execute on function public.create_pos_order(text, text, text, text, jsonb) to authenticated;

-- Periksa hasilnya.
select channel, count(*) as jumlah_produk from public.products group by channel order by channel;
