"""Raccoglie ogni mattina i candidati per la rassegna "Il Punto Under 30 - Marche".

Gira dentro GitHub Actions (vedi .github/workflows/raccogli-notizie.yml), che ha
accesso libero alla rete. Legge i feed RSS delle testate elencate in ISTRUZIONI.md,
tiene gli articoli delle ultime 48 ore, ne scarica il testo e scrive
bozze/AAAA-MM-GG.json. La routine che prepara l'edizione legge questo file dal
repository, così non dipende dall'accesso web della sessione.
"""
import datetime as dt
import email.utils
import html
import json
import pathlib
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
ORE = 48
MAX_PER_FEED = 12
MAX_TESTO = 2500

FEEDS = [
    ("internazionale", "ANSA Mondo", "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml"),
    ("internazionale", "ANSA Europa", ["https://www.ansa.it/europa/notizie/europa_rss.xml", "https://www.ansa.it/europa/notizie/rubriche/altrenews/altrenews_rss.xml", "https://www.ansa.it/europa/notizie/rubriche/politica/politica_rss.xml"]),
    ("internazionale", "Euronews", "https://it.euronews.com/rss?level=theme&name=news"),
    ("internazionale", "Eunews", "https://www.eunews.it/feed/"),
    ("nazionale", "ANSA Politica", "https://www.ansa.it/sito/notizie/politica/politica_rss.xml"),
    ("nazionale", "ANSA Economia", "https://www.ansa.it/sito/notizie/economia/economia_rss.xml"),
    ("nazionale", "Il Post", ["https://www.ilpost.it/politica/feed/", "https://www.ilpost.it/feed/", "https://www.ilpost.it/italia/feed/"]),
    ("nazionale", "Avvenire", ["https://www.avvenire.it/rss/politica", "https://www.avvenire.it/feed", "https://www.avvenire.it/rss/politica.xml", "https://www.avvenire.it/rss/attualita.xml"]),
    ("nazionale", "Il Foglio", ["https://www.ilfoglio.it/rss/politica", "https://www.ilfoglio.it/rss.xml", "https://www.ilfoglio.it/feed/", "https://www.ilfoglio.it/rss/politica.xml"]),
    ("marche", "ANSA Marche", "https://www.ansa.it/marche/notizie/marche_rss.xml"),
    ("marche", "Cronache Maceratesi", "https://www.cronachemaceratesi.it/feed/"),
    ("marche", "Vivere Marche", ["https://www.viveremarche.it/rss/", "https://www.viveremarche.it/rss.xml", "https://www.viveremarche.it/feed/rss/", "https://www.viveremarche.it/category/politica/feed/", "https://www.viveremarche.it/feed/"]),
    ("marche", "CentroPagina", "https://www.centropagina.it/feed/"),
    ("marche", "AnconaToday", "https://www.anconatoday.it/rss"),
    ("marche", "Corriere Adriatico", "https://www.corriereadriatico.it/rss/marche.xml"),
]


def scarica(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        enc = r.headers.get_content_charset() or "utf-8"
    return raw, enc


def pulisci(testo):
    testo = re.sub(r"(?is)<(script|style|noscript).*?</\1>", " ", testo or "")
    testo = re.sub(r"(?s)<[^>]+>", " ", testo)
    return re.sub(r"\s+", " ", html.unescape(testo)).strip()


def data_item(el):
    for tag in ("pubDate", "{http://purl.org/dc/elements/1.1/}date", "{http://www.w3.org/2005/Atom}published", "{http://www.w3.org/2005/Atom}updated"):
        t = el.findtext(tag)
        if not t:
            continue
        try:
            d = email.utils.parsedate_to_datetime(t)
        except (TypeError, ValueError):
            try:
                d = dt.datetime.fromisoformat(t.replace("Z", "+00:00"))
            except ValueError:
                continue
        if d.tzinfo is None:
            d = d.replace(tzinfo=dt.timezone.utc)
        return d
    return None


def leggi_feed(urls):
    errori = []
    for url in ([urls] if isinstance(urls, str) else urls):
        try:
            voci = leggi_un_feed(url)
            if voci:
                return url, voci
            errori.append(f"{url}: vuoto")
        except Exception as e:
            errori.append(f"{url}: {type(e).__name__}: {e}")
    raise RuntimeError(" | ".join(errori))


def leggi_un_feed(url):
    raw, _ = scarica(url)
    root = ET.fromstring(raw)
    out = []
    for el in list(root.iter("item")) + list(root.iter("{http://www.w3.org/2005/Atom}entry")):
        titolo = pulisci(el.findtext("title") or el.findtext("{http://www.w3.org/2005/Atom}title"))
        link = (el.findtext("link") or "").strip()
        if not link:
            a = el.find("{http://www.w3.org/2005/Atom}link")
            link = (a.get("href") if a is not None else "") or ""
        desc = pulisci(el.findtext("description") or el.findtext("{http://www.w3.org/2005/Atom}summary"))
        if titolo and link:
            out.append({"titolo": titolo, "url": link, "data": data_item(el), "sommario": desc[:500]})
    return out


def testo_articolo(url):
    raw, enc = scarica(url, timeout=20)
    pagina = raw.decode(enc, errors="replace")
    paragrafi = re.findall(r"(?is)<p[^>]*>(.*?)</p>", pagina)
    rumore = ("cookie", "abbonamento", "consentless", "iscriviti", "newsletter", "Italiano English", "privacy", "Accedi", "Leggi anche")
    testo = " ".join(p for p in (pulisci(x) for x in paragrafi) if len(p) > 60 and not any(r.lower() in p.lower() for r in rumore))
    return testo[:MAX_TESTO]


def main():
    adesso = dt.datetime.now(dt.timezone.utc)
    oggi = adesso.astimezone(ZoneInfo("Europe/Rome")).date().isoformat()
    limite = adesso - dt.timedelta(hours=ORE)
    visti, articoli, stato = set(), [], []
    for sezione, testata, url in FEEDS:
        try:
            url, voci = leggi_feed(url)
        except Exception as e:
            stato.append({"testata": testata, "feed": url, "ok": False, "errore": str(e)[:400]})
            continue
        recenti = [v for v in voci if v["data"] is None or v["data"] >= limite]
        recenti.sort(key=lambda v: v["data"] or adesso, reverse=True)
        presi = 0
        for v in recenti:
            if v["url"] in visti or presi >= MAX_PER_FEED:
                continue
            visti.add(v["url"])
            try:
                testo = testo_articolo(v["url"])
            except Exception:
                testo = ""
            articoli.append({
                "sezione": sezione, "testata": testata, "titolo": v["titolo"], "url": v["url"],
                "pubblicato": v["data"].astimezone(ZoneInfo("Europe/Rome")).isoformat(timespec="minutes") if v["data"] else None,
                "sommario_feed": v["sommario"], "testo": testo, "testo_letto": len(testo) > 300,
            })
            presi += 1
        stato.append({"testata": testata, "feed": url, "ok": True, "voci": len(voci), "recenti": presi})
    out = {"generato": adesso.isoformat(timespec="minutes"), "data": oggi, "ore": ORE, "feed": stato, "articoli": articoli}
    dest = ROOT / "bozze" / f"{oggi}.json"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    for p in sorted(dest.parent.glob("*.json"))[:-7]:
        p.unlink()
    ok = sum(1 for s in stato if s["ok"])
    print(f"{len(articoli)} articoli, {ok}/{len(stato)} feed raggiungibili -> {dest.name}")
    for s in stato:
        print(("OK  " if s["ok"] else "KO  "), s["testata"], s.get("recenti", s.get("errore")))
    if ok == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
