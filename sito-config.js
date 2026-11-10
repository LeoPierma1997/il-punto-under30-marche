// Impostazioni della pagina d'ingresso.
// newsletterUrl: indirizzo della "App web" Google Apps Script collegata al foglio della newsletter
// (vedi NEWSLETTER.md). Finché è vuoto, il modulo avvisa che l'iscrizione non è ancora attiva.
window.SITO_CONFIG = {
  newsletterUrl: "https://script.google.com/macros/s/AKfycbwqoPIAtXw17V61-Nc-XJb3YiuMIuKPmQciscIIaNb4y56894R4WfIBpAIX4XWsZrB9pw/exec",
  email: "azioneunder30marche@gmail.com",
  instagram: "https://www.instagram.com/azioneunder30marche/",
  discord: "https://discord.gg/SZbnaCjrV",
  video: "https://www.instagram.com/reel/DXPXZmQjT95/",
  tesseramento: "https://noi.azione.it/primo-tesseramento/",
  // Informativa privacy: il titolare è Azione. Compila questi campi con i dati che ti dà il partito
  // (sede legale, codice fiscale, email del Responsabile della protezione dei dati). Finché sono vuoti,
  // l'informativa rimanda alla privacy policy di azione.it, dove quei dati sono pubblicati.
  privacy: {
    titolare: "Azione",
    sede: "",
    codiceFiscale: "",
    dpoEmail: "",
    aggiornata: "10 novembre 2026"
  }
};
