from dotenv import load_dotenv
load_dotenv()

import asyncio
import logging
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from fastapi.middleware.cors import CORSMiddleware

from orchestration.rounds import emit, run_deliberation
from storage.db import get_session, init_db

logger = logging.getLogger(__name__)

app = FastAPI(title="Agora API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/sessions/{session_id}")
def session(session_id: str):
    data = get_session(session_id)
    if not data:
        return {"error": "not_found"}
    return data


@app.websocket("/ws/deliberate")
async def deliberate(ws: WebSocket) -> None:
    await ws.accept()
    try:
        payload = await ws.receive_json()
        question = payload.get("question", "").strip()
        context = payload.get("context", "").strip()
        if not question:
            await emit(ws, {"type": "error", "message": "Question is required.", "recoverable": False})
            return
        if context:
            question = f"{question}\n\nPatient/context:\n{context}"
        await run_deliberation(question, ws)
    except WebSocketDisconnect:
        return
    except Exception as exc:
        logger.exception("Deliberation failed")
        await emit(ws, {"type": "error", "message": str(exc), "recoverable": True})
