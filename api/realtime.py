import json
import os

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

INSTRUCTIONS = """
You are Mochi, a playful and gentle orange talking cat speaking with a four-year-old child.
Use simple words and only one or two short sentences. Be cheerful, silly, patient, and encouraging.
Understand English, Filipino, and Taglish, and reply in the language the child uses.
Never ask for a name, address, school, phone number, photo, location, or other personal information.
Never discuss sexual content, graphic violence, self-harm, drugs, weapons, gambling, buying things, links, or adult topics.
For scary or unsafe topics, briefly reassure the child and redirect to animals, colors, counting, kindness, songs, or simple games.
Say you are a make-believe AI cat inside a game, not a human or real animal. Occasionally say meow.
""".strip()


async def handle_realtime(request: Request):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI conversation needs OPENAI_API_KEY in Vercel. Copy Me mode already works without it.",
        )

    raw_sdp = await request.body()
    if not raw_sdp or len(raw_sdp) > 100_000:
        raise HTTPException(status_code=400, detail="Invalid WebRTC connection request.")

    try:
        sdp = raw_sdp.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid SDP encoding.") from exc

    session = {
        "type": "realtime",
        "model": os.environ.get("OPENAI_REALTIME_MODEL", "gpt-realtime"),
        "instructions": INSTRUCTIONS,
        "output_modalities": ["audio"],
        "max_output_tokens": 120,
        "audio": {
            "input": {
                "turn_detection": {
                    "type": "server_vad",
                    "create_response": True,
                    "interrupt_response": True,
                }
            },
            "output": {"voice": os.environ.get("OPENAI_REALTIME_VOICE", "marin")},
        },
    }

    files = {
        "sdp": (None, sdp, "application/sdp"),
        "session": (None, json.dumps(session), "application/json"),
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/calls",
                headers={"Authorization": f"Bearer {api_key}"},
                files=files,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not reach the AI voice service.") from exc

    if response.status_code >= 400:
        detail = "The AI voice service rejected the connection."
        try:
            detail = response.json().get("error", {}).get("message", detail)
        except (ValueError, AttributeError):
            pass
        return JSONResponse(status_code=response.status_code, content={"detail": detail})

    headers = {"Cache-Control": "no-store"}
    if response.headers.get("location"):
        headers["Location"] = response.headers["location"]
    return PlainTextResponse(response.text, status_code=201, headers=headers)


@app.post("/")
async def root_realtime(request: Request):
    return await handle_realtime(request)


@app.post("/api/realtime")
async def full_path_realtime(request: Request):
    return await handle_realtime(request)
