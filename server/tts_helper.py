#!/usr/bin/env python3
"""
Edge TTS helper — reads JSON from stdin, writes MP3 bytes to stdout.
Called by the Node.js TTS endpoint as a child process.

Stdin JSON: { "text": "...", "voice": "en-GB-SoniaNeural", "rate": "+5%" }
Stdout: raw MP3 bytes
Stderr: error messages (only on failure)
"""
import sys
import json
import asyncio
import edge_tts

# Voice map: language code -> natural neural voice
VOICE_MAP = {
    "en":  "en-GB-SoniaNeural",      # British English — warm, natural
    "en-US": "en-US-JennyNeural",
    "en-GB": "en-GB-SoniaNeural",
    "es":  "es-ES-ElviraNeural",
    "fr":  "fr-FR-DeniseNeural",
    "de":  "de-DE-KatjaNeural",
    "it":  "it-IT-ElsaNeural",
    "pt":  "pt-PT-RaquelNeural",
    "ar":  "ar-EG-SalmaNeural",
    "zh":  "zh-CN-XiaoxiaoNeural",
    "ja":  "ja-JP-NanamiNeural",
    "hi":  "hi-IN-SwaraNeural",
    "ur":  "ur-PK-UzmaNeural",
    "pl":  "pl-PL-ZofiaNeural",
    "tr":  "tr-TR-EmelNeural",
    "ru":  "ru-RU-SvetlanaNeural",
}

async def synthesise(text: str, voice: str, rate: str) -> bytes:
    tts = edge_tts.Communicate(text, voice=voice, rate=rate)
    audio = b""
    async for chunk in tts.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
    return audio

def main():
    try:
        payload = json.loads(sys.stdin.read())
        text = payload.get("text", "").strip()
        lang = payload.get("language", "en").split("-")[0].lower()
        rate = payload.get("rate", "+5%")

        if not text:
            print("No text provided", file=sys.stderr)
            sys.exit(1)

        # Resolve voice: prefer exact match, then language prefix, then default
        voice = (
            VOICE_MAP.get(payload.get("language", ""), None) or
            VOICE_MAP.get(lang, None) or
            "en-GB-SoniaNeural"
        )

        audio = asyncio.run(synthesise(text, voice, rate))

        if not audio:
            print("Edge TTS returned empty audio", file=sys.stderr)
            sys.exit(1)

        # Write raw MP3 bytes to stdout
        sys.stdout.buffer.write(audio)
        sys.stdout.buffer.flush()

    except Exception as e:
        print(f"TTS error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
