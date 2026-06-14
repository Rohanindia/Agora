from __future__ import annotations

import asyncio
import json
from typing import Any

import httpx
from fastapi import WebSocket
from pydantic import ValidationError

from agents.builder import (
    AGENT_ORDER,
    AgoraAgent,
    build_agents,
    mock_agent_response,
    normalize_challenges_payload,
    normalize_position_payload,
)
from grounding import build_grounding_provider
from orchestration.schemas import Challenge, GroundingResult, Position, Verdict
from storage.db import save_session

try:
    from agent_framework import ConcurrentBuilder  # type: ignore
except Exception:  # pragma: no cover - package is optional for local mock mode.
    ConcurrentBuilder = None


async def run_deliberation(question: str, ws: WebSocket) -> str:
    agents = build_agents()
    grounding_provider = build_grounding_provider()

    await emit(ws, {"type": "round_start", "round": 1, "name": "Formation"})
    position_tasks = [
        _call_position(agent, question)
        for agent in agents.values()
    ]
    positions: list[Position] = []
    for task in asyncio.as_completed(position_tasks):
        position = await task
        positions.append(position)
        await emit(ws, {"type": "agent_position", "round": 1, "data": dump_model(position)})
    positions = sorted(positions, key=lambda item: AGENT_ORDER.index(item.agent))
    await emit(ws, {"type": "round_end", "round": 1})

    await emit(ws, {"type": "round_start", "round": 2, "name": "Challenge"})
    round_one_context = json.dumps([dump_model(position) for position in positions], indent=2)
    challenge_tasks = [
        _call_challenges(agent, question, round_one_context)
        for agent in agents.values()
    ]
    challenges: list[Challenge] = []
    for task in asyncio.as_completed(challenge_tasks):
        for challenge in await task:
            challenges.append(challenge)
            await emit(ws, {"type": "challenge", "round": 2, "data": dump_model(challenge)})
    await emit(ws, {"type": "round_end", "round": 2})

    await emit(ws, {"type": "round_start", "round": 3, "name": "Grounding"})
    claims = _collect_claims(positions, challenges)
    grounding_results: list[GroundingResult] = []
    grounding_tasks = [grounding_provider.search(claim) for claim in claims]
    for task in asyncio.as_completed(grounding_tasks):
        result = await task
        grounding_results.append(result)
        await emit(ws, {"type": "grounding_result", "round": 3, "data": dump_model(result)})
    grounding_results = sorted(grounding_results, key=lambda item: claims.index(item.claim))
    await emit(ws, {"type": "round_end", "round": 3})

    await emit(ws, {"type": "round_start", "round": 4, "name": "Verdict"})
    verdict = await _call_verdict(
        agents["Judge"],
        question,
        positions,
        challenges,
        grounding_results,
    )
    await emit(ws, {"type": "verdict", "round": 4, "data": dump_model(verdict)})
    await emit(ws, {"type": "round_end", "round": 4})

    session_id = save_session(
        question=question,
        positions=[dump_model(position) for position in positions],
        challenges=[dump_model(challenge) for challenge in challenges],
        grounding=[dump_model(result) for result in grounding_results],
        verdict=dump_model(verdict),
    )
    await emit(ws, {"type": "done", "session_id": session_id})
    return session_id


async def _call_position(agent: AgoraAgent, question: str) -> Position:
    prompt = (
        "Round 1 - Formation.\n"
        f"Question:\n{question}\n\n"
        "Return one JSON object matching Position: "
        "{agent, claim, reasoning, cited_flags, devils_advocate_mode, revising}."
    )
    for _ in range(2):
        try:
            raw = await agent.run_json(prompt, "Position")
            return Position.model_validate(normalize_position_payload(raw, agent.name))
        except (ValidationError, RuntimeError, ValueError, KeyError, httpx.HTTPError, OSError):
            await asyncio.sleep(0.25)
    fallback = mock_agent_response(agent.name, "Position")
    fallback["claim"] = f"{fallback['claim']} (fallback after model error)"
    fallback["cited_flags"].append({"claim": "Agent output fallback", "status": "uncited", "error": True})
    return Position.model_validate(fallback)


