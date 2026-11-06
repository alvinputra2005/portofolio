-- Jalankan seluruh berkas di Supabase SQL Editor. Tidak menghapus data lama.
begin;
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.portfolio_admins enable row level security;
create or replace function public.is_portfolio_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.portfolio_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;
drop policy if exists "admin reads own membership" on public.portfolio_admins;
create policy "admin reads own membership" on public.portfolio_admins for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.portfolio_admins to authenticated;

create table if not exists public.content_entries (
  id text primary key,
  kind text not null check (kind in ('profile','experience','project','achievement','credential','skill_group','tech_item','site_settings')),
  position integer not null default 0,
  draft jsonb not null check (jsonb_typeof(draft) = 'object'),
  updated_at timestamptz not null default now(),
  constraint singleton_id check ((kind not in ('profile','site_settings')) or id = kind)
);
create table if not exists public.content_publications (
  id text primary key references public.content_entries(id) on delete cascade,
  kind text not null,
  position integer not null,
  payload jsonb not null,
  published_at timestamptz not null default now()
);
create index if not exists content_entries_kind_position on public.content_entries(kind,position);
create index if not exists content_publications_kind_position on public.content_publications(kind,position);
create table if not exists public.portfolio_media (
  id uuid primary key,
  name text not null,
  mime text not null,
  size bigint not null check (size > 0),
  private_path text not null unique,
  public_path text unique,
  created_at timestamptz not null default now()
);
create table if not exists public.mockup_designs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.content_entries(id) on delete cascade,
  design jsonb not null,
  updated_at timestamptz not null default now()
);
create or replace function public.portfolio_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end $$;
drop trigger if exists touch_content_entries on public.content_entries;
create trigger touch_content_entries before update on public.content_entries for each row execute function public.portfolio_touch();
drop trigger if exists touch_mockup_designs on public.mockup_designs;
create trigger touch_mockup_designs before update on public.mockup_designs for each row execute function public.portfolio_touch();

alter table public.content_entries enable row level security;
alter table public.content_publications enable row level security;
alter table public.portfolio_media enable row level security;
alter table public.mockup_designs enable row level security;
drop policy if exists "admin entries" on public.content_entries;
create policy "admin entries" on public.content_entries for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
drop policy if exists "published read" on public.content_publications;
create policy "published read" on public.content_publications for select to anon, authenticated using (true);
drop policy if exists "admin publications" on public.content_publications;
create policy "admin publications" on public.content_publications for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
drop policy if exists "admin media" on public.portfolio_media;
create policy "admin media" on public.portfolio_media for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
drop policy if exists "published media metadata" on public.portfolio_media;
create policy "published media metadata" on public.portfolio_media for select to anon, authenticated using (
  public_path is not null and exists (select 1 from public.content_publications p where p.payload::text like ('%media:' || portfolio_media.id::text || '%'))
);
drop policy if exists "admin designs" on public.mockup_designs;
create policy "admin designs" on public.mockup_designs for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
grant select,insert,update,delete on public.content_entries,public.content_publications,public.portfolio_media,public.mockup_designs to authenticated;
grant select on public.content_publications,public.portfolio_media to anon;
grant all on public.portfolio_admins,public.content_entries,public.content_publications,public.portfolio_media,public.mockup_designs to service_role;

-- Publication snapshots are copied atomically; optimistic concurrency prevents publishing an unseen revision.
create or replace function public.publish_portfolio_entry(target_id text, expected_updated_at timestamptz) returns void
language plpgsql security invoker set search_path = '' as $$
declare e public.content_entries;
begin
  if not public.is_portfolio_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  select * into e from public.content_entries where id = target_id for update;
  if e.id is null then raise exception 'Not found'; end if;
  if e.updated_at <> expected_updated_at then raise exception 'Content changed; reload first' using errcode = '40001'; end if;
  insert into public.content_publications(id,kind,position,payload,published_at) values(e.id,e.kind,e.position,e.draft,clock_timestamp())
  on conflict(id) do update set kind=excluded.kind,position=excluded.position,payload=excluded.payload,published_at=excluded.published_at;
end $$;
revoke all on function public.publish_portfolio_entry(text,timestamptz) from public;
grant execute on function public.publish_portfolio_entry(text,timestamptz) to authenticated;

create or replace function public.reorder_portfolio_entries(entry_ids text[], entry_kind text, publish_order boolean default false) returns void
language plpgsql security invoker set search_path = '' as $$
declare item text; n integer := 0;
begin
  if not public.is_portfolio_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  if cardinality(entry_ids) <> (select count(*) from public.content_entries where kind=entry_kind)
     or cardinality(entry_ids) <> (select count(distinct v) from unnest(entry_ids) v)
     or exists(select 1 from unnest(entry_ids) v where not exists(select 1 from public.content_entries where id=v and kind=entry_kind))
  then raise exception 'List changed; reload first'; end if;
  foreach item in array entry_ids loop
    update public.content_entries set position=n where id=item;
    if publish_order then update public.content_publications set position=n where id=item; end if;
    n := n + 1;
  end loop;
end $$;
revoke all on function public.reorder_portfolio_entries(text[],text,boolean) from public;
grant execute on function public.reorder_portfolio_entries(text[],text,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('portfolio-media','portfolio-media',false,20971520,array['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf']),
('portfolio-public','portfolio-public',true,20971520,array['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "portfolio admin files" on storage.objects;
create policy "portfolio admin files" on storage.objects for all to authenticated
using (bucket_id in ('portfolio-media','portfolio-public') and (select public.is_portfolio_admin()))
with check (bucket_id in ('portfolio-media','portfolio-public') and (select public.is_portfolio_admin()));
commit;
