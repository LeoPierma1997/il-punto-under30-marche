#!/usr/bin/env python3
"""Aggiunge la voce fuori campo a un reel muto.

Uso: python strumenti/reel/voce/genera_voce.py strumenti/reel/voce/copione-01.json

Legge il copione (battute con inizio, fine e testo), fa leggere ogni battuta
alla voce Microsoft di edge-tts (la stessa della rassegna), la mette al suo
posto nel tempo e la monta sul video senza ricodificare le immagini.
Se una battuta è più lunga del suo spazio, viene accelerata quanto basta.
"""
import asyncio
import json
import os
import subprocess
import sys
import urllib.request

import edge_tts


def durata(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


async def leggi_microsoft(testo, voce, velocita, path):
    await edge_tts.Communicate(testo, voce, rate=velocita).save(path)


def leggi_eleven(testo, key, voice_id, path):
    body = json.dumps({
        "text": testo,
        "model_id": os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2"),
        "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
        f.write(r.read())


def voce_eleven(key):
    vid = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    if vid:
        return vid
    req = urllib.request.Request("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": key})
    voci = json.load(urllib.request.urlopen(req, timeout=60)).get("voices", [])
    maschili = [v for v in voci if (v.get("labels") or {}).get("gender") == "male"]
    scelta = (maschili or voci)[0]
    print("Voce ElevenLabs:", scelta.get("name"))
    return scelta["voice_id"]


def main():
    copione = sys.argv[1]
    base = os.path.dirname(os.path.abspath(copione))
    cfg = json.load(open(copione, encoding="utf-8"))
    video = os.path.join(base, cfg["video"])
    uscita = os.path.join(base, cfg["uscita"])
    tmp = os.path.join(base, "_voce")
    os.makedirs(tmp, exist_ok=True)

    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    usa_eleven = cfg.get("motore") == "elevenlabs"
    if usa_eleven and not key:
        print("Manca ELEVENLABS_API_KEY: salto", copione)
        return
    vid = voce_eleven(key) if usa_eleven else None
    ingressi, filtri, etichette = [], [], []
    for i, b in enumerate(cfg["battute"]):
        mp3 = os.path.join(tmp, f"b{i:02d}.mp3")
        if usa_eleven:
            leggi_eleven(b["testo"], key, vid, mp3)
        else:
            asyncio.run(leggi_microsoft(b["testo"], cfg.get("voce", "it-IT-DiegoNeural"), cfg.get("velocita", "+0%"), mp3))
        d, spazio = durata(mp3), b["a"] - b["da"]
        tempo = min(1.6, d / spazio) if d > spazio else 1.0
        print(f"battuta {i + 1}: {d:.2f}s nello spazio di {spazio:.2f}s, accelerazione {tempo:.2f}")
        ingressi += ["-i", mp3]
        ms = int(b["da"] * 1000)
        filtri.append(f"[{i + 1}:a]aresample=48000,atempo={tempo:.3f},adelay={ms}|{ms}[v{i}]")
        etichette.append(f"[v{i}]")

    totale = durata(video)
    filtri.append("".join(etichette) + f"amix=inputs={len(etichette)}:normalize=0,"
                  f"apad,atrim=0:{totale:.3f},loudnorm=I=-16:TP=-1.5:LRA=11[voce]")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video] + ingressi +
                   ["-filter_complex", ";".join(filtri), "-map", "0:v", "-map", "[voce]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                    "-movflags", "+faststart", uscita + ".tmp.mp4"], check=True)
    os.replace(uscita + ".tmp.mp4", uscita)
    print("Scritto", uscita)


if __name__ == "__main__":
    main()
