"""Windows-safe dev server entrypoint for Agora API."""
from __future__ import annotations

import asyncio
import os
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn


def main() -> None:
    port = int(os.getenv("AGORA_API_PORT", "8001"))
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=port,
        reload=os.getenv("AGORA_RELOAD", "1") == "1",
        loop="none",
    )


if __name__ == "__main__":
    main()
