-- ============================================================================
--  PENYESUAIAN 2 — Rekening stand + peserta per batch
--  Jalankan sekali di Supabase SQL Editor, setelah supabase-patch-status.sql.
--
--  Isi:
--   1. Kolom bank & rekening di tabel tenants.
--   2. batch_tenants          : stand mana yang ikut di sebuah batch.
--   3. batch_product_exclusions: produk milik stand peserta yang DIKECUALIKAN.
--
--  Aturannya: stand harus dipilih dulu untuk ikut sebuah batch. Begitu
--  dipilih, SEMUA produknya otomatis ikut, kecuali yang didaftarkan di
--  batch_product_exclusions. Jadi tidak perlu lagi menghapus produk tiap
--  kali membuka batch baru.
-- ============================================================================

-- ------------------------------------------------- 1. Rekening stand --------

alter table public.tenants add column if not exists bank_name         text;
alter table public.tenants add column if not exists bank_account      text;
alter table public.tenants add column if not exists bank_account_name text;

comment on column public.tenants.bank_account_name is
  'Nama pemilik rekening, sering berbeda dari nama stand.';

-- --------------------------------------------- 2. Stand peserta batch -------

create table if not exists public.batch_tenants (
  batch_id   text not null references public.batches(id) on delete cascade,
  tenant_id  text not null references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (batch_id, tenant_id)
);

create index if not exists batch_tenants_batch_idx on public.batch_tenants (batch_id);

-- ------------------------------------ 3. Produk yang dikecualikan -----------

create table if not exists public.batch_product_exclusions (
  batch_id   text not null references public.batches(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (batch_id, product_id)
);

create index if not exists batch_excl_batch_idx on public.batch_product_exclusions (batch_id);

-- ------------------------------------------------- Aturan akses (RLS) -------

alter table public.batch_tenants            enable row level security;
alter table public.batch_product_exclusions enable row level security;

drop policy if exists "peserta batch boleh dibaca siapa pun" on public.batch_tenants;
create policy "peserta batch boleh dibaca siapa pun"
  on public.batch_tenants for select using (true);

drop policy if exists "admin kelola peserta batch" on public.batch_tenants;
create policy "admin kelola peserta batch"
  on public.batch_tenants for all to authenticated using (true) with check (true);

drop policy if exists "pengecualian batch boleh dibaca siapa pun" on public.batch_product_exclusions;
create policy "pengecualian batch boleh dibaca siapa pun"
  on public.batch_product_exclusions for select using (true);

drop policy if exists "admin kelola pengecualian batch" on public.batch_product_exclusions;
create policy "admin kelola pengecualian batch"
  on public.batch_product_exclusions for all to authenticated using (true) with check (true);

-- --------------------------- Data lama: semua stand ikut batch yang ada -----
-- Batch September memang diikuti seluruh stand, jadi rekap lama tetap utuh.

insert into public.batch_tenants (batch_id, tenant_id)
select b.id, t.id
from public.batches b
cross join public.tenants t
on conflict do nothing;

-- ---------------------------- create_order: ikut menjaga peserta batch ------
-- Penjaga di sisi server, bukan cuma di tampilan. Produk dari stand yang
-- tidak ikut periode ini akan ditolak walau dipaksa lewat API.

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

    -- BARU: standnya harus terdaftar ikut periode ini.
    if not exists (
      select 1 from public.batch_tenants bt
      where bt.batch_id = p_batch_id and bt.tenant_id = v_prod.tenant_id
    ) then
      raise exception 'Stand pemilik produk % tidak ikut periode %.', v_prod.name, v_batch.name;
    end if;

    -- BARU: produknya tidak boleh termasuk yang dikecualikan di periode ini.
    if exists (
      select 1 from public.batch_product_exclusions e
      where e.batch_id = p_batch_id and e.product_id = v_prod.id
    ) then
      raise exception 'Produk % tidak dijual di periode %.', v_prod.name, v_batch.name;
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

-- Periksa hasilnya.
select b.name as batch, count(bt.tenant_id) as stand_ikut
from public.batches b
left join public.batch_tenants bt on bt.batch_id = b.id
group by b.name;
