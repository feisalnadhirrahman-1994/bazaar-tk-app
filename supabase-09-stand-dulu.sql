-- ============================================================================
--  PENYESUAIAN 9 — Pilih stand dulu; identitas penjual diambil dari stand
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-08-rekening-pendaftaran.sql.
--
--  Form pendaftaran sekarang menanyakan STAND lebih dulu. Kalau standnya sudah
--  terdaftar, penjual tidak lagi mengisi nama dan nomor HP — keduanya diambil
--  dari tabel tenants di sisi server.
--
--  Itu bukan sekadar menghemat ketikan: nomor yang dipakai panitia untuk
--  konfirmasi jadi selalu nomor stand yang benar, dan tidak bisa diisi
--  sembarangan oleh siapa pun yang memegang kode pendaftaran.
--
--  Nama dan nomor HP tetap wajib untuk pengajuan STAND BARU, karena memang
--  belum ada datanya di mana pun.
--
--  Pembatas anti-spam ikut dipindahkan: dikunci ke stand untuk stand yang
--  sudah terdaftar, dan tetap ke nomor HP untuk pengajuan stand baru.
--
--  Tanda tangan fungsinya TIDAK berubah, jadi tidak ada fungsi lama yang perlu
--  dihapus. File ini aman dijalankan ulang.
-- ============================================================================

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
  v_nama_jual text;
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

    -- BARU: form tidak lagi menanyakan nama & nomor untuk stand yang sudah
    -- terdaftar. Identitasnya diambil dari tabel tenants, bukan dari layar —
    -- jadi nomor yang dipakai panitia untuk konfirmasi selalu nomor stand
    -- yang benar, bukan nomor yang bisa diisi sembarangan dari luar.
    select t.name, regexp_replace(coalesce(t.phone, ''), '[^0-9]', '', 'g')
      into v_nama_jual, v_telp
      from public.tenants t where t.id = v_tenant;
  elsif v_baru is null then
    raise exception 'Pilih stand yang sudah ada, atau isi nama stand baru.';
  else
    if coalesce(btrim(p_seller_name), '') = '' then
      raise exception 'Nama penjual wajib diisi untuk stand baru.';
    end if;
    v_nama_jual := btrim(p_seller_name);
    v_telp := regexp_replace(coalesce(p_seller_phone, ''), '[^0-9]', '', 'g');
    if length(v_telp) < 9 then
      raise exception 'Nomor WhatsApp tidak lengkap.';
    end if;
    if v_bank is null then
      raise exception 'Nama bank wajib diisi untuk stand baru.';
    end if;
    if v_rek is null or length(v_rek) < 6 then
      raise exception 'Nomor rekening tidak lengkap.';
    end if;
    if v_an is null then v_an := v_nama_jual; end if;
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

  -- Pembatas anti-spam. Dikunci ke STAND kalau standnya sudah terdaftar,
  -- karena nomor HP tidak lagi datang dari layar untuk kasus itu.
  if v_tenant is not null then
    if (select count(*) from public.product_submissions s
         where s.tenant_id = v_tenant
           and s.created_at > now() - interval '1 hour') >= 30 then
      raise exception 'Terlalu banyak pendaftaran dari stand ini dalam satu jam. Coba lagi nanti.';
    end if;
  elsif (select count(*) from public.product_submissions s
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
    (v_code, v_reg.batch_id, v_kanal, v_nama_jual, v_telp, v_tenant, v_baru,
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


-- --------------------------------------------------------- Periksa hasilnya ---

-- Stand yang nomor WhatsApp-nya kosong tidak akan bisa dikonfirmasi lewat
-- tombol WA di panel admin. Lengkapi lewat Kelola Stand kalau ada yang muncul.
select id, name from public.tenants
where coalesce(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), '') = ''
order by name;
