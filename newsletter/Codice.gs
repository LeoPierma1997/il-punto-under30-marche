/**
 * Newsletter Azione Under 30 Marche – riceve le iscrizioni dal sito e le aggiunge al foglio Google.
 *
 * Si installa DAL FOGLIO della newsletter: Estensioni > Apps Script, incolla questo file, salva,
 * poi Esegui il deployment > Nuovo deployment > App web (istruzioni complete in NEWSLETTER.md).
 *
 * Cosa fa:
 * - accetta solo email valide e con il consenso spuntato;
 * - NON aggiunge una mail se è già presente in qualsiasi cella del foglio (maiuscole e spazi non contano);
 * - scrive la mail nella colonna la cui intestazione contiene "mail"; se esistono colonne
 *   "data"/"iscrizione", "fonte", "consenso" le compila, le altre restano vuote;
 * - se il foglio è vuoto crea le intestazioni: Email | Data iscrizione | Fonte | Consenso.
 */

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
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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
        if (String(valori[r][c]).trim().toLowerCase() === email) return risposta_({ ok: true, duplicate: true });
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
    return risposta_({ ok: true, duplicate: false });
  } finally {
    lock.releaseLock();
  }
}

// Aprendo l'indirizzo dell'app nel browser si vede questo messaggio: serve solo a verificare che sia attiva.
function doGet() {
  return risposta_({ ok: true, servizio: "newsletter Azione Under 30 Marche" });
}

function risposta_(oggetto) {
  return ContentService.createTextOutput(JSON.stringify(oggetto)).setMimeType(ContentService.MimeType.JSON);
}
