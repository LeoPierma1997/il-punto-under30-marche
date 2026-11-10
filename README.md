# Il Punto Under 30 - Marche

Rassegna stampa politica quotidiana per staff e militanti di Azione Under 30 Marche: 5 notizie internazionali, 5 nazionali e 8 marchigiane, ciascuna con sintesi, link alla fonte e uno spunto di riflessione per i contenuti social.

Il sito è statico e pubblicato con GitHub Pages.

## Struttura

- `index.html` – pagina d'ingresso di Azione Under 30 Marche (sceglie tra rassegna e Avamposto)
- `rassegna/index.html` – la rassegna Il Punto
- `avamposto/` – l'area riservata (vedi AVAMPOSTO.md)
- `assets/foto/` – foto del gruppo per la pagina d'ingresso
- `newsletter/Codice.gs` – collegamento del modulo newsletter al foglio Google (vedi NEWSLETTER.md)
- `data/index.json` – elenco delle edizioni pubblicate, usato per l'archivio
- `data/AAAA-MM-GG.json` – una edizione per giorno
- `assets/logo.png` – logo Azione Under 30 Marche
- `ISTRUZIONI.md` – regole editoriali seguite per preparare ogni edizione

Ogni mattina viene aggiunto un nuovo file in `data/` e la sua voce in `data/index.json`. La pagina mostra l'edizione più recente; le precedenti restano nell'archivio.
