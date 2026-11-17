# Come si fanno i reel di Azione Under 30 Marche

Strumenti usati per il reel di lancio del sito. Servono anche per i reel interattivi.

- `modello-reel.html`: il reel vero e proprio, una pagina 1080×1920 che si disegna con `window.render(t)` (t = secondi). Le scene sono a battute: `B = 60 / BPM`, `BAR = 4 * B`, `at(battuta, battito)`. Ci sono già: scritta a macchina, parole che cadono come massi con polvere e tremolio, frasi a colpi su sfondi alternati, telefono con schermata che scorre, parole «timbro» a tutto schermo, coriandoli, chiusura con logo.
- `render.js`: con Playwright fotografa un fotogramma alla volta (30 al secondo) in `frames2/`. Poi:
  `ffmpeg -framerate 30 -i frames2/f%04d.jpg -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -an -movflags +faststart reel.mp4`
- Cartelle che il modello si aspetta accanto a sé (non sono nel repository, si rigenerano):
  - `fonts/` = copia di `assets/fonts/`; `logo.png` = `assets/logo.png`;
  - `vid/f0001.jpg…` = fotogrammi di `assets/video/apertura.mp4`: `ffmpeg -i assets/video/apertura.mp4 -vf scale=1080:1920 -q:v 3 vid/f%04d.jpg`;
  - `cap/*.png` = schermate del sito in formato telefono (390 px, densità 2).
- Si serve la cartella con `python3 -m http.server 8766` e si lancia `node render.js` (oppure `node render.js 1.5,3,4.2` per provare solo alcuni secondi).

Regole di stile: blu `#312781`, blu notte `#0C1467`, bianco, giallo `#FCCA00` (poco); niente arancione né verde; carattere Montserrat (al posto di Gotham), lettere ravvicinate; testi naturali. I video si consegnano **senza audio**: la musica si sceglie su Instagram.
