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
