-- =====================================================================
-- Avamposto Under 30 – database e regole di accesso (Supabase / Postgres)
--
-- Come si usa: Supabase > SQL Editor > New query > incolla tutto > Run.
-- Si può rieseguire: crea solo ciò che manca e aggiorna funzioni e regole.
--
-- Principio: è il server a decidere chi vede cosa (Row Level Security).
-- Una pagina modificata a mano non può ottenere materiali di un corso
-- a cui la persona non è iscritta.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------

-- Amministratori: chi entra con una di queste mail gestisce l'Avamposto.
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

-- Profilo di ogni iscritto (uno per account).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  membership  text check (membership in ('tesserato', 'simpatizzante')),
  privacy_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Iniziative: corsi, cicli di formazione, contenuti speciali.
create table if not exists public.initiatives (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title        text not null,
  summary      text,
  description  text,
  kind         text not null default 'corso' check (kind in ('corso', 'formazione', 'contenuti', 'evento')),
  access       text not null default 'su_richiesta' check (access in ('aperta', 'su_richiesta')),
  starts_on    date,
  published    boolean not null default true,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

-- Link d'invito: separati dalle iniziative perché solo gli amministratori li vedono.
create table if not exists public.invites (
  initiative_id uuid primary key references public.initiatives (id) on delete cascade,
  code          text not null unique default encode(gen_random_bytes(9), 'hex'),
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- Partecipazioni: chi è dentro a cosa. Si lega alla mail, così un
-- amministratore può abilitare una persona anche prima che si iscriva.
create table if not exists public.enrollments (
  initiative_id uuid not null references public.initiatives (id) on delete cascade,
  email         text not null check (email = lower(email)),
  status        text not null default 'richiesta' check (status in ('richiesta', 'attiva', 'rifiutata')),
  source        text not null default 'richiesta' check (source in ('richiesta', 'manuale', 'invito')),
  note          text,
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  primary key (initiative_id, email)
);

-- Materiali di ogni iniziativa.
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives (id) on delete cascade,
  kind          text not null check (kind in ('video', 'diretta', 'pdf', 'testo', 'link')),
  title         text not null,
  body          text,
  url           text,
  file_path     text,
  live_at       timestamptz,
  position      int not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists enrollments_email_idx on public.enrollments (email);
create index if not exists materials_initiative_idx on public.materials (initiative_id, position);

-- Ogni nuova iniziativa ha subito il suo link d'invito.
create or replace function public.create_invite_for_initiative()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.invites (initiative_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists initiatives_invite on public.initiatives;
create trigger initiatives_invite after insert on public.initiatives
  for each row execute function public.create_invite_for_initiative();

-- ---------------------------------------------------------------------
-- Funzioni di controllo
-- ---------------------------------------------------------------------

create or replace function public.current_email()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.email = public.current_email())
$$;

-- Vero se chi è collegato può vedere i materiali dell'iniziativa.
create or replace function public.has_access(p_initiative uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (
           select 1 from public.initiatives i
           where i.id = p_initiative and i.published and i.access = 'aperta'
             and auth.uid() is not null)
      or exists (
           select 1 from public.enrollments e
           join public.initiatives i on i.id = e.initiative_id and i.published
           where e.initiative_id = p_initiative
             and e.email = public.current_email()
             and e.status = 'attiva')
$$;

-- Profilo creato in automatico alla prima iscrizione, con i dati del modulo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, membership, privacy_at)
  values (
    new.id,
    lower(new.email),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    case when new.raw_user_meta_data ->> 'membership' in ('tesserato', 'simpatizzante')
         then new.raw_user_meta_data ->> 'membership' end,
    case when (new.raw_user_meta_data ->> 'privacy') = 'true' then now() end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usa un link d'invito: abilita subito chi è collegato all'iniziativa.
create or replace function public.redeem_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_init public.initiatives;
begin
  if auth.uid() is null then raise exception 'Devi entrare nell''Avamposto per usare un invito'; end if;
  select i.* into v_init
  from public.invites v join public.initiatives i on i.id = v.initiative_id
  where v.code = p_code and v.active and i.published;
  if not found then raise exception 'Invito non valido o disattivato'; end if;
  insert into public.enrollments (initiative_id, email, status, source, decided_at)
  values (v_init.id, public.current_email(), 'attiva', 'invito', now())
  on conflict (initiative_id, email) do update
    set status = 'attiva', source = 'invito', decided_at = now();
  return v_init.slug;
end $$;

-- Nuovo codice d'invito (il vecchio link smette di funzionare).
create or replace function public.regenerate_invite(p_initiative uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text := encode(gen_random_bytes(9), 'hex');
begin
  if not public.is_admin() then raise exception 'Solo gli amministratori'; end if;
  insert into public.invites (initiative_id, code, active, updated_at)
  values (p_initiative, v_code, true, now())
  on conflict (initiative_id) do update set code = v_code, updated_at = now();
  return v_code;
end $$;

-- ---------------------------------------------------------------------
-- Regole di accesso (Row Level Security)
-- ---------------------------------------------------------------------

alter table public.admins      enable row level security;
alter table public.profiles    enable row level security;
alter table public.initiatives enable row level security;
alter table public.invites     enable row level security;
alter table public.enrollments enable row level security;
alter table public.materials   enable row level security;

-- admins: ognuno può solo verificare se stesso.
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select to authenticated
  using (email = public.current_email() or public.is_admin());

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid() and email = public.current_email());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_admin());

-- initiatives: il catalogo pubblicato è visibile a tutti, anche prima di entrare.
drop policy if exists initiatives_read on public.initiatives;
create policy initiatives_read on public.initiatives for select to anon, authenticated
  using (published or public.is_admin());
drop policy if exists initiatives_admin on public.initiatives;
create policy initiatives_admin on public.initiatives for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- invites: solo amministratori.
drop policy if exists invites_admin on public.invites;
create policy invites_admin on public.invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- enrollments: ognuno vede le proprie e può solo chiedere di partecipare;
-- approvare, rifiutare, aggiungere o togliere spetta agli amministratori.
drop policy if exists enrollments_read on public.enrollments;
create policy enrollments_read on public.enrollments for select to authenticated
  using (email = public.current_email() or public.is_admin());
drop policy if exists enrollments_request on public.enrollments;
create policy enrollments_request on public.enrollments for insert to authenticated
  with check (
    public.is_admin()
    or (email = public.current_email() and status = 'richiesta' and source = 'richiesta'
        and exists (select 1 from public.initiatives i where i.id = initiative_id and i.published))
  );
drop policy if exists enrollments_admin_update on public.enrollments;
create policy enrollments_admin_update on public.enrollments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists enrollments_delete on public.enrollments;
create policy enrollments_delete on public.enrollments for delete to authenticated
  using (public.is_admin() or (email = public.current_email() and status = 'richiesta'));

-- materials: visibili solo a chi ha accesso all'iniziativa.
drop policy if exists materials_read on public.materials;
create policy materials_read on public.materials for select to authenticated
  using (public.is_admin() or (published and public.has_access(initiative_id)));
drop policy if exists materials_admin on public.materials;
create policy materials_admin on public.materials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Permessi di base
grant usage on schema public to anon, authenticated;
grant select on public.initiatives to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.redeem_invite(text), public.regenerate_invite(uuid),
  public.is_admin(), public.has_access(uuid), public.current_email() to authenticated;

-- ---------------------------------------------------------------------
-- Archivio file (PDF): cartella privata "materiali", una sottocartella per iniziativa
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('materiali', 'materiali', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists materiali_read on storage.objects;
create policy materiali_read on storage.objects for select to authenticated
  using (bucket_id = 'materiali'
         and (public.is_admin()
              or public.has_access(nullif((storage.foldername(name))[1], '')::uuid)));
drop policy if exists materiali_admin_insert on storage.objects;
create policy materiali_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'materiali' and public.is_admin());
drop policy if exists materiali_admin_update on storage.objects;
create policy materiali_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'materiali' and public.is_admin());
drop policy if exists materiali_admin_delete on storage.objects;
create policy materiali_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'materiali' and public.is_admin());

