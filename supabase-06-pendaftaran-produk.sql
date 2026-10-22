-- ============================================================================
--  PENYESUAIAN 6 — Pendaftaran produk offline oleh penjual
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-05-stok-offline.sql.
--
--  Ini menambah jalur tulis pertama untuk orang yang TIDAK login. Karena itu
--  aturannya ketat:
--
--   1. Pendaftaran masuk ke tabel TERSENDIRI (product_submissions), bukan ke
--      products. Produk baru ada setelah admin menyetujui, jadi tidak ada
--      kemungkinan produk tanpa margin bocor ke kasir atau halaman pembeli.
--   2. Penjual tidak menyentuh tabel apa pun. Dia hanya boleh memanggil satu
--      fungsi, submit_product. Tabelnya sendiri tidak bisa dibaca maupun
--      ditulis oleh anon — isinya ada nomor HP penjual.
--   3. Margin panitia TIDAK ADA di jalur penjual. Bukan disembunyikan di
--      tampilan: fungsinya memang tidak menerimanya, dan varian yang dikirim
--      disusun ulang di server supaya kolom asing dibuang.
--   4. Kode pendaftaran disimpan di tabel yang tidak bisa dibaca anon dan
--      dicocokkan di server. Kalau ditaruh di tabel batches yang memang boleh
--      dibaca siapa pun, kodenya bisa ditarik lewat API dan gerbangnya hilang.
-- ============================================================================

-- --------------------------------------- 1. Pengaturan pendaftaran per batch ---

create table if not exists public.registration_settings (
  batch_id   text primary key references public.batches(id) on delete cascade,
  is_open    boolean not null default false,
  code       text    not null,
  updated_at timestamptz not null default now()
);

comment on table public.registration_settings is
  'Buka/tutup pendaftaran produk + kodenya, per batch. TIDAK boleh dibaca anon.';

alter table public.registration_settings enable row level security;

-- Hanya admin yang login. Tidak ada kebijakan untuk anon sama sekali, jadi
-- anon tidak bisa membaca kodenya walaupun mencoba lewat REST API langsung.
drop policy if exists "admin kelola pendaftaran" on public.registration_settings;
create policy "admin kelola pendaftaran"
  on public.registration_settings for all to authenticated using (true) with check (true);

revoke all on table public.registration_settings from anon;

-- ----------------------------------------------- 2. Tabel pendaftaran ---------

create table if not exists public.product_submissions (
  id           bigserial primary key,
  code         text not null unique,                -- SB-123456, dipegang penjual
  batch_id     text not null references public.batches(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),

  seller_name  text not null,
  seller_phone text not null,

  -- Salah satu harus terisi: stand yang sudah ada, atau usulan stand baru.
  tenant_id    text references public.tenants(id) on delete set null,
  tenant_baru  text,

  name         text not null,
  category     text,
  description  text,
  image_url    text,
  price_owner  integer not null check (price_owner >= 0),
  stock        integer check (stock is null or stock >= 0),
  variants     jsonb not null default '[]'::jsonb,

  -- Jejak review.
  product_id   text references public.products(id) on delete set null,
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz not null default now(),

  constraint submissions_stand_check check (
    tenant_id is not null or nullif(btrim(coalesce(tenant_baru, '')), '') is not null
  )
);

create index if not exists submissions_status_idx on public.product_submissions (status, created_at desc);
create index if not exists submissions_batch_idx  on public.product_submissions (batch_id);

comment on column public.product_submissions.variants is
  'Disusun ulang di server: hanya name, price_owner, stock. Margin tidak pernah datang dari penjual.';

alter table public.product_submissions enable row level security;

drop policy if exists "admin kelola pendaftaran produk" on public.product_submissions;
create policy "admin kelola pendaftaran produk"
  on public.product_submissions for all to authenticated using (true) with check (true);

-- Tidak ada kebijakan untuk anon: tidak bisa baca, tidak bisa tulis langsung.
revoke all on table public.product_submissions from anon;
revoke all on sequence public.product_submissions_id_seq from anon;

