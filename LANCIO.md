# Lancio del sito

Finché il sito non è lanciato si diffonde solo **Il Punto** (`rassegna/`):
- la rassegna non ha link verso home, Eventi, Social, Voci e Avamposto (menu ridotto a «Seguici su Instagram»);
- home, Eventi, Social e Avamposto non vengono indicizzate dai motori di ricerca (`noindex`),
  ma restano raggiungibili da chi ha il link (es. la pagina `presentazione/` per i referenti).

Le parti da cambiare sono segnate con `PRELANCIO` nel codice.

## Il giorno del lancio
1. In `rassegna/index.html`: ripristinare il menu (Il Punto, Eventi, Social, Avamposto, «Unisciti a noi»),
   il logo che porta alla home (`href="../"`) e i link nel piè di pagina.
2. In `avamposto/privacy.html`: logo verso la home e link in fondo (Home, Avamposto, Eventi).
3. Togliere `<meta name="robots" content="noindex">` da `index.html`, `eventi/`, `social/`, `voci/`, `avamposto/`.
4. Verificare che Supabase, mail di accesso e Instagram siano collegati.
