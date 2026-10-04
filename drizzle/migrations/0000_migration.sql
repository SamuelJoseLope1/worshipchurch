
create type public.org_role as enum ('owner','admin','director','musician','operator','presenter','viewer');

create table public.profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
grant select, insert, update, delete on public.organization_members to authenticated;
grant all on public.organization_members to service_role;

create or replace function public.is_org_member(_org uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members where org_id=_org and user_id=_uid)
$$;

create or replace function public.has_org_role(_org uuid, _uid uuid, _roles public.org_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members where org_id=_org and user_id=_uid and role = any(_roles))
$$;

create or replace function public.handle_new_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members(org_id, user_id, role) values (new.id, new.created_by, 'owner');
  return new;
end $$;
create trigger on_org_created after insert on public.organizations for each row execute function public.handle_new_org();

alter table public.organizations enable row level security;
create policy "members read org" on public.organizations for select to authenticated using (public.is_org_member(id, auth.uid()) or created_by = auth.uid());
create policy "create org" on public.organizations for insert to authenticated with check (created_by = auth.uid());
create policy "admins update org" on public.organizations for update to authenticated using (public.has_org_role(id, auth.uid(), array['owner','admin']::public.org_role[]));
create policy "owner delete org" on public.organizations for delete to authenticated using (public.has_org_role(id, auth.uid(), array['owner']::public.org_role[]));

alter table public.organization_members enable row level security;
create policy "members read members" on public.organization_members for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy "admins add members" on public.organization_members for insert to authenticated with check (public.has_org_role(org_id, auth.uid(), array['owner','admin']::public.org_role[]));
create policy "admins update members" on public.organization_members for update to authenticated using (public.has_org_role(org_id, auth.uid(), array['owner','admin']::public.org_role[]));
create policy "admins remove members" on public.organization_members for delete to authenticated using (public.has_org_role(org_id, auth.uid(), array['owner','admin']::public.org_role[]));

-- generic org-scoped content tables
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  artist text, author text, album text,
  song_key text not null default 'C',
  bpm numeric not null default 120,
  time_signature text not null default '4/4',
  duration_sec numeric,
  description text,
  image_path text,
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  favorite boolean not null default false,
  lyrics text not null default '',
  arrangements jsonb not null default '[]',
  markers jsonb not null default '[]',
  cues jsonb not null default '[]',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stems (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  name text not null,
  stem_type text not null default 'Custom',
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  volume numeric not null default 0.8,
  pan numeric not null default 0,
  muted boolean not null default false,
  color text not null default 'cyan',
  sort_order int not null default 0,
  group_name text not null default 'Instruments',
  output text not null default 'main',
  created_at timestamptz not null default now()
);

create table public.setlists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  service_date timestamptz,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.setlist_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position int not null default 0,
  overrides jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.broadcast_destinations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  platform text not null,
  enabled boolean not null default true,
  account text,
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.org_presets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null,
  name text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  code text not null unique,
  name text not null,
  director_id uuid not null default auth.uid(),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['songs','stems','setlists','setlist_items','broadcast_destinations','org_presets','live_sessions'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_org_member(org_id, auth.uid()))', t);
    execute format('create policy "editors insert" on public.%I for insert to authenticated with check (public.has_org_role(org_id, auth.uid(), array[''owner'',''admin'',''director'',''musician'',''operator'',''presenter'']::public.org_role[]))', t);
    execute format('create policy "editors update" on public.%I for update to authenticated using (public.has_org_role(org_id, auth.uid(), array[''owner'',''admin'',''director'',''musician'',''operator'',''presenter'']::public.org_role[]))', t);
    execute format('create policy "managers delete" on public.%I for delete to authenticated using (public.has_org_role(org_id, auth.uid(), array[''owner'',''admin'',''director'']::public.org_role[]))', t);
  end loop;
end $$;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger songs_touch before update on public.songs for each row execute function public.touch_updated_at();
create trigger setlists_touch before update on public.setlists for each row execute function public.touch_updated_at();

create index on public.songs(org_id);
create index on public.stems(song_id);
create index on public.setlist_items(setlist_id);

-- storage policies: path = <org_id>/...
create policy "org members read media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "org members upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "org members update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "org members delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid()));