-- ------------------------------- 3. Penjual: apakah pendaftaran sedang buka ---
--  Halaman depan perlu tahu ini untuk menampilkan menunya, tapi tidak boleh
--  tahu kodenya. Jadi yang dibuka hanya jawaban buka/tutup + nama periodenya.

create or replace function public.registration_status()
returns table (is_open boolean, batch_name text)
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(r.is_open, false), b.name
    from public.registration_settings r
    join public.batches b on b.id = r.batch_id
   where r.is_open
   order by b.start_date desc
   limit 1;
$$;

revoke all on function public.registration_status() from public;
grant execute on function public.registration_status() to anon, authenticated;

-- --------------------------------------------- 4. Penjual: kirim pendaftaran ---

create or replace function public.submit_product(
  p_code         text,
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
  v_v      jsonb;
  v_bersih jsonb := '[]'::jsonb;
  v_nama   text;
  v_harga  integer;
  v_stok   integer;
  v_telp   text;
  v_tenant text;
  v_baru   text;
begin
  -- Pintu masuk: kode harus cocok DAN pendaftaran batch itu harus terbuka.
  -- Pesan kesalahannya sengaja satu macam, supaya tidak memberi tahu bagian
  -- mana yang salah kepada orang yang sedang menebak-nebak.
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
    raise exception 'Jumlah stok tidak boleh minus.';
  end if;

  -- Stand: pilih yang ada, atau ajukan baru. Tidak boleh dua-duanya kosong.
  v_tenant := nullif(btrim(coalesce(p_tenant_id, '')), '');
  v_baru   := nullif(btrim(coalesce(p_tenant_baru, '')), '');
  if v_tenant is not null then
    if not exists (select 1 from public.tenants t where t.id = v_tenant) then
      raise exception 'Stand yang dipilih tidak ditemukan.';
    end if;
    v_baru := null;              -- stand yang ada menang; usulan diabaikan
  elsif v_baru is null then
    raise exception 'Pilih stand yang sudah ada, atau isi nama stand baru.';
  end if;

  -- Varian disusun ULANG di sini. Apa pun yang dikirim layar, yang tersimpan
  -- hanya tiga kolom ini — jadi price_organizer tidak mungkin ikut menyelinap.
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

  -- Pagar sederhana terhadap pengiriman berulang-ulang dari satu nomor.
  if (select count(*) from public.product_submissions s
       where s.seller_phone = v_telp
         and s.created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Terlalu banyak pendaftaran dari nomor ini dalam satu jam. Coba lagi nanti.';
  end if;

  -- Hanya terima URL gambar dari Storage proyek ini. Tanpa ini, kolom gambar
  -- bisa dipakai menanamkan tautan ke mana saja, lalu tampil di panel admin.
  if p_image_url is not null and btrim(p_image_url) <> ''
     and p_image_url not like 'https://%/storage/v1/object/public/product-images/%' then
    raise exception 'Alamat gambar tidak dikenali. Unggah ulang fotonya lewat form.';
  end if;

  loop
    v_code := 'SB-' || lpad((100000 + floor(random() * 900000))::int::text, 6, '0');
    exit when not exists (select 1 from public.product_submissions s where s.code = v_code);
  end loop;

  insert into public.product_submissions
    (code, batch_id, seller_name, seller_phone, tenant_id, tenant_baru,
     name, category, description, image_url, price_owner, stock, variants)
  values
    (v_code, v_reg.batch_id, btrim(p_seller_name), v_telp, v_tenant, v_baru,
     btrim(p_name),
     nullif(btrim(coalesce(p_category, '')), ''),
     nullif(btrim(coalesce(p_description, '')), ''),
     nullif(btrim(coalesce(p_image_url, '')), ''),
     p_price_owner,
     p_stock,
     v_bersih);

  return query select v_code, v_batch.name;
end;
$$;

revoke all on function public.submit_product(text, text, text, text, text, text, text, text, text, integer, integer, jsonb) from public;
grant execute on function public.submit_product(text, text, text, text, text, text, text, text, text, integer, integer, jsonb) to anon, authenticated;

-- ------------------------------------------- 5. Admin: setujui pendaftaran ----
--  Satu fungsi, bukan tiga perintah dari app, supaya membuat produk dan
--  menandai pendaftaran terjadi bersama-sama. Kalau terpisah dan koneksi
--  terputus di tengah, pendaftaran yang sama bisa disetujui dua kali dan
--  produknya jadi dobel.

create or replace function public.approve_submission(
  p_submission_id   bigint,
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

  -- Stand: pakai yang dipilih admin, atau buat baru kalau admin mengisi namanya.
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
     true, 'offline', p_stock);

  if p_variants is not null and jsonb_typeof(p_variants) = 'array' then
    for v_v in select * from jsonb_array_elements(p_variants) loop
      if nullif(btrim(coalesce(v_v ->> 'name', '')), '') is null then continue; end if;
      insert into public.product_variants
        (product_id, name, price_owner, price_organizer, stock, sort_order)
      values (v_pid, btrim(v_v ->> 'name'),
              coalesce((v_v ->> 'price_owner')::integer, 0),
              coalesce((v_v ->> 'price_organizer')::integer, 0),
              nullif(btrim(coalesce(v_v ->> 'stock', '')), '')::integer,
              v_i)
      on conflict (product_id, name) do update
        set price_owner = excluded.price_owner,
            price_organizer = excluded.price_organizer,
            stock = excluded.stock,
            sort_order = excluded.sort_order;
      v_i := v_i + 1;
    end loop;
  end if;

  -- Tanpa ini, produknya ada tapi kasir menolaknya: create_pos_order memeriksa
  -- standnya terdaftar ikut periode berjalan.
  insert into public.batch_tenants (batch_id, tenant_id)
  values (v_sub.batch_id, v_tenant)
  on conflict do nothing;

  update public.product_submissions
     set status = 'approved', product_id = v_pid, reviewed_at = now(),
         tenant_id = v_tenant
   where id = p_submission_id;

  return v_pid;
end;
$$;

revoke all on function public.approve_submission(bigint, text, text, text, text, text, text, integer, integer, integer, jsonb) from public;
revoke all on function public.approve_submission(bigint, text, text, text, text, text, text, integer, integer, integer, jsonb) from anon;
grant execute on function public.approve_submission(bigint, text, text, text, text, text, text, integer, integer, integer, jsonb) to authenticated;

-- --------------------------------------------- 6. Admin: tolak pendaftaran ----

create or replace function public.reject_submission(p_submission_id bigint, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Hanya admin yang sudah login yang boleh menolak pendaftaran.';
  end if;

  update public.product_submissions
     set status = 'rejected', reviewed_at = now(),
         review_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_submission_id and status = 'pending';

  if not found then
    raise exception 'Pendaftaran tidak ditemukan atau sudah pernah di-review.';
  end if;
end;
$$;

revoke all on function public.reject_submission(bigint, text) from public;
revoke all on function public.reject_submission(bigint, text) from anon;
grant execute on function public.reject_submission(bigint, text) to authenticated;

-- ----------------------------------- 7. Foto pendaftaran: folder terpisah -----
--  Penjual hanya boleh MENAMBAH file ke dalam folder submissions/. Tidak boleh
--  menimpa, menghapus, atau menjelajah file lain. Karena itu app harus
--  mengunggah dengan upsert: false dan nama berkas acak.

drop policy if exists "anon unggah foto pendaftaran" on storage.objects;
create policy "anon unggah foto pendaftaran"
  on storage.objects for insert to anon
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'submissions'
  );

-- Batas ukuran & jenis berkas berlaku untuk seluruh bucket. 1 MB sudah sangat
-- longgar: app mengompres foto ke maksimal 400px, sekitar 30 KB per foto.
update storage.buckets
   set file_size_limit = 1048576,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'product-images';

-- --------------------------------------------------------- Periksa hasilnya ---

select 'registration_settings' as tabel, count(*) as baris from public.registration_settings
union all
select 'product_submissions', count(*) from public.product_submissions;

-- Buka pendaftaran untuk batch aktif dengan kode pilihan Anda:
--
--   insert into public.registration_settings (batch_id, is_open, code)
--   select id, true, 'DANUS2026' from public.batches where is_active
--   on conflict (batch_id) do update
--     set is_open = true, code = excluded.code, updated_at = now();
--
-- Atau atur lewat panel admin di tab Kelola Batch.
