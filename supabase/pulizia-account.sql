-- =====================================================================
-- Pulizia dopo il passaggio ai codici d'accesso
-- Da eseguire UNA volta su Supabase > SQL Editor, DOPO aggiornamento-codici.sql.
--
-- Cancella gli account di prova dei ragazzi (profili, richieste di corso,
-- «visto», adesioni ai turni) e l'elenco del pre-lancio.
-- Restano solo gli account dello staff (le mail in public.admins).
-- Spariscono anche le Voci di prova scritte da quegli account.
-- =====================================================================

select public.erase_user(u.id)
from auth.users u
where lower(u.email) not in (select email from public.admins);

delete from public.prelaunch_list;

-- Controllo: deve restare solo lo staff
select email from auth.users order by email;
