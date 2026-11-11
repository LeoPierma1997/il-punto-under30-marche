# Newsletter – collegare il modulo del sito al foglio Google

Il modulo «Iscriviti alla newsletter» della pagina d'ingresso manda la mail a un piccolo programma (Google Apps Script) che vive dentro il foglio della newsletter e la aggiunge in fondo, **solo se non è già presente**.

## Installazione (una volta, 5 minuti)
Fatela con l'account Google proprietario del foglio (azioneunder30marche@gmail.com).

1. Apri il foglio della newsletter.
2. Menu **Estensioni → Apps Script** (oppure vai su script.google.com → Nuovo progetto).
3. Cancella il contenuto del file `Codice.gs` che si apre e incolla tutto `newsletter/Codice.gs` di questo repository. Salva (icona del dischetto).
4. Se le mail stanno in una scheda diversa dalla prima, scrivi il suo nome tra le virgolette di `NOME_SCHEDA`.
5. In alto a destra: **Esegui il deployment → Nuovo deployment**.
   - Tipo (rotellina): **App web**
   - Descrizione: `Newsletter sito`
   - Esegui come: **Me**
   - Chi può accedere: **Chiunque**
6. **Esegui il deployment** e autorizza l'accesso quando Google lo chiede. Se compare «Google non ha verificato questa app», clicca **Avanzate → Vai a … (non sicuro)**: è normale per uno script personale.
7. Copia l'**URL dell'app web** (finisce con `/exec`) e mandalo a Claude, oppure incollalo in `sito-config.js` alla voce `newsletterUrl`.

Prova: aprendo quell'URL nel browser deve comparire `{"ok":true,"servizio":"newsletter Azione Under 30 Marche"}`.

## Se il foglio dice «Impossibile aprire il file in questo momento»
Succede quasi sempre per uno di questi motivi:
- **Più account Google nello stesso browser**: Apps Script si apre con l'account predefinito, non con quello del foglio. Apri una **finestra in incognito**, entra solo con azioneunder30marche@gmail.com e riprova.
- **Il file è un Excel caricato su Drive** (accanto al titolo compare «.XLSX»): fai **File → Salva come Fogli Google** e usa la nuova copia (cambia l'ID: aggiornalo in `ID_FOGLIO`).
- **Strada alternativa**, che non passa dal foglio: vai su **script.google.com** (sempre con l'account del gruppo) → **Nuovo progetto**, incolla `Codice.gs` e prosegui dal punto 5. Lo script trova il foglio da solo grazie a `ID_FOGLIO`.

## Come scrive nel foglio
- La mail va nella colonna la cui intestazione contiene «mail» (es. «Email», «E-mail», «Indirizzo mail»).
- Se ci sono colonne con «data» o «iscrizione», «fonte», «consenso», le compila (data, `sito`, `sì`).
- Il controllo dei duplicati guarda **tutto il foglio**, quindi anche le mail inserite a mano.

## Se modificate lo script
Dopo ogni modifica serve **Esegui il deployment → Gestisci deployment → modifica (matita) → Versione: Nuova versione → Esegui il deployment**. L'URL resta lo stesso.

## (Facoltativo) Brevo per l'invio della newsletter

Per ora la newsletter si manda a mano da Gmail, mettendo i destinatari in **Ccn** (mai in A o Cc, così nessuno vede le mail degli altri).
Lo script è già pronto per Brevo ma resta spento finché non si impostano le proprietà qui sotto.

Il foglio Google resta l'archivio delle iscrizioni; la newsletter si manda da **Brevo** (gratuito fino a 300 mail al giorno),
che gestisce disiscrizioni e statistiche. Mittente: azioneunder30marche@gmail.com (Brevo lo sostituisce con un suo indirizzo
tecnico perché è una mail @gmail.com; con un dominio vostro questo si risolve).

1. **Account**: brevo.com → registrati con azioneunder30marche@gmail.com, piano Free. Nei dati dell'organizzazione indica
   «Azione Under 30 Marche» e un indirizzo postale (Brevo lo mette in fondo alle mail, è obbligatorio).
2. **Mittente**: Impostazioni → Mittenti, domini e IP → Mittenti → aggiungi «Azione Under 30 Marche» <azioneunder30marche@gmail.com>
   e conferma con il codice che arriva nella casella.
3. **Lista**: Contatti → Liste → Crea lista «Newsletter Under 30 Marche». Annota il numero (ID) della lista.
4. **Chiave API**: Impostazioni → SMTP e API → API Keys → Genera una nuova chiave (nome «Sito»). Copiala senza condividerla.
5. **Collega lo script**: apri lo script della newsletter su script.google.com, sostituisci il codice con il nuovo `Codice.gs`
   e salva. Impostazioni progetto (ingranaggio) → Proprietà script → aggiungi:
   - `BREVO_API_KEY` = la chiave del punto 4
   - `BREVO_LIST_ID` = il numero della lista del punto 3
   Poi **Esegui il deployment → Gestisci deployment → modifica (matita) → Versione: Nuova versione → Esegui il deployment**
   (l'indirizzo dell'app resta lo stesso).
6. **Chi è già iscritto**: nello script scegli la funzione `sincronizzaTuttiConBrevo` e premi **Esegui**: carica su Brevo
   tutte le mail già nel foglio. Da quel momento ogni nuova iscrizione dal sito arriva anche su Brevo.
7. **Modello**: Campagne → Modelli → Nuovo modello → «Incolla il tuo codice» → incolla `modello-newsletter.html`.
   Per ogni invio: duplica il modello, cambia i testi tra [parentesi quadre], prova con «Invia un test», poi programma la campagna.