-- ---------------------------------------------------------------------
-- Copertine delle iniziative (cartella pubblica: le vede anche il catalogo)
-- ---------------------------------------------------------------------

alter table public.initiatives add column if not exists cover_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('copertine', 'copertine', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists copertine_admin_insert on storage.objects;
create policy copertine_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'copertine' and public.is_admin());
drop policy if exists copertine_admin_update on storage.objects;
create policy copertine_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'copertine' and public.is_admin());
drop policy if exists copertine_admin_delete on storage.objects;
create policy copertine_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'copertine' and public.is_admin());

-- ---------------------------------------------------------------------
-- Materiali visti: ognuno segna i propri, nessun altro li vede
-- ---------------------------------------------------------------------

create table if not exists public.material_views (
  user_id     uuid not null references auth.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  primary key (user_id, material_id)
);
alter table public.material_views enable row level security;

drop policy if exists views_own_read on public.material_views;
create policy views_own_read on public.material_views for select to authenticated
  using (user_id = auth.uid());
drop policy if exists views_own_insert on public.material_views;
create policy views_own_insert on public.material_views for insert to authenticated
  with check (user_id = auth.uid()
              and exists (select 1 from public.materials m
                          where m.id = material_id and public.has_access(m.initiative_id)));
drop policy if exists views_own_delete on public.material_views;
create policy views_own_delete on public.material_views for delete to authenticated
  using (user_id = auth.uid());
