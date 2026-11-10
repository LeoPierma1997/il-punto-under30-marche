# Avamposto Under 30 – area riservata

Pagina: `avamposto/` del sito. Finché `avamposto/config.js` è vuoto, gira in **modalità prototipo** con dati di esempio salvati solo nel browser.

## Come funziona
- **Iscrizione libera** con nome, email, tesserato/simpatizzante e consenso privacy. Niente password: si entra con un link mandato per mail.
- **Iniziative** (corso, formazione, contenuti speciali, evento):
  - *Tutti gli iscritti*: visibile a chiunque sia iscritto all'Avamposto;
  - *Su richiesta*: visibile solo a chi è abilitato.
- **Tre modi per abilitare una persona** a un'iniziativa su richiesta:
  1. la persona clicca «Chiedi di partecipare» e lo staff approva in Gestione;
  2. lo staff incolla una o più email in «Aggiungi persone a mano» (vale anche per chi non si è ancora iscritto);
  3. lo staff manda il **link d'invito** dell'iniziativa: chi lo apre e si iscrive o entra ha subito accesso. Il link si può disattivare o rigenerare.
- **Materiali**: video (YouTube anche non in elenco, Vimeo, Google Drive), dirette Meet con data e ora (il pulsante compare 15 minuti prima), PDF fino a 50 MB, testi, link.
- **La squadra**: organigramma con persone, ruoli, foto e link ai canali WhatsApp, visibile solo agli iscritti. Si modifica da Gestione → La squadra. I nomi reali si caricano con il file SQL riservato consegnato a parte (non è in questo repository).
- **Eventi** (pagina pubblica `eventi/`): elenco con locandine, calendario mensile con la locandina dentro il giorno, scheda di ogni evento (aggiungi al calendario, condividi, apri in Maps), filtri per tipo e zona. Nella home compaiono i prossimi tre.
- **Agenda e mobilitazione** (nell'Avamposto): gli eventi segnati «Serve una mano» mostrano agli iscritti turni, punto di ritrovo, kit del volontario e il pulsante «Ci sono». Lo staff vede chi c'è per turno, copia l'elenco per WhatsApp o lo scarica. Nella pagina pubblica si vede solo quante persone hanno aderito, senza nomi.
- **Repliche**: le registrazioni delle dirette (YouTube anche non in elenco, Vimeo, Drive). La pagina Eventi mostra che esistono, ma si guardano solo dall'Avamposto.
- Tutto si gestisce da **Gestione → Eventi, mobilitazione e repliche**.
- **Gestione** (solo per la mail amministratore): richieste, iniziative, partecipanti, materiali, elenco iscritti con esportazione CSV.

La protezione è sul server: le regole del database (`supabase/schema.sql`) impediscono di leggere materiali e PDF di iniziative a cui non si è abilitati, di approvarsi da soli e di diventare amministratori.

## Messa in funzione (una volta)
1. **Supabase**: crea un account su supabase.com e un progetto nella regione **Europe (Frankfurt)** con il piano Free.
2. **Database**: SQL Editor → New query → incolla tutto `supabase/schema.sql` → Run.
3. **Amministratore**: nello stesso editor esegui, con la mail condivisa dello staff:
   `insert into public.admins (email) values (lower('mail-staff@esempio.it'));`
4. **Indirizzi consentiti**: Authentication → URL Configuration →
   - Site URL: `https://leopierma1997.github.io/il-punto-under30-marche/avamposto/`
   - Redirect URLs: `https://leopierma1997.github.io/il-punto-under30-marche/avamposto/**`
5. **Mail di accesso**: il servizio incluso manda pochissime mail all'ora. Collega un servizio di invio (per esempio Brevo, piano gratuito) in Authentication → Emails → SMTP Settings, e traduci in italiano il modello «Magic Link».
6. **Collegamento**: Project Settings → API → copia *Project URL* e *anon / publishable key* in `avamposto/config.js`.
7. **Privacy**: completa `avamposto/privacy.html` con il titolare del trattamento prima di aprire le iscrizioni.

## Note
- I progetti Supabase gratuiti vanno in pausa dopo 7 giorni senza attività: l'attività quotidiana della rassegna può tenerlo sveglio.
- La mail amministratore è condivisa: proteggila con la verifica in due passaggi, perché chi legge quella casella entra in Gestione.
