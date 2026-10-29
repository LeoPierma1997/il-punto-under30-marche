# Il Punto Under 30 - Marche

Rassegna stampa politica quotidiana per staff e militanti di Azione Under 30 Marche: 5 notizie internazionali, 5 nazionali e 8 marchigiane, ciascuna con sintesi, link alla fonte e uno spunto di riflessione per i contenuti social.

Il sito è statico e pubblicato con GitHub Pages.

## Struttura

- `index.html` – la pagina (grafica e logica di visualizzazione)
- `data/index.json` – elenco delle edizioni pubblicate, usato per l'archivio
- `data/AAAA-MM-GG.json` – una edizione per giorno
- `assets/logo.png` – logo Azione Under 30 Marche
- `ISTRUZIONI.md` – regole editoriali seguite per preparare ogni edizione

Ogni mattina viene aggiunto un nuovo file in `data/` e la sua voce in `data/index.json`. La pagina mostra l'edizione più recente; le precedenti restano nell'archivio.
