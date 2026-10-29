#!/usr/bin/env python3
"""Genera l'audio MP3 di un'edizione de Il Punto Under 30 - Marche.

Uso: python scripts/genera_audio.py [AAAA-MM-GG]
Senza data usa l'edizione più recente in data/index.json.

Motore:
- se è impostata la variabile ELEVENLABS_API_KEY usa ElevenLabs
  (voce scelta con ELEVENLABS_VOICE_ID, altrimenti la prima voce maschile disponibile);
- altrimenti usa la voce neurale Microsoft "it-IT-DiegoNeural" tramite edge-tts.

Scrive audio/AAAA-MM-GG.mp3 e aggiunge il campo "audio" al file dell'edizione.
"""
import asyncio
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDGE_VOICE = os.environ.get("EDGE_VOICE", "it-IT-DiegoNeural")
EDGE_RATE = os.environ.get("EDGE_RATE", "+0%")
WITH_SPUNTI = os.environ.get("AUDIO_SPUNTI", "0") == "1"

DICT = [
    (r"\bM5s\b", "Movimento 5 Stelle", re.I), (r"\bFdI\b", "Fratelli d'Italia", 0), (r"\bPd\b", "Pi Di", 0),
    (r"\bCdm\b", "Consiglio dei ministri", re.I), (r"\bUe\b", "Unione europea", 0), (r"\bUsa\b", "Stati Uniti", 0),
    (r"\bWsj\b", "Wall Street Journal", re.I), (r"\bDda\b", "Direzione distrettuale antimafia", 0),
    (r"\bMimit\b", "ministero delle Imprese", 0), (r"\bSAE\b", "soluzioni abitative d'emergenza", 0),
    (r"[«»“”]", "", 0), (r"\s+–\s+", ", ", 0),
]


def clean(t):
    t = str(t or "")
    for pat, rep, flags in DICT:
        t = re.sub(pat, rep, t, flags=flags)
    t = re.sub(r"\s+", " ", t).strip()
    if t and t[-1] not in ".!?":
        t += "."
    return t


def build_script(ed):
    """Restituisce una lista di blocchi di testo (uno per sezione) da leggere."""
    blocks = [
        "\n\n".join([
            f"Buongiorno. Questo è Il Punto, la rassegna stampa di Azione Under 30 Marche. Edizione di {ed['label'][:1].lower() + ed['label'][1:]}.",
            clean(ed.get("intro", "")),
        ])
    ]
    for s in ed["sections"]:
        parts = [f"{s['title']}."]
        for i, it in enumerate(s["items"]):
            lead = "In apertura." if i == 0 else ("Infine." if i == len(s["items"]) - 1 else "")
            p = (lead + " " if lead else "") + clean(it["title"]) + "\n" + clean(it["summary"])
            if WITH_SPUNTI and it.get("spunto", {}).get("text"):
                p += "\nSpunto di riflessione: " + clean(it["spunto"]["text"])
            parts.append(p)
        blocks.append("\n\n".join(parts))
    blocks.append("Questo era Il Punto. Buona giornata, e alla prossima edizione.")
    return blocks


async def edge_tts_block(text, path):
    import edge_tts
    await edge_tts.Communicate(text, EDGE_VOICE, rate=EDGE_RATE).save(path)


def eleven_voice(key):
    vid = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    if vid:
        return vid
    req = urllib.request.Request("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": key})
    voices = json.load(urllib.request.urlopen(req, timeout=60)).get("voices", [])
    male = [v for v in voices if (v.get("labels") or {}).get("gender") == "male"]
    pick = (male or voices)[0]
    print("Voce ElevenLabs scelta:", pick.get("name"))
    return pick["voice_id"]


def eleven_block(text, key, voice_id):
    body = json.dumps({
        "text": text,
        "model_id": os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2"),
        "language_code": "it",
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
    )
    return urllib.request.urlopen(req, timeout=300).read()


def main():
    index = json.load(open(os.path.join(ROOT, "data", "index.json"), encoding="utf-8"))
    date = sys.argv[1] if len(sys.argv) > 1 else sorted(e["date"] for e in index["editions"])[-1]
    ed_path = os.path.join(ROOT, "data", f"{date}.json")
    ed = json.load(open(ed_path, encoding="utf-8"))
    os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
    out = os.path.join(ROOT, "audio", f"{date}.mp3")
    blocks = build_script(ed)
    print("Caratteri da leggere:", sum(len(b) for b in blocks))

    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    audio = b""
    engine = ""
    if key:
        try:
            vid = eleven_voice(key)
            for b in blocks:
                audio += eleven_block(b, key, vid)
            engine = "elevenlabs"
        except Exception as e:  # crediti esauriti, chiave errata, rete: si ripiega su Microsoft
            print("ElevenLabs non disponibile, uso la voce Microsoft:", e)
            audio = b""
    if not audio:
        tmp = []
        for i, b in enumerate(blocks):
            p = out + f".part{i}.mp3"
            asyncio.run(edge_tts_block(b, p))
            tmp.append(p)
        for p in tmp:
            with open(p, "rb") as f:
                audio += f.read()
            os.remove(p)
        engine = "microsoft"

    with open(out, "wb") as f:
        f.write(audio)
    ed["audio"] = f"audio/{date}.mp3"
    ed["audio_engine"] = engine
    with open(ed_path, "w", encoding="utf-8") as f:
        json.dump(ed, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Creato {out} ({len(audio) // 1024} KB) con {engine}")


if __name__ == "__main__":
    main()
