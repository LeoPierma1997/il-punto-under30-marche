# Avamposto Under 30 – area riservata

Pagina: `avamposto/` del sito. Con `?demo=1` gira in **modalità prototipo** con dati di esempio salvati solo nel browser (codici di prova `AVAMPOST## Come funziona
- **Si entra con un codice, senza account.** Chi partecipa non dà nome, mail né dice se è tesserato: inserisce il codice d'ingresso e il telefono se lo ricorda. Il codice si può dare a chiunque giri intorno ad Azione (tesserati, simpatizzanti, curiosi).
- **Link con il codice**: `…/avamposto/?codice=XYZ` fa entrare con un tocco (comodo nei gruppi WhatsApp). In Gestione → Codici c'è «Copia link».
- **Iniziative** (corso, formazione, contenuti speciali, evento):
  - *Tutti quelli che entrano*: visibili con il codice d'ingresso;
  - *Solo con il codice del corso*: si sbloccano con un secondo codice che lo staff dà a chi partecipa. Il codice del corso fa entrare anche da solo.
- **Cambiare un codice**: se gira dove non deve, disattivalo e creane uno nuovo. Chi aveva il vecchio dovrà inserire quello nuovo.
- **Materiali**: video (YouTube anche non in elenco, Vimeo, Google Drive), dirette Meet con data e ora (il pulsante compare 15 minuti prima), PDF fino a 50 MB, testi, link. I PDF nuovi hanno un indirizzo impossibile da indovinare che il database consegna solo a chi ha il codice giusto.
- **«Visto»**: resta sul telefono di chi lo segna; allo staff arriva solo il numero complessivo.
- **La squadra**: organigramma con persone, ruoli, foto e canali WhatsApp, visibile solo a chi entra con il codice. Si modifica da Gestione → La squadra. I nomi reali si caricano con il file SQL riservato consegnato a parte (non è in questo repository).
- **Eventi** (pagina pubblica `eventi/`): elenco con locandine, calendario, scheda di ogni evento, filtri per tipo e zona.
- **Agenda e «Ci sono»**: per gli eventi «Serve una mano» si vedono turni, ritrovo e kit. «Ci sono» non chiede il nome: aumenta il contatore del turno e mostra il **link al gruppo WhatsApp dell'evento**, dove ci si organizza. Lo staff vede quanti sono per turno; la pagina pubblica solo il totale.
- **Repliche**: le registrazioni delle dirette, visibili solo nell'Avamposto.
- **La tua voce**: si manda un testo senza account, con firma facoltativa scritta a mano. Lo staff lo approva in Gestione → Voci. Chi l'ha mandato ne vede lo stato e può ritirarlo dallo stesso telefono.
- **Il tuo telefono**: mostra i codici salvati e permette di cancellare tutto.
- **Gestione** (solo staff, che entra con la mail da «Sei dello staff?»): Codici, Numeri (contatori anonimi: ingressi, visite, corsi aperti, «visto», «Ci sono»), iniziative e materiali, eventi, squadra, Voci.

La protezione è sul server: materiali, squadra, turni e repliche li consegnano funzioni del database solo a chi presenta un codice attivo; gli account possono crearli solo le mail dello staff (`public.admins`).

ati, di approvarsi da soli e di diventare amministratori.

## Messa in funzione (una volta)
1. **Supabase**: crea un account su supabase.com e un progetto nella regione **Europe (Frankfurt)** con il piano Free.
2. **Database**: SQL Editor → New query → incolla tutto `supabase/schema.sql` → Run. (Se il database esiste già dalla versione con gli account: esegui `supabase/aggiornamento-codici.sql` e poi, una volta, `supabase/pulizia-account.sql`.)
3. **Amministratore**: nello stesso editor esegui, con la mail condivisa dello staff:
   `insert into public.admins (email) values (lower('mail-staff@esempio.it'));`
4. **Indirizzi consentiti**: Authentication → URL Configuration →
   - Site URL: `https://leopierma1997.github.io/il-punto-under30-marche/avamposto/`
   - Redirect URLs: `https://leopierma1997.github.io/il-punto-under30-marche/avamposto/**`
5. **Mail di accesso dello staff**: SMTP di Gmail con password per le app in Authentication → Emails → SMTP Settings; modelli italiani in `supabase/mail-2-link-di-accesso.html`.
6. **Codice d'ingresso**: entra come staff, Gestione → Codici → crea il codice d'ingresso (e quelli dei corsi riservati).
7. **Collegamento**: Project Settings → API → copia *Project URL* e *anon / publishable key* in `avamposto/config.js`.
8. **Privacy**: il titolare è Azione. Quando il partito ti manda sede legale, codice fiscale e mail del DPO, scrivili in `sito-config.js` (sezione `privacy`): l'informativa si aggiorna da sola. Lo schema programma ogni lunedì la pulizia automatica (account fermi da 24 mesi, vecchie adesioni ai turni dopo 12 mesi, contatori anonimi dopo 24 mesi). Se Supabase segnala che manca `pg_cron`, attiva *Integrations → Cron* e riesegui l'ultimo blocco «Privacy» di `schema.sql`.

## Note
- I progetti Supabase gratuiti vanno in pausa dopo 7 giorni senza attività: l'attività quotidiana della rassegna può tenerlo sveglio.
- La mail amministratore è condivisa: proteggila con la verifica in due passaggi, perché chi legge quella casella entra in Gestione.
