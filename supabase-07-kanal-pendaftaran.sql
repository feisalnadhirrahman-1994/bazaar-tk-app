-- ============================================================================
--  PENYESUAIAN 7 — Penjual boleh memilih kanal; stok tetap milik kasir saja
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-06-pendaftaran-produk.sql.
--  Aman dijalankan ulang: semuanya "create or replace" / "add if not exists".
--
--  Isi:
--   1. Kolom channel di product_submissions: penjual memilih mau didaftarkan
--      ke etalase online atau ke bazaar offline (kasir).
--   2. submit_product & approve_submission menerima kanalnya. Fungsi versi
--      lama DIHAPUS, bukan dibiarkan berdampingan — kalau dibiarkan, jalur
--      lama masih bisa dipanggil dan selalu menghasilkan produk offline.
--   3. Stok HANYA berlaku untuk bazaar offline. Pesanan online adalah PO:
--      penjual membuat sebanyak yang dipesan, jadi tidak ada stok yang
--      membatasi dan semua pesanan harus bisa masuk. Bagian ini memastikan
--      create_order tidak memotong stok dan trigger pemulihan stok hanya
--      menyentuh pesanan offline.
-- ============================================================================

-- ------------------------------------------------- 1. Kanal pendaftaran -----

alter table public.product_submissions
  add column if not exists channel text not null default 'offline';

do $$ begin
  alter table public.product_submissions
    add constraint submissions_channel_check check (channel in ('online', 'offline'));
exception when duplicate_object then null; end $$;

comment on column public.product_submissions.channel is
  'Kanal yang diminta penjual. Admin masih boleh memindahkannya saat review.';

create index if not exists submissions_channel_idx on public.product_submissions (channel);

-- --------------------------------- 2. submit_product: terima kanal ----------

drop function if exists public.submit_product(
  text, text, text, text, text, text, text, text, text, integer, integer, jsonb);

