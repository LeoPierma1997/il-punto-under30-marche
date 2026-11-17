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

import edge_tts


def durata(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


async def leggi(testo, voce, velocita, path):
    await edge_tts.Communicate(testo, voce, rate=velocita).save(path)


def main():
    copione = sys.argv[1]
    base = os.path.dirname(os.path.abspath(copione))
    cfg = json.load(open(copione, encoding="utf-8"))
    video = os.path.join(base, cfg["video"])
    uscita = os.path.join(base, cfg["uscita"])
    tmp = os.path.join(base, "_voce")
    os.makedirs(tmp, exist_ok=True)

    ingressi, filtri, etichette = [], [], []
    for i, b in enumerate(cfg["battute"]):
        mp3 = os.path.join(tmp, f"b{i:02d}.mp3")
        asyncio.run(leggi(b["testo"], cfg.get("voce", "it-IT-DiegoNeural"), cfg.get("velocita", "+0%"), mp3))
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
