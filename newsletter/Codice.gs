/**
 * Newsletter Azione Under 30 Marche – riceve le iscrizioni dal sito e le aggiunge al foglio Google.
 *
 * Si installa da script.google.com (Nuovo progetto) oppure dal foglio con Estensioni > Apps Script:
 * incolla questo file, salva, poi Esegui il deployment > Nuovo deployment > App web (vedi NEWSLETTER.md).
 *
 * Cosa fa:
 * - accetta solo email valide e con il consenso spuntato;
 * - NON aggiunge una mail se è già presente in qualsiasi cella del foglio (maiuscole e spazi non contano);
 * - scrive la mail nella colonna la cui intestazione contiene "mail"; se esistono colonne
 *   "data"/"iscrizione", "fonte", "consenso" le compila, le altre restano vuote;
 * - se il foglio è vuoto crea le intestazioni: Email | Data iscrizione | Fonte | Consenso;
 * - se è collegato Brevo, aggiunge la mail anche alla lista della newsletter su Brevo.
 *
 * Collegare Brevo (una volta): in Apps Script, Impostazioni progetto (ingranaggio) > Proprietà script >
 * aggiungi BREVO_API_KEY (la chiave API di Brevo) e BREVO_LIST_ID (il numero della lista).
 * Poi esegui una volta la funzione sincronizzaTuttiConBrevo per caricare chi è già nel foglio.
 * La chiave resta nelle proprietà dello script: non scriverla mai in questo file.
 */

// Codice del foglio della newsletter (la parte dell'indirizzo tra /d/ e /edit).
// Così lo script funziona sia aperto dal foglio sia creato a parte su script.google.com.
var ID_FOGLIO = "1uJL3ZzBKbPhN3CSlAAG-gYsAlBU9xyV08TNRIkZxiAo";

// Nome della scheda (in basso nel foglio) dove salvare. Vuoto = la prima scheda.
var NOME_SCHEDA = "";

function doPost(e) {
  var dati;
  try {
    dati = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return risposta_({ ok: false, error: "formato" });
  }
  var email = String(dati.email || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return risposta_({ ok: false, error: "email" });
  if (dati.consenso !== true) return risposta_({ ok: false, error: "consenso" });
  var fonte = String(dati.fonte || "sito").slice(0, 40);

  var lock = LockService.getScriptLock();
  lock.waitLock(15000); // due iscrizioni nello stesso istante non creano doppioni
  try {
    var ss = ID_FOGLIO ? SpreadsheetApp.openById(ID_FOGLIO) : SpreadsheetApp.getActiveSpreadsheet();
    var sh = NOME_SCHEDA ? ss.getSheetByName(NOME_SCHEDA) : ss.getSheets()[0];
    if (!sh) return risposta_({ ok: false, error: "scheda" });

    if (sh.getLastRow() === 0) {
      sh.appendRow(["Email", "Data iscrizione", "Fonte", "Consenso"]);
      sh.setFrozenRows(1);
    }

    // Controllo duplicati su tutto il foglio
    var valori = sh.getDataRange().getDisplayValues();
    for (var r = 0; r < valori.length; r++) {
      for (var c = 0; c < valori[r].length; c++) {
        if (String(valori[r][c]).trim().toLowerCase() === email) { aggiungiABrevo_([email]); return risposta_({ ok: true, duplicate: true }); }
      }
    }

    // Riga costruita sulle intestazioni esistenti
    var intestazioni = valori[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var riga = intestazioni.map(function () { return ""; });
    var colEmail = -1;
    intestazioni.forEach(function (h, i) {
      if (colEmail < 0 && h.indexOf("mail") >= 0) { colEmail = i; riga[i] = email; }
      else if (/data|iscri|timestamp|quando/.test(h)) riga[i] = new Date();
      else if (/fonte|origine|provenienza/.test(h)) riga[i] = fonte;
      else if (/consenso|privacy/.test(h)) riga[i] = "sì";
    });
    if (colEmail < 0) riga = [email, new Date(), fonte, "sì"]; // nessuna colonna "email": scrive in testa

    sh.appendRow(riga);
    aggiungiABrevo_([email]);
    return risposta_({ ok: true, duplicate: false });
  } finally {
    lock.releaseLock();
  }
}

// ---- Brevo -------------------------------------------------------------------------------

// Aggiunge (o aggiorna) le mail nella lista Brevo. Se Brevo non è collegato o risponde con un errore,
// l'iscrizione resta comunque salvata nel foglio.
function aggiungiABrevo_(emails) {
  var pr = PropertiesService.getScriptProperties();
  var key = pr.getProperty("BREVO_API_KEY"), lista = Number(pr.getProperty("BREVO_LIST_ID"));
  if (!key || !lista || !emails.length) return false;
  try {
    var r;
    if (emails.length === 1) {
      r = UrlFetchApp.fetch("https://api.brevo.com/v3/contacts", {
        method: "post", contentType: "application/json", muteHttpExceptions: true,
        headers: { "api-key": key, accept: "application/json" },
        payload: JSON.stringify({ email: emails[0], listIds: [lista], updateEnabled: true })
      });
    } else {
      r = UrlFetchApp.fetch("https://api.brevo.com/v3/contacts/import", {
        method: "post", contentType: "application/json", muteHttpExceptions: true,
        headers: { "api-key": key, accept: "application/json" },
        payload: JSON.stringify({ listIds: [lista], updateExistingContacts: true, emptyContactsAttributes: false,
          jsonBody: emails.map(function (m) { return { email: m }; }) })
      });
    }
    var ok = r.getResponseCode() < 300;
    if (!ok) console.warn("Brevo ha risposto " + r.getResponseCode() + ": " + r.getContentText());
    return ok;
  } catch (err) {
    console.warn("Brevo non raggiungibile: " + err);
    return false;
  }
}

// Da eseguire a mano una volta (menu Esegui): carica su Brevo tutte le mail già presenti nel foglio.
function sincronizzaTuttiConBrevo() {
  var ss = ID_FOGLIO ? SpreadsheetApp.openById(ID_FOGLIO) : SpreadsheetApp.getActiveSpreadsheet();
  var sh = NOME_SCHEDA ? ss.getSheetByName(NOME_SCHEDA) : ss.getSheets()[0];
  var visti = {}, emails = [];
  sh.getDataRange().getDisplayValues().forEach(function (riga) {
    riga.forEach(function (v) {
      var m = String(v).trim().toLowerCase();
      if (/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(m) && !visti[m]) { visti[m] = true; emails.push(m); }
    });
  });
  if (!emails.length) { console.log("Nessuna mail nel foglio."); return; }
  var ok = aggiungiABrevo_(emails);
  console.log(ok ? emails.length + " mail inviate a Brevo (l'importazione richiede qualche minuto)." : "Importazione non riuscita: controlla BREVO_API_KEY e BREVO_LIST_ID.");
}

// Aprendo l'indirizzo dell'app nel browser si vede questo messaggio: serve solo a verificare che sia attiva.
function doGet() {
  return risposta_({ ok: true, servizio: "newsletter Azione Under 30 Marche" });
}

function risposta_(oggetto) {
  return ContentService.createTextOutput(JSON.stringify(oggetto)).setMimeType(ContentService.MimeType.JSON);
}