grant select, insert, delete on public.material_views to authenticated;

-- ---------------------------------------------------------------------
-- La squadra: organigramma riservato agli iscritti all'Avamposto
-- ---------------------------------------------------------------------

create table if not exists public.org_units (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid references public.org_units (id) on delete set null,
  name         text not null,
  kind         text not null default 'gruppo' check (kind in ('coordinamento', 'area', 'gruppo', 'provincia')),
  description  text,
  whatsapp_url text check (whatsapp_url is null or whatsapp_url ~ '^https://(chat\.whatsapp\.com|(www\.)?whatsapp\.com/channel|wa\.me)/'),
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.org_people (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references public.org_units (id) on delete cascade,
  full_name  text not null,
  role       text,
  instagram  text,
  photo_path text,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.org_units  enable row level security;
alter table public.org_people enable row level security;

-- Solo chi è entrato nell'Avamposto vede la squadra e i link ai canali WhatsApp
drop policy if exists org_units_read on public.org_units;
create policy org_units_read on public.org_units for select to authenticated using (auth.uid() is not null);
drop policy if exists org_units_admin on public.org_units;
create policy org_units_admin on public.org_units for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists org_people_read on public.org_people;
create policy org_people_read on public.org_people for select to authenticated using (auth.uid() is not null);
drop policy if exists org_people_admin on public.org_people;
create policy org_people_admin on public.org_people for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.org_units, public.org_people to authenticated;

-- Foto della squadra: cartella privata, visibile solo agli iscritti
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('squadra', 'squadra', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
drop policy if exists squadra_read on storage.objects;
create policy squadra_read on storage.objects for select to authenticated
  using (bucket_id = 'squadra' and auth.uid() is not null);
drop policy if exists squadra_admin_insert on storage.objects;
create policy squadra_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'squadra' and public.is_admin());
drop policy if exists squadra_admin_update on storage.objects;
create policy squadra_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'squadra' and public.is_admin());
drop policy if exists squadra_admin_delete on storage.objects;
create policy squadra_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'squadra' and public.is_admin());

-- ---------------------------------------------------------------------
-- Ultimo passo (una volta sola): la mail condivisa dello staff diventa amministratore.
-- Sostituisci l'indirizzo e togli i due trattini iniziali prima di eseguire.
-- ---------------------------------------------------------------------
-- insert into public.admins (email) values (lower('mail-condivisa@esempio.it')) on conflict do nothing;