create or replace function public.submit_product(
  p_code         text,
  p_channel      text,
  p_seller_name  text,
  p_seller_phone text,
  p_tenant_id    text,
  p_tenant_baru  text,
  p_name         text,
  p_category     text,
  p_description  text,
  p_image_url    text,
  p_price_owner  integer,
  p_stock        integer,
  p_variants     jsonb
) returns table (code text, batch_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg    public.registration_settings%rowtype;
  v_batch  public.batches%rowtype;
  v_code   text;
  v_kanal  text;
  v_v      jsonb;
  v_bersih jsonb := '[]'::jsonb;
  v_nama   text;
  v_harga  integer;
  v_stok   integer;
  v_telp   text;
  v_tenant text;
  v_baru   text;
begin
  select r.* into v_reg
    from public.registration_settings r
    join public.batches b on b.id = r.batch_id
   where r.is_open
     and upper(btrim(r.code)) = upper(btrim(coalesce(p_code, '')))
   order by b.start_date desc
   limit 1;
  if not found then
    raise exception 'Kode pendaftaran tidak dikenal, atau pendaftaran sedang ditutup.';
  end if;

  select * into v_batch from public.batches where id = v_reg.batch_id;

  v_kanal := lower(btrim(coalesce(p_channel, '')));
  if v_kanal not in ('online', 'offline') then
    raise exception 'Pilih dulu mau dijual di etalase online atau bazaar offline.';
  end if;

  if coalesce(btrim(p_seller_name), '') = '' then
    raise exception 'Nama penjual wajib diisi.';
  end if;

  v_telp := regexp_replace(coalesce(p_seller_phone, ''), '[^0-9]', '', 'g');
  if length(v_telp) < 9 then
    raise exception 'Nomor WhatsApp tidak lengkap.';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Nama produk wajib diisi.';
  end if;

  if p_price_owner is null or p_price_owner < 0 then
    raise exception 'Harga nett wajib diisi dan tidak boleh minus.';
  end if;

  if p_stock is not null and p_stock < 0 then
    raise exception 'Jumlah barang tidak boleh minus.';
  end if;

  v_tenant := nullif(btrim(coalesce(p_tenant_id, '')), '');
  v_baru   := nullif(btrim(coalesce(p_tenant_baru, '')), '');
  if v_tenant is not null then
    if not exists (select 1 from public.tenants t where t.id = v_tenant) then
      raise exception 'Stand yang dipilih tidak ditemukan.';
    end if;
    v_baru := null;
  elsif v_baru is null then
    raise exception 'Pilih stand yang sudah ada, atau isi nama stand baru.';
  end if;

  -- Varian disusun ULANG di sini: apa pun yang dikirim layar, yang tersimpan
  -- hanya tiga kolom ini, jadi price_organizer tidak mungkin ikut menyelinap.
  if p_variants is not null and jsonb_typeof(p_variants) = 'array' then
    for v_v in select * from jsonb_array_elements(p_variants) loop
      v_nama := nullif(btrim(coalesce(v_v ->> 'name', '')), '');
      if v_nama is null then continue; end if;

      begin
        v_harga := (v_v ->> 'price_owner')::integer;
      exception when others then
        raise exception 'Harga varian "%" tidak berupa angka.', v_nama;
      end;
      if v_harga is null or v_harga < 0 then
        raise exception 'Harga varian "%" wajib diisi dan tidak boleh minus.', v_nama;
      end if;

      begin
        v_stok := nullif(btrim(coalesce(v_v ->> 'stock', '')), '')::integer;
      exception when others then
        raise exception 'Stok varian "%" tidak berupa angka.', v_nama;
      end;
      if v_stok is not null and v_stok < 0 then
        raise exception 'Stok varian "%" tidak boleh minus.', v_nama;
      end if;

      v_bersih := v_bersih || jsonb_build_object(
        'name', v_nama, 'price_owner', v_harga, 'stock', v_stok);
    end loop;
  end if;

  if jsonb_array_length(v_bersih) > 20 then
    raise exception 'Maksimal 20 varian per produk.';
  end if;

  if (select count(*) from public.product_submissions s
       where s.seller_phone = v_telp
         and s.created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Terlalu banyak pendaftaran dari nomor ini dalam satu jam. Coba lagi nanti.';
  end if;

  if p_image_url is not null and btrim(p_image_url) <> ''
     and p_image_url not like 'https://%/storage/v1/object/public/product-images/%' then
    raise exception 'Alamat gambar tidak dikenali. Unggah ulang fotonya lewat form.';
  end if;

  loop
    v_code := 'SB-' || lpad((100000 + floor(random() * 900000))::int::text, 6, '0');
    exit when not exists (select 1 from public.product_submissions s where s.code = v_code);
  end loop;

  insert into public.product_submissions
    (code, batch_id, channel, seller_name, seller_phone, tenant_id, tenant_baru,
     name, category, description, image_url, price_owner, stock, variants)
  values
    (v_code, v_reg.batch_id, v_kanal, btrim(p_seller_name), v_telp, v_tenant, v_baru,
     btrim(p_name),
     nullif(btrim(coalesce(p_category, '')), ''),
     nullif(btrim(coalesce(p_description, '')), ''),
     nullif(btrim(coalesce(p_image_url, '')), ''),
     p_price_owner,
     -- Stok hanya berarti untuk bazaar offline. Pendaftaran online disimpan
     -- tanpa angka stok walaupun layar mengirimkannya.
     case when v_kanal = 'offline' then p_stock else null end,
     case when v_kanal = 'offline' then v_bersih
          else (select coalesce(jsonb_agg(x - 'stock'), '[]'::jsonb)
                  from jsonb_array_elements(v_bersih) x) end);

  return query select v_code, v_batch.name;
end;
$$;

revoke all on function public.submit_product(text, text, text, text, text, text, text, text, text, text, integer, integer, jsonb) from public;
grant execute on function public.submit_product(text, text, text, text, text, text, text, text, text, text, integer, integer, jsonb) to anon, authenticated;

-- ------------------------------ 3. approve_submission: terima kanal ---------

drop function if exists public.approve_submission(
  bigint, text, text, text, text, text, text, integer, integer, integer, jsonb);

create or replace function public.approve_submission(
  p_submission_id   bigint,
  p_channel         text,
  p_tenant_id       text,
  p_tenant_baru     text,
  p_name            text,
  p_category        text,
  p_description     text,
  p_image_url       text,
  p_price_owner     integer,
  p_price_organizer integer,
  p_stock           integer,
  p_variants        jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub    public.product_submissions%rowtype;
  v_tenant text;
  v_kanal  text;
  v_pid    text;
  v_v      jsonb;
  v_i      integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Hanya admin yang sudah login yang boleh menyetujui pendaftaran.';
  end if;

  select * into v_sub from public.product_submissions
   where id = p_submission_id for update;
  if not found then raise exception 'Pendaftaran tidak ditemukan.'; end if;
  if v_sub.status <> 'pending' then
    raise exception 'Pendaftaran % sudah pernah di-review (status: %).', v_sub.code, v_sub.status;
  end if;

  -- Admin boleh memindahkan kanalnya; kalau tidak diisi, ikut permintaan penjual.
  v_kanal := lower(btrim(coalesce(p_channel, '')));
  if v_kanal not in ('online', 'offline') then v_kanal := v_sub.channel; end if;

  v_tenant := nullif(btrim(coalesce(p_tenant_id, '')), '');
  if v_tenant is null then
    if nullif(btrim(coalesce(p_tenant_baru, '')), '') is null then
      raise exception 'Tentukan dulu stand pemilik produk ini.';
    end if;
    v_tenant := 't-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text;
    insert into public.tenants (id, name, owner, phone, sort_order)
    values (v_tenant, btrim(p_tenant_baru), btrim(v_sub.seller_name), v_sub.seller_phone, 1000);
  elsif not exists (select 1 from public.tenants t where t.id = v_tenant) then
    raise exception 'Stand yang dipilih tidak ditemukan.';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Nama produk wajib diisi.';
  end if;
  if p_price_organizer is null or p_price_organizer < 0 then
    raise exception 'Margin panitia wajib diisi.';
  end if;

  v_pid := 'p-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text;

  insert into public.products
    (id, tenant_id, name, price_owner, price_organizer, description, category,
     image_url, available, channel, stock)
  values
    (v_pid, v_tenant, btrim(p_name),
     coalesce(p_price_owner, 0), coalesce(p_price_organizer, 0),
     nullif(btrim(coalesce(p_description, '')), ''),
     nullif(btrim(coalesce(p_category, '')), ''),
     nullif(btrim(coalesce(p_image_url, '')), ''),
     true, v_kanal,
     case when v_kanal = 'offline' then p_stock else null end);

  if p_variants is not null and jsonb_typeof(p_variants) = 'array' then
    for v_v in select * from jsonb_array_elements(p_variants) loop
      if nullif(btrim(coalesce(v_v ->> 'name', '')), '') is null then continue; end if;
      insert into public.product_variants
        (product_id, name, price_owner, price_organizer, stock, sort_order)
      values (v_pid, btrim(v_v ->> 'name'),
              coalesce((v_v ->> 'price_owner')::integer, 0),
              coalesce((v_v ->> 'price_organizer')::integer, 0),
              case when v_kanal = 'offline'
                   then nullif(btrim(coalesce(v_v ->> 'stock', '')), '')::integer
                   else null end,
              v_i)
      on conflict (product_id, name) do update
        set price_owner = excluded.price_owner,
            price_organizer = excluded.price_organizer,
            stock = excluded.stock,
            sort_order = excluded.sort_order;
      v_i := v_i + 1;
    end loop;
  end if;

  -- Tanpa ini produknya ada tapi ditolak saat dipesan: create_order maupun
  -- create_pos_order memeriksa standnya terdaftar ikut periode berjalan.
  insert into public.batch_tenants (batch_id, tenant_id)
  values (v_sub.batch_id, v_tenant)
  on conflict do nothing;

  update public.product_submissions
     set status = 'approved', product_id = v_pid, reviewed_at = now(),
         tenant_id = v_tenant, channel = v_kanal
   where id = p_submission_id;

  return v_pid;
end;
$$;

revoke all on function public.approve_submission(bigint, text, text, text, text, text, text, text, integer, integer, integer, jsonb) from public;
revoke all on function public.approve_submission(bigint, text, text, text, text, text, text, text, integer, integer, integer, jsonb) from anon;
grant execute on function public.approve_submission(bigint, text, text, text, text, text, text, text, integer, integer, integer, jsonb) to authenticated;

-- ------------------- 4. Stok TETAP khusus offline (pesanan online = PO) -----
--  Pesanan online berjalan sebagai pre-order: penjual menyiapkan barang
--  setelah periode pesan ditutup, jadi semua pesanan harus bisa masuk dan
--  tidak boleh ada yang ditolak karena stok. Stok hanya berlaku di kasir.
--
--  Blok ini menegaskan ulang kedua fungsi ke bentuk itu, jadi file ini aman
--  dijalankan ulang kalau versi sebelumnya sempat dijalankan.

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
      perform public.geser_stok_order(new.id, -1);
    end if;
  end if;
  return new;
end;
$$;

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

    -- Sengaja TIDAK memotong stok: pesanan online adalah PO, semua pesanan masuk.

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

-- Produk online tidak boleh menyimpan angka stok: kalau sempat terisi dari
-- pendaftaran, dikosongkan supaya tidak ada angka yang tidak berarti apa-apa.
update public.products set stock = null where channel = 'online' and stock is not null;
update public.product_variants v set stock = null
  from public.products p where p.id = v.product_id and p.channel = 'online' and v.stock is not null;

-- --------------------------------------------------------- Periksa hasilnya ---

select channel, status, count(*) as jumlah
from public.product_submissions
group by channel, status order by channel, status;

-- Pastikan hanya ada SATU versi tiap fungsi (kalau ada dua, versi lama belum terhapus):
select p.proname, count(*) as jumlah_versi
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('submit_product', 'approve_submission')
group by p.proname;
