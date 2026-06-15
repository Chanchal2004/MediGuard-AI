from __future__ import annotations

from typing import Optional


async def transcribe_audio(
    file_bytes: bytes,
    filename: str,
    language: Optional[str] = None
) -> str:
    return "Voice transcription temporarily disabled"


async def synthesize_speech(
    text: str,
    voice: str = "nova"
) -> bytes:
    return b""