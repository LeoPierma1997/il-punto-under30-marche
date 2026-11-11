-- =====================================================================
-- Avamposto con CODICE D'ACCESSO, senza account per i ragazzi
-- Da eseguire una volta su Supabase > SQL Editor (anche più volte non fa danni).
--
-- Cosa cambia:
-- - chi entra nell'Avamposto non si iscrive: usa un codice dato dallo staff
--   (uno d'ingresso per tutti, eventuali codici per singoli corsi);
-- - il database consegna materiali, squadra, mobilitazione e repliche
--   solo a chi presenta un codice valido;
-- - niente nomi né mail dei ragazzi: solo contatori anonimi;
-- - le Voci Under 30 si inviano senza account, con firma facoltativa;
-- - gli account restano solo per lo staff (chi è in public.admins).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Codici
-- ---------------------------------------------------------------------
create table if not exists public.access_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code = upper(code) and code ~ '^[A-Z0-9-]{4,40}$'),
  kind          text not null default 'ingresso' check (kind in ('ingresso', 'corso')),
  initiative_id uuid references public.initiatives (id) on delete cascade,
  label         text check (label is null or char_length(label) <= 80),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  check (kind = 'ingresso' or initiative_id is not null)
);
alter table public.access_codes enable row level security;
drop policy if exists codes_admin on public.access_codes;
create policy codes_admin on public.access_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.access_codes to authenticated;

-- Contatori anonimi (quante aperture, quanti «visto», quanti «ci sono»): nessun dato personale.
create table if not exists public.ava_counts (
  kind text not null check (kind in ('ingresso', 'apertura', 'visto', 'cisono')),
  ref  text not null,
  day  date not null default current_date,
  n    int  not null default 0,
  primary key (kind, ref, day)
);
alter table public.ava_counts enable row level security;
drop policy if exists counts_admin on public.ava_counts;
create policy counts_admin on public.ava_counts for select to authenticated using (public.is_admin());
grant select on public.ava_counts to authenticated;

-- Link al gruppo WhatsApp dell'evento, per chi dice «Ci sono»
alter table public.event_mobilization add column if not exists whatsapp_url text
  check (whatsapp_url is null or whatsapp_url ~ '^https://(chat\.whatsapp\.com|(www\.)?whatsapp\.com/channel|wa\.me)/');

-- Voci senza account: firma scritta liberamente (facoltativa)
alter table public.voices alter column user_id drop not null;
alter table public.voices add column if not exists signed_name text check (signed_name is null or char_length(signed_name) <= 60);

-- ---------------------------------------------------------------------
-- Controllo dei codici
-- ---------------------------------------------------------------------
create or replace function public.ava_pass(p_codes text[])
returns jsonb language sql stable security definer set search_path = public as $$
  with input as (
    select distinct upper(trim(x)) as code from unnest(coalesce(p_codes, '{}'::text[])) x limit 20
  ), ok as (
    select c.* from public.access_codes c join input i on i.code = c.code where c.active
  )
  select jsonb_build_object(
    'entry',   exists (select 1 from ok),
    'courses', coalesce((select jsonb_agg(distinct initiative_id) from ok where initiative_id is not null), '[]'::jsonb),
    'valid',   coalesce((select jsonb_agg(code) from ok), '[]'::jsonb)
  );
$$;

create or replace function public.ava_entry(p_codes text[])
returns boolean language sql stable security definer set search_path = public as $$
  select (public.ava_pass(p_codes) ->> 'entry')::boolean;
$$;

create or replace function public.ava_courses(p_codes text[])
returns uuid[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(x::uuid), '{}') from jsonb_array_elements_text(public.ava_pass(p_codes) -> 'courses') x;
$$;

-- ---------------------------------------------------------------------
-- Contenuti consegnati solo con codice valido
-- ---------------------------------------------------------------------
create or replace function public.ava_materials(p_codes text[])
returns setof public.materials language sql stable security definer set search_path = public as $$
  select m.* from public.materials m
  join public.initiatives i on i.id = m.initiative_id
  where public.ava_entry(p_codes) and m.published and i.published
    and (i.access = 'aperta' or i.id = any (public.ava_courses(p_codes)))
  order by m.initiative_id, m.position, m.created_at;
$$;

create or replace function public.ava_team(p_codes text[])
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.ava_entry(p_codes) then jsonb_build_object(
    'units',  coalesce((select jsonb_agg(to_jsonb(u) order by u.position) from public.org_units u), '[]'::jsonb),
    'people', coalesce((select jsonb_agg(to_jsonb(p) order by p.position) from public.org_people p), '[]'::jsonb)
  ) else jsonb_build_object('units', '[]'::jsonb, 'people', '[]'::jsonb) end;
$$;

create or replace function public.ava_mobilization(p_codes text[])
returns setof public.event_mobilization language sql stable security definer set search_path = public as $$
  select m.* from public.event_mobilization m join public.events e on e.id = m.event_id
  where public.ava_entry(p_codes) and e.published;
$$;

create or replace function public.ava_replays(p_codes text[])
returns setof public.event_replays language sql stable security definer set search_path = public as $$
  select r.* from public.event_replays r
  where public.ava_entry(p_codes) and r.published
  order by r.recorded_on desc, r.created_at desc;
$$;

-- Conta un'azione (senza sapere chi l'ha fatta)
create or replace function public.ava_hit(p_codes text[], p_kind text, p_ref text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.ava_entry(p_codes) then return; end if;
  if p_kind not in ('ingresso', 'apertura', 'visto', 'cisono') or char_length(coalesce(p_ref, '')) not between 1 and 120 then return; end if;
  insert into public.ava_counts (kind, ref, day, n) values (p_kind, p_ref, current_date, 1)
  on conflict (kind, ref, day) do update set n = public.ava_counts.n + 1;
end $$;

-- «Ci sono»: conta l'adesione al turno e restituisce il link al gruppo WhatsApp dell'evento
create or replace function public.ava_ci_sono(p_codes text[], p_event uuid, p_slot text)
returns text language plpgsql security definer set search_path = public as $$
declare v_wa text;
begin
  if not public.ava_entry(p_codes) then raise exception 'Codice non valido.'; end if;
  if not exists (select 1 from public.events where id = p_event and published and needs_hands) then raise exception 'Evento non trovato.'; end if;
  perform public.ava_hit(p_codes, 'cisono', p_event::text || '|' || left(coalesce(p_slot, ''), 60));
  select whatsapp_url into v_wa from public.event_mobilization where event_id = p_event;
  return v_wa;
end $$;

-- ---------------------------------------------------------------------
-- Voci Under 30 senza account
-- ---------------------------------------------------------------------
create or replace function public.ava_voice_submit(p_codes text[], p_kind text, p_title text, p_body text,
  p_topic text, p_link text, p_name text, p_city text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_name text := nullif(trim(coalesce(p_name, '')), '');
begin
  if not public.ava_entry(p_codes) then raise exception 'Serve il codice dell''Avamposto.'; end if;
  if (select count(*) from public.voices where status = 'pending') >= 200 then
    raise exception 'Troppi testi in attesa: riprova tra qualche giorno.';
  end if;
  insert into public.voices (user_id, kind, title, body, topic, link_url, signature, signed_name, author_name, city)
  values (null, coalesce(p_kind, 'riflessione'), nullif(trim(coalesce(p_title, '')), ''), trim(coalesce(p_body, '')),
          nullif(trim(coalesce(p_topic, '')), ''), nullif(trim(coalesce(p_link, '')), ''),
          case when v_name is null then 'anonimo' else 'completo' end, left(v_name, 60), left(v_name, 60),
          nullif(trim(coalesce(p_city, '')), ''))
  returning id into v_id;
  return v_id;
end $$;

-- Chi ha inviato un testo conserva sul proprio telefono il suo codice identificativo:
-- con quello (e solo con quello) può vederne lo stato o ritirarlo.
create or replace function public.ava_voice_status(p_ids uuid[])
returns table (id uuid, kind text, title text, body text, status text, staff_note text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select v.id, v.kind, v.title, left(v.body, 300), v.status, v.staff_note, v.created_at
  from public.voices v where v.id = any ((coalesce(p_ids, '{}'::uuid[]))[1:50]);
$$;

create or replace function public.ava_voice_withdraw(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.voices where id = p_id and user_id is null;
$$;

-- La firma scritta a mano vale come nome da mostrare
create or replace function public.public_voices(p_limit int default 60)
returns table (id uuid, kind text, title text, body text, topic text, link_url text, display_name text, city text, published_at timestamptz)
language sql stable security definer set search_path = public as $$
  select v.id, v.kind, v.title, v.body, v.topic, v.link_url,
    case
      when v.signed_name is not null then v.signed_name
      when v.signature = 'completo' then v.author_name
      when v.signature = 'nome' then split_part(trim(v.author_name), ' ', 1) ||
        case when position(' ' in trim(v.author_name)) > 0
          then ' ' || upper(left(split_part(trim(v.author_name), ' ', array_length(regexp_split_to_array(trim(v.author_name), '\s+'), 1)), 1)) || '.'
          else '' end
      else null end,
    v.city, v.published_at
  from public.voices v
  where v.status = 'approved'
  order by v.published_at desc
  limit least(greatest(coalesce(p_limit, 60), 1), 200);
$$;

-- Numero di «ci sono» per evento (pagina pubblica): adesioni anonime + eventuali vecchie adesioni
create or replace function public.signup_counts()
returns table (event_id uuid, n bigint)
language sql stable security definer set search_path = public as $$
  select x.event_id, sum(x.n)::bigint from (
    select s.event_id, count(*)::bigint as n from public.event_signups s group by s.event_id
    union all
    select split_part(c.ref, '|', 1)::uuid, sum(c.n)::bigint from public.ava_counts c where c.kind = 'cisono' group by 1
  ) x join public.events e on e.id = x.event_id and e.published
  group by x.event_id;
$$;

-- Permessi: le funzioni con codice sono aperte a tutti (il controllo è dentro)
do $$
declare f text;
begin
  foreach f in array array[
    'ava_pass(text[])', 'ava_entry(text[])', 'ava_courses(text[])', 'ava_materials(text[])', 'ava_team(text[])',
    'ava_mobilization(text[])', 'ava_replays(text[])', 'ava_hit(text[], text, text)', 'ava_ci_sono(text[], uuid, text)',
    'ava_voice_submit(text[], text, text, text, text, text, text, text)', 'ava_voice_status(uuid[])', 'ava_voice_withdraw(uuid)',
    'public_voices(int)', 'signup_counts()']
  loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- File pubblici con indirizzo impossibile da indovinare
-- (il percorso lo conosce solo chi riceve il materiale con un codice valido)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documenti', 'documenti', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('squadra-foto', 'squadra-foto', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
do $$
declare b text;
begin
  foreach b in array array['documenti', 'squadra-foto'] loop
    execute format('drop policy if exists %I on storage.objects', b || '_admin_insert');
    execute format('create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L and public.is_admin())', b || '_admin_insert', b);
    execute format('drop policy if exists %I on storage.objects', b || '_admin_update');
    execute format('create policy %I on storage.objects for update to authenticated using (bucket_id = %L and public.is_admin())', b || '_admin_update', b);
    execute format('drop policy if exists %I on storage.objects', b || '_admin_delete');
    execute format('create policy %I on storage.objects for delete to authenticated using (bucket_id = %L and public.is_admin())', b || '_admin_delete', b);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Account solo per lo staff
-- ---------------------------------------------------------------------
create or replace function public.prelaunch_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(new.email, '')) not in (select email from public.admins) then
    raise exception 'SOLO_STAFF: l''accesso con mail è riservato allo staff';
  end if;
  return new;
end $$;
drop trigger if exists prelaunch_gate on auth.users;
create trigger prelaunch_gate before insert on auth.users
  for each row execute function public.prelaunch_gate();

-- Pulizia automatica: anche i contatori anonimi più vecchi di 24 mesi
create or replace function public.purge_inactive_accounts()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in
    select u.id from auth.users u
    where coalesce(u.last_sign_in_at, u.created_at) < now() - interval '24 months'
      and lower(coalesce(u.email, '')) not in (select email from public.admins)
  loop
    perform public.erase_user(r.id); n := n + 1;
  end loop;
  delete from public.event_signups s using public.events e
  where e.id = s.event_id and coalesce(e.ends_at, e.starts_at) < now() - interval '12 months';
  delete from public.ava_counts where day < current_date - interval '24 months';
  return n;
end;
$$;
revoke all on function public.purge_inactive_accounts() from public, anon, authenticated;
