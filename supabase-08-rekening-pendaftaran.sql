-- ============================================================================
--  PENYESUAIAN 8 — Rekening penjual ikut didaftarkan
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-07-kanal-pendaftaran.sql.
--
--  Kalau penjual mengajukan stand BARU, rekeningnya ikut dikirim di form yang
--  sama. Saat Anda menyetujui, standnya dibuat lengkap dengan rekeningnya —
--  jadi tidak perlu mengejar nomor rekening lewat WA setelahnya.
--
--  Untuk stand yang sudah terdaftar, kolom rekening TIDAK ditanyakan dan
--  tidak pernah menimpa data stand yang ada. Rekening stand yang sudah jalan
--  hanya boleh diubah dari Kelola Stand oleh admin.
--
--  File ini aman dijalankan ulang.
-- ============================================================================

-- --------------------------------------------- 1. Kolom rekening pendaftaran --

alter table public.product_submissions add column if not exists bank_name         text;
alter table public.product_submissions add column if not exists bank_account      text;
alter table public.product_submissions add column if not exists bank_account_name text;

comment on column public.product_submissions.bank_account is
  'Hanya diisi kalau penjual mengajukan stand baru. Dipakai saat approve untuk membuat standnya.';

-- ------------------------------------- 2. submit_product: terima rekening -----

drop function if exists public.submit_product(
  text, text, text, text, text, text, text, text, text, text, integer, integer, jsonb);

create or replace function public.submit_product(
  p_code              text,
  p_channel           text,
  p_seller_name       text,
  p_seller_phone      text,
  p_tenant_id         text,
  p_tenant_baru       text,
  p_bank_name         text,
  p_bank_account      text,
  p_bank_account_name text,
  p_name              text,
  p_category          text,
  p_description       text,
  p_image_url         text,
  p_price_owner       integer,
  p_stock             integer,
  p_variants          jsonb
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
  v_bank   text;
  v_rek    text;
  v_an     text;
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
  v_bank   := nullif(btrim(coalesce(p_bank_name, '')), '');
  v_rek    := nullif(regexp_replace(coalesce(p_bank_account, ''), '[^0-9]', '', 'g'), '');
  v_an     := nullif(btrim(coalesce(p_bank_account_name, '')), '');

  if v_tenant is not null then
    if not exists (select 1 from public.tenants t where t.id = v_tenant) then
      raise exception 'Stand yang dipilih tidak ditemukan.';
    end if;
    -- Stand yang sudah ada: rekeningnya sudah tercatat, jadi apa pun yang
    -- dikirim di kolom ini diabaikan. Penjual tidak boleh mengubah rekening
    -- stand orang lain hanya dengan mendaftarkan sebuah produk.
    v_baru := null; v_bank := null; v_rek := null; v_an := null;
  elsif v_baru is null then
    raise exception 'Pilih stand yang sudah ada, atau isi nama stand baru.';
  else
    if v_bank is null then
      raise exception 'Nama bank wajib diisi untuk stand baru.';
    end if;
    if v_rek is null or length(v_rek) < 6 then
      raise exception 'Nomor rekening tidak lengkap.';
    end if;
    if v_an is null then v_an := btrim(p_seller_name); end if;
  end if;

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
     bank_name, bank_account, bank_account_name,
     name, category, description, image_url, price_owner, stock, variants)
  values
    (v_code, v_reg.batch_id, v_kanal, btrim(p_seller_name), v_telp, v_tenant, v_baru,
     v_bank, v_rek, v_an,
     btrim(p_name),
     nullif(btrim(coalesce(p_category, '')), ''),
     nullif(btrim(coalesce(p_description, '')), ''),
     nullif(btrim(coalesce(p_image_url, '')), ''),
     p_price_owner,
     case when v_kanal = 'offline' then p_stock else null end,
     case when v_kanal = 'offline' then v_bersih
          else (select coalesce(jsonb_agg(x - 'stock'), '[]'::jsonb)
                  from jsonb_array_elements(v_bersih) x) end);

  return query select v_code, v_batch.name;
end;
$$;

revoke all on function public.submit_product(text, text, text, text, text, text, text, text, text, text, text, text, text, integer, integer, jsonb) from public;
grant execute on function public.submit_product(text, text, text, text, text, text, text, text, text, text, text, text, text, integer, integer, jsonb) to anon, authenticated;

-- ----------------------- 3. approve_submission: stand baru pakai rekeningnya --
--  Tanda tangannya tidak berubah; yang berubah hanya isinya — rekening
--  diambil dari baris pendaftaran, bukan dari layar admin.

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

  v_kanal := lower(btrim(coalesce(p_channel, '')));
  if v_kanal not in ('online', 'offline') then v_kanal := v_sub.channel; end if;

  v_tenant := nullif(btrim(coalesce(p_tenant_id, '')), '');
  if v_tenant is null then
    if nullif(btrim(coalesce(p_tenant_baru, '')), '') is null then
      raise exception 'Tentukan dulu stand pemilik produk ini.';
    end if;
    v_tenant := 't-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text;
    insert into public.tenants
      (id, name, owner, phone, sort_order, bank_name, bank_account, bank_account_name)
    values
      (v_tenant, btrim(p_tenant_baru), btrim(v_sub.seller_name), v_sub.seller_phone, 1000,
       v_sub.bank_name, v_sub.bank_account,
       coalesce(v_sub.bank_account_name, btrim(v_sub.seller_name)));
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

-- --------------------------------------------------------- Periksa hasilnya ---

-- Harus satu versi saja. Dua versi berarti fungsi lama belum terhapus.
select p.proname, count(*) as jumlah_versi
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('submit_product', 'approve_submission')
group by p.proname;
