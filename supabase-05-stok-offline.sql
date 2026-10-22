-- ============================================================================
--  PENYESUAIAN 5 — Stok produk offline
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-04-kasir-offline.sql.
--
--  Konsep:
--   - Stok menempel di VARIAN kalau produknya bervarian, dan di PRODUK kalau
--     tidak. Sama polanya dengan harga, supaya tidak ada dua sumber kebenaran.
--   - stock NULL berarti TIDAK DIBATASI. Produk offline yang sudah ada
--     sekarang otomatis NULL, jadi tidak ada yang tiba-tiba terblokir.
--   - Pemotongan stok dilakukan di dalam create_pos_order, bukan di layar
--     kasir. Layar kasir boleh keliru; database tidak boleh.
--   - Transaksi offline yang dibatalkan atau dihapus mengembalikan stoknya
--     sendiri lewat trigger, jadi jalur mana pun yang dipakai app tetap aman.
-- ============================================================================

-- --------------------------------------------------------- 1. Kolom stok ---

alter table public.products          add column if not exists stock integer;
alter table public.product_variants  add column if not exists stock integer;

do $$ begin
  alter table public.products
    add constraint products_stock_check check (stock is null or stock >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.product_variants
    add constraint product_variants_stock_check check (stock is null or stock >= 0);
exception when duplicate_object then null; end $$;

comment on column public.products.stock is
  'Sisa stok bazaar offline. NULL = tidak dibatasi. Diabaikan kalau produk punya varian.';
comment on column public.product_variants.stock is
  'Sisa stok varian untuk bazaar offline. NULL = tidak dibatasi.';

-- ------------------------------------------- 2. Penggeser stok satu order ---
--  p_arah = +1 mengembalikan stok, -1 memotong kembali.
--  Dijumlahkan dulu per produk/varian: kalau satu order memuat dua baris
--  produk yang sama, "update ... from" hanya akan mengenai baris target
--  sekali, dan stoknya jadi salah hitung.

create or replace function public.geser_stok_order(p_order_id bigint, p_arah integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_variants v
     set stock = v.stock + p_arah * s.qty
    from (select variant_id, sum(qty) as qty
            from public.order_items
           where order_id = p_order_id and variant_id is not null
           group by variant_id) s
   where s.variant_id = v.id and v.stock is not null;

  update public.products p
     set stock = p.stock + p_arah * s.qty
    from (select product_id, sum(qty) as qty
            from public.order_items
           where order_id = p_order_id and variant_id is null
           group by product_id) s
   where s.product_id = p.id and p.stock is not null;
end;
$$;

-- --------------------------------------- 3. Trigger: batal & hapus order ---
--  App mengubah status dan menghapus pesanan langsung ke tabel, bukan lewat
--  fungsi. Jadi penjaganya ditaruh di database supaya tidak ada jalur yang
--  terlewat kalau nanti tampilannya berubah.

create or replace function public.trg_orders_stok()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    -- BEFORE DELETE: order_items masih ada (cascade belum jalan).
    if old.channel = 'offline' and old.status <> 'Batal' then
      perform public.geser_stok_order(old.id, 1);
    end if;
    return old;
  end if;

  if new.channel = 'offline' then
    if old.status <> 'Batal' and new.status = 'Batal' then
      perform public.geser_stok_order(new.id, 1);
    elsif old.status = 'Batal' and new.status <> 'Batal' then
      -- Mengaktifkan kembali pesanan yang dibatalkan: stok dipotong lagi.
      -- Kalau stoknya sudah tidak cukup, batasan kolom yang menolak.
      perform public.geser_stok_order(new.id, -1);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_stok_update on public.orders;
create trigger orders_stok_update
  after update of status on public.orders
  for each row execute function public.trg_orders_stok();

drop trigger if exists orders_stok_delete on public.orders;
create trigger orders_stok_delete
  before delete on public.orders
  for each row execute function public.trg_orders_stok();

-- ------------------------------------ 4. Kasir: potong stok secara atomik ---

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
  v_sisa    integer;
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

      -- Satu pernyataan yang sekaligus memeriksa dan memotong. Dua kasir yang
      -- menekan Selesaikan di detik yang sama tidak bisa sama-sama lolos:
      -- yang kedua menunggu, lalu syarat stock >= qty diuji ulang atas nilai
      -- terbaru. stock NULL tetap NULL, jadi "tidak dibatasi" ikut tertangani
      -- tanpa cabang khusus.
      update public.product_variants
         set stock = stock - v_qty
       where id = v_var.id and (stock is null or stock >= v_qty);
      if not found then
        select stock into v_sisa from public.product_variants where id = v_var.id;
        raise exception 'Stok % [%] tinggal %, tidak cukup untuk % pcs.',
          v_prod.name, v_var.name, coalesce(v_sisa, 0), v_qty;
      end if;
    else
      if exists (select 1 from public.product_variants pv where pv.product_id = v_prod.id) then
        raise exception 'Produk % punya varian, varian wajib dipilih.', v_prod.name;
      end if;

      update public.products
         set stock = stock - v_qty
       where id = v_prod.id and (stock is null or stock >= v_qty);
      if not found then
        select stock into v_sisa from public.products where id = v_prod.id;
        raise exception 'Stok % tinggal %, tidak cukup untuk % pcs.',
          v_prod.name, coalesce(v_sisa, 0), v_qty;
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

revoke all on function public.create_pos_order(text, text, text, text, jsonb) from public;
revoke all on function public.create_pos_order(text, text, text, text, jsonb) from anon;
grant execute on function public.create_pos_order(text, text, text, text, jsonb) to authenticated;

-- Fungsi penggeser stok tidak perlu dipanggil dari app sama sekali.
revoke all on function public.geser_stok_order(bigint, integer) from public;
revoke all on function public.geser_stok_order(bigint, integer) from anon;

-- Periksa hasilnya: semua produk offline mestinya masih NULL (tidak dibatasi).
select channel,
       count(*)                                as jumlah_produk,
       count(*) filter (where stock is null)    as stok_tidak_dibatasi,
       count(*) filter (where stock is not null) as stok_dibatasi
from public.products group by channel order by channel;
