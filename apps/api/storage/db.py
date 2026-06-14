from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DB_PATH = Path(__file__).resolve().parent / "agora.sqlite3"


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                question TEXT NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )


def save_session(
    *,
    question: str,
    positions: list[dict[str, Any]],
    challenges: list[dict[str, Any]],
    grounding: list[dict[str, Any]],
    verdict: dict[str, Any],
) -> str:
    init_db()
    session_id = str(uuid.uuid4())
    payload = {
        "positions": positions,
        "challenges": challenges,
        "grounding": grounding,
        "verdict": verdict,
    }
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO sessions (id, created_at, question, payload) VALUES (?, ?, ?, ?)",
            (
                session_id,
                datetime.now(timezone.utc).isoformat(),
                question,
                json.dumps(payload),
            ),
        )
    return session_id


def get_session(session_id: str) -> dict[str, Any] | None:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT id, created_at, question, payload FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
    if not row:
        return None
    payload = json.loads(row[3])
    return {
        "id": row[0],
        "created_at": row[1],
        "question": row[2],
        **payload,
    }