async def _call_challenges(
    agent: AgoraAgent,
    question: str,
    round_one_context: str,
) -> list[Challenge]:
    prompt = (
        "Round 2 - Challenge.\n"
        f"Question:\n{question}\n\n"
        "Round 1 positions as JSON:\n"
        f"{round_one_context}\n\n"
        "Return a JSON array of Challenge objects. The Judge should return an empty array."
    )
    for _ in range(2):
        try:
            raw = await agent.run_json(prompt, "Challenges")
            normalized = normalize_challenges_payload(raw, agent.name)
            return [Challenge.model_validate(item) for item in normalized]
        except (ValidationError, RuntimeError, ValueError, KeyError, TypeError, httpx.HTTPError, OSError):
            await asyncio.sleep(0.25)
    return [
        Challenge.model_validate(
            {
                "agent": agent.name,
                "target_agent": agent.name,
                "target_claim": "Agent challenge unavailable",
                "challenge_type": "convergence-note",
                "content": "Challenge generation failed once and retried; this placeholder keeps the demo moving.",
            }
        )
    ]


async def _call_verdict(
    judge: AgoraAgent,
    question: str,
    positions: list[Position],
    challenges: list[Challenge],
    grounding_results: list[GroundingResult],
) -> Verdict:
    prompt = (
        "Round 4 - Verdict.\n"
        f"Question:\n{question}\n\n"
        "Positions:\n"
        f"{json.dumps([dump_model(position) for position in positions], indent=2)}\n\n"
        "Challenges:\n"
        f"{json.dumps([dump_model(challenge) for challenge in challenges], indent=2)}\n\n"
        "Grounding results:\n"
        f"{json.dumps([dump_model(result) for result in grounding_results], indent=2)}\n\n"
        "Return one Verdict JSON object."
    )
    for _ in range(2):
        try:
            raw = await judge.run_json(prompt, "Verdict")
            verdict = Verdict.model_validate(raw)
            citations = _supporting_citations(grounding_results)
            if citations and not verdict.citations:
                verdict.citations = citations
            verdict.debate_trace.exchanges = len(challenges)
            verdict.debate_trace.claims_challenged = len({challenge.target_claim for challenge in challenges})
            verdict.debate_trace.claims_revised = len([position for position in positions if position.revising])
            return verdict
        except (ValidationError, RuntimeError, ValueError, KeyError, TypeError, httpx.HTTPError, OSError):
            await asyncio.sleep(0.25)

    raw = mock_agent_response("Judge", "Verdict")
    raw["citations"] = [dump_model(citation) for citation in _supporting_citations(grounding_results)]
    raw["debate_trace"] = {
        "rounds": 4,
        "exchanges": len(challenges),
        "claims_challenged": len({challenge.target_claim for challenge in challenges}),
        "claims_revised": len([position for position in positions if position.revising]),
    }
    return Verdict.model_validate(raw)


def _collect_claims(positions: list[Position], challenges: list[Challenge]) -> list[str]:
    seen: set[str] = set()
    claims: list[str] = []
    for claim in [position.claim for position in positions] + [challenge.target_claim for challenge in challenges]:
        normalized = " ".join(claim.lower().split())
        if normalized not in seen:
            seen.add(normalized)
            claims.append(claim)
    return claims


def _supporting_citations(grounding_results: list[GroundingResult]):
    citations = []
    seen_sources: set[str] = set()
    for result in grounding_results:
        if result.status != "grounded":
            continue
        for citation in result.citations:
            if citation.source not in seen_sources:
                seen_sources.add(citation.source)
                citations.append(citation)
    return citations[:4]


async def emit(ws: WebSocket, event: dict[str, Any]) -> None:
    await ws.send_text(json.dumps(event) + "\n")


def dump_model(model: Any) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()
