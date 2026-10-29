# Istruzioni editoriali – Il Punto Under 30 - Marche

Queste regole valgono per ogni edizione quotidiana. Chi prepara la rassegna (persona o Claude) le segue alla lettera.

## Pubblico e scopo
- Lettori: staff e militanti di Azione Under 30 Marche, uso interno.
- Scopo: tenersi informati e preparare contenuti social.
- Pronta ogni mattina alle 8:00 (ora italiana).

## Selezione
- Esattamente **5 internazionali, 5 nazionali, 8 Marche**.
- Solo notizie politiche: geopolitica, politica estera, politica UE, politica italiana e regionale, con i temi collegati (sanità, pensioni, giovani, lavoro, fisco, energia, infrastrutture, legalità nella pubblica amministrazione).
- Esclusi: cronaca non collegata alla politica, sport, spettacolo, gossip.
- Ordine per rilevanza politica e peso delle conseguenze; come indicatori di attenzione pubblica: spazio in homepage, numero di testate che ne parlano, sezioni "più letti".
- Preferire notizie delle ultime 24-48 ore. Una notizia più vecchia entra solo se è il contesto necessario o un fatto ancora in corso, e la data va indicata.
- La prima notizia di ogni sezione è l'apertura.

## Fonti
- Solo articoli reali, effettivamente trovati e letti. Mai inventare fonti, titoli, date o citazioni. Il link deve portare all'articolo.
- Mix di riferimento:
  - Marche: ANSA Marche, Corriere Adriatico, Il Resto del Carlino (edizioni marchigiane), Cronache Maceratesi, Vivere Marche, Centropagina, AnconaToday, comunicati della Regione e del Consiglio regionale.
  - Nazionali: ANSA, Il Post, Corriere della Sera, la Repubblica, Il Sole 24 Ore, Avvenire, AGI, Il Foglio.
  - Internazionali: Reuters, BBC, Euronews, ANSA Mondo ed Europa, Eunews.
- Se un articolo è dietro paywall, usare solo ciò che si legge e, se possibile, una seconda fonte accessibile (campo `also`).

## Scrittura
- Sintesi originali, in italiano, 2-4 frasi, tono neutro e fattuale. Non copiare frasi degli articoli; eventuali citazioni brevissime (meno di 15 parole) e tra virgolette.
- Indicare sempre quando si tratta di accuse non ancora accertate.
- Titoli informativi, non sensazionalistici.

## Spunti di riflessione
- Uno per notizia: 1-3 frasi che aiutino a costruire un contenuto social dal punto di vista di Azione (liberale, centrista, riformista, europeista, Renew Europe).
- Le posizioni del partito vanno ricavate **solo da dichiarazioni recenti** (indicativamente ultimi 2-3 mesi) di Carlo Calenda e degli esponenti di Azione: interviste, dichiarazioni riportate da agenzie e giornali, post sui social ripresi dalla stampa.
- **Non citare i vecchi documenti del sito azione.it.**
- Ogni posizione attribuita ad Azione o a Calenda deve avere il link alla fonte nel campo `refs`, con etichetta "Chi, dove – testata, data".
- Se non esiste una dichiarazione recente sul tema, lo spunto è una domanda di riflessione senza attribuire posizioni al partito (`refs` vuoto).

## Immagini
- Nessuna foto o screenshot degli articoli, e nessuna foto di personaggi pubblici presa dal web.
- Ogni notizia ha un'icona tematica (campo `icon`) scelta da questo elenco: `globe`, `ballot`, `talks`, `scale`, `bolt`, `euro`, `hourglass`, `youth`, `megaphone`, `columns`, `helmet`, `mountain`, `health`, `factory`, `shield`.
  - globe: esteri generici, diplomazia · ballot: elezioni, legge elettorale · talks: negoziati, trattative · scale: giustizia, stato di diritto · bolt: energia · euro: bilancio, fisco, economia · hourglass: pensioni · youth: giovani, scuola, università · megaphone: proteste, sindacati, opposizioni · columns: istituzioni, Regione, Parlamento · helmet: lavoro, cantieri · mountain: entroterra, territorio · health: sanità · factory: industria, imprese · shield: sicurezza, legalità, difesa.

## Formato del file `data/AAAA-MM-GG.json`
```json
{
  "date": "AAAA-MM-GG",
  "label": "Giovedì 29 ottobre 2026",
  "intro": "Una o due frasi sui fatti principali del giorno.",
  "sections": [
    { "id": "internazionale", "title": "Internazionale", "items": [ ... 5 ... ] },
    { "id": "nazionale", "title": "Nazionale", "items": [ ... 5 ... ] },
    { "id": "marche", "title": "Marche", "items": [ ... 8 ... ] }
  ]
}
```
Ogni elemento di `items`:
```json
{
  "title": "Titolo",
  "summary": "Sintesi originale.",
  "source": "Nome testata",
  "url": "https://...",
  "also": [{ "source": "Altra testata", "url": "https://..." }],
  "published": "AAAA-MM-GG",
  "tags": ["Tema principale", "Tema secondario"],
  "icon": "euro",
  "spunto": { "text": "Spunto.", "refs": [{ "label": "Calenda a ... – Testata, data", "url": "https://..." }] }
}
```
Il primo tag compare nella fascia colorata della scheda: deve essere breve (1-2 parole).

## Audio
- L'audio MP3 dell'edizione viene generato in automatico da GitHub Actions (`.github/workflows/audio.yml`) dopo il push: aggiunge `audio/AAAA-MM-GG.mp3` e i campi `audio` e `audio_engine` al file dell'edizione.
- Chi prepara l'edizione non deve scrivere questi campi né toccare la cartella `audio/`.
- Voce: Microsoft "it-IT-DiegoNeural" (gratuita). Se nei Secrets del repository c'è `ELEVENLABS_API_KEY`, si usa ElevenLabs (voce in `ELEVENLABS_VOICE_ID` tra le Variables, facoltativa). Con la variabile `AUDIO_SPUNTI` = `1` l'audio legge anche gli spunti.

## Pubblicazione
1. Creare `data/AAAA-MM-GG.json` con la data di oggi.
2. Aggiungere in testa a `data/index.json` la voce `{"date": "AAAA-MM-GG", "label": "..."}`. Non cancellare le edizioni precedenti.
3. Verificare che il JSON sia valido e che ogni sezione abbia il numero giusto di notizie.
4. Commit e push su `main`.
