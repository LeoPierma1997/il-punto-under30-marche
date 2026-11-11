"""Copia sul sito gli ultimi post e reel del profilo Instagram.

Gira dentro GitHub Actions (vedi .github/workflows/instagram.yml).
- Legge i post con l'API ufficiale di Instagram (token nel segreto IG_TOKEN).
- Scarica le copertine in assets/social/ e scrive data/social.json:
  chi visita il sito non contatta Instagram finché non clicca su un post.
- Il lunedì rinnova il token (valido 60 giorni); se il token cambia e c'è il
  segreto GH_PAT, lo salva da solo nei segreti del repository.
"""
import datetime as dt
import io
import json
import os
import pathlib
import subprocess
import sys
import urllib.parse
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_JSON = ROOT / "data" / "social.json"
IMG_DIR = ROOT / "assets" / "social"
API = "https://graph.instagram.com"
LIMIT = 24


def get_json(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def get_bytes(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def refresh_token(token):
    """Rinnova il token; restituisce quello nuovo (o lo stesso)."""
    q = urllib.parse.urlencode({"grant_type": "ig_refresh_token", "access_token": token})
    try:
        data = get_json(f"{API}/refresh_access_token?{q}")
    except Exception as e:  # il token deve avere almeno 24 ore: in quel caso si riprova la settimana dopo
        print(f"Rinnovo del token non riuscito ({e}).")
        return token
    new = data.get("access_token") or token
    days = int(data.get("expires_in", 0)) // 86400
    print(f"Token rinnovato: valido altri {days} giorni.")
    if new != token:
        if os.environ.get("GH_TOKEN"):
            subprocess.run(["gh", "secret", "set", "IG_TOKEN", "--body", new], check=True)
            print("Nuovo token salvato nei segreti del repository.")
        else:
            print("ATTENZIONE: il token è cambiato ma manca GH_PAT. Copia a mano il nuovo token nel segreto IG_TOKEN.")
    return new


def save_cover(url, media_id):
    raw = get_bytes(url)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img.thumbnail((720, 1280))
    name = f"{media_id}.jpg"
    img.save(IMG_DIR / name, "JPEG", quality=82, optimize=True, progressive=True)
    return f"assets/social/{name}"


def main():
    token = os.environ.get("IG_TOKEN", "").strip()
    if not token:
        print("Segreto IG_TOKEN non impostato: niente da fare (vedi INSTAGRAM.md).")
        return 0
    if not token.startswith("EAA") and (dt.date.today().weekday() == 0 or os.environ.get("FORCE_REFRESH") == "1"):
        token = refresh_token(token)

    fields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp"
    if token.startswith("EAA"):
        # token del login con Facebook: si passa dalla Pagina collegata all'account Instagram
        fb = "https://graph.facebook.com/v21.0"
        q = urllib.parse.urlencode({"fields": "instagram_business_account", "access_token": token})
        pages = get_json(f"{fb}/me/accounts?{q}").get("data", [])
        ig = next((p["instagram_business_account"]["id"] for p in pages if p.get("instagram_business_account")), None)
        if not ig:
            try:
                ig = get_json(f"{fb}/me?{urllib.parse.urlencode({'fields': 'id', 'access_token': token})}")["id"]
            except Exception:
                ig = None
        if not ig:
            print("Nessun account Instagram trovato con questo token.")
            return 1
        q = urllib.parse.urlencode({"fields": fields, "limit": LIMIT, "access_token": token})
        data = get_json(f"{fb}/{ig}/media?{q}")
    else:
        q = urllib.parse.urlencode({"fields": fields, "limit": LIMIT, "access_token": token})
        data = get_json(f"{API}/me/media?{q}")

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    old = {}
    if OUT_JSON.exists():
        try:
            old = {p["id"]: p for p in json.loads(OUT_JSON.read_text("utf-8")).get("posts", [])}
        except Exception:
            old = {}

    posts = []
    for m in data.get("data", []):
        mid = m["id"]
        kind = "reel" if m.get("media_product_type") == "REELS" or m.get("media_type") == "VIDEO" else (
            "carosello" if m.get("media_type") == "CAROUSEL_ALBUM" else "post")
        cover_url = m.get("thumbnail_url") or m.get("media_url")
        image = old.get(mid, {}).get("image")
        if not image or not (ROOT / image).exists():
            if not cover_url:
                continue
            try:
                image = save_cover(cover_url, mid)
            except Exception as e:
                print(f"Copertina di {mid} non scaricata: {e}")
                continue
        caption = (m.get("caption") or "").strip()
        posts.append({
            "id": mid,
            "type": kind,
            "caption": caption[:600],
            "permalink": m.get("permalink", ""),
            "timestamp": m.get("timestamp", ""),
            "image": image,
        })

    keep = {pathlib.Path(p["image"]).name for p in posts}
    for f in IMG_DIR.glob("*.jpg"):
        if f.name not in keep:
            f.unlink()

    OUT_JSON.write_text(json.dumps({
        "aggiornato": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "profilo": "https://www.instagram.com/azioneunder30marche/",
        "posts": posts,
    }, ensure_ascii=False, indent=1), "utf-8")
    print(f"{len(posts)} post salvati.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
