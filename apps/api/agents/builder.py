from __future__ import annotations

import asyncio
import json
import os
import re
from dataclasses import dataclass
from typing import Any

import httpx

from agents.personas import PERSONAS


AGENT_ORDER = [
    "Empiricist",
    "Rationalist",
    "Devils Advocate",
    "Synthesizer",
    "Judge",
]

_LLM_SEMAPHORE = asyncio.Semaphore(2)
_HTTP_CLIENT: httpx.AsyncClient | None = None


async def _get_http_client() -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        _HTTP_CLIENT = httpx.AsyncClient(timeout=45)
    return _HTTP_CLIENT


async def close_http_client() -> None:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is not None:
        await _HTTP_CLIENT.aclose()
        _HTTP_CLIENT = None


def _normalize_agent_name(value: Any, fallback: str) -> str:
    if not isinstance(value, str):
        return fallback
    cleaned = re.sub(r"^the\s+", "", value.strip(), flags=re.IGNORECASE)
    cleaned = cleaned.replace("_", " ").replace("-", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower()
    aliases = {
        "empiricist": "Empiricist",
        "rationalist": "Rationalist",
        "devils advocate": "Devils Advocate",
        "devil's advocate": "Devils Advocate",
        "devil advocate": "Devils Advocate",
        "devil": "Devils Advocate",
        "synthesizer": "Synthesizer",
        "judge": "Judge",
    }
    if cleaned in aliases:
        return aliases[cleaned]
    for valid in AGENT_ORDER:
        if cleaned == valid.lower():
            return valid
    return fallback


def _unwrap_payload(raw: Any, schema_name: str) -> Any:
    if not isinstance(raw, dict):
        return raw
    for key in (schema_name, schema_name.lower(), "position", "positions", "data"):
        nested = raw.get(key)
        if isinstance(nested, dict):
            return nested
        if isinstance(nested, list) and nested and isinstance(nested[0], dict):
            return nested[0]
    return raw


def _normalize_cited_flags(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, dict):
        return [
            {"claim": str(key), "status": "uncited"}
            for key in value
        ]
    if not isinstance(value, list):
        return []
    normalized: list[dict[str, Any]] = []
    for item in value:
        if isinstance(item, str):
            normalized.append({"claim": item, "status": "uncited"})
        elif isinstance(item, dict):
            normalized.append(item)
    return normalized


def normalize_position_payload(raw: Any, agent_name: str) -> dict[str, Any]:
    payload = _unwrap_payload(raw, "Position")
    if not isinstance(payload, dict):
        payload = {}
    payload = dict(payload)
    payload["agent"] = _normalize_agent_name(payload.get("agent"), agent_name)
    if isinstance(payload.get("reasoning"), list):
        payload["reasoning"] = " ".join(str(part) for part in payload["reasoning"])
    payload["cited_flags"] = _normalize_cited_flags(payload.get("cited_flags", []))
    payload.setdefault("claim", "Position unavailable from model output.")
    payload.setdefault("reasoning", "Model output required normalization.")
    return payload


def normalize_challenges_payload(raw: Any, agent_name: str) -> list[dict[str, Any]]:
    if isinstance(raw, dict) and "challenges" in raw:
        raw = raw["challenges"]
    if raw is None:
        return []
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list):
        return []
    normalized: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        item = dict(item)
        item["agent"] = _normalize_agent_name(item.get("agent"), agent_name)
        item["target_agent"] = _normalize_agent_name(
            item.get("target_agent"),
            item["agent"],
        )
        normalized.append(item)
    return normalized


@dataclass
class AgoraAgent:
    name: str
    system_prompt: str
    provider: str
    model: str

    async def run_json(self, user_prompt: str, schema_name: str) -> Any:
        if self.provider == "mock":
            await asyncio.sleep(0.15)
            return mock_agent_response(self.name, schema_name)

        return await self._run_openai_compatible(user_prompt)

    async def _run_openai_compatible(self, user_prompt: str) -> Any:
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")

        response_format = {"type": "json_object"}
        client = await _get_http_client()

        async with _LLM_SEMAPHORE:
            for attempt in range(5):
                try:
                    response = await client.post(
                        f"{base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": self.model,
                            "messages": [
                                {"role": "system", "content": self.system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            "temperature": 0.2,
                            "response_format": response_format,
                        },
                    )
                    response.raise_for_status()
                    content = response.json()["choices"][0]["message"]["content"]
                    return parse_json_content(content)
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code == 429 and attempt < 4:
                        await asyncio.sleep(2.0 * (attempt + 1))
                        continue
                    raise
                except (httpx.TransportError, OSError) as exc:
                    if attempt < 4:
                        await asyncio.sleep(1.0 * (attempt + 1))
                        continue
                    raise RuntimeError(str(exc)) from exc


def build_agents() -> dict[str, AgoraAgent]:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "openai" and not os.getenv("OPENAI_API_KEY"):
        provider = "mock"
    if provider == "azure" and not (
        os.getenv("AZURE_OPENAI_ENDPOINT")
        and os.getenv("AZURE_OPENAI_API_KEY")
        and os.getenv("AZURE_OPENAI_DEPLOYMENT")
    ):
        provider = "mock"
    if provider == "foundry" and not (
        os.getenv("FOUNDRY_PROJECT_ENDPOINT") and os.getenv("FOUNDRY_MODEL_DEPLOYMENT")
    ):
        provider = "mock"

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    return {
        name: AgoraAgent(
            name=name,
            system_prompt=PERSONAS[name],
            provider=provider,
            model=model,
        )
        for name in AGENT_ORDER
    }


def parse_json_content(content: str) -> Any:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    return json.loads(cleaned)


def mock_agent_response(agent_name: str, schema_name: str) -> Any:
    if schema_name == "Position":
        return MOCK_POSITIONS[agent_name]
    if schema_name == "Challenges":
        return MOCK_CHALLENGES.get(agent_name, [])
    if schema_name == "Verdict":
        return MOCK_VERDICT
    raise ValueError(f"Unknown schema {schema_name}")


MOCK_POSITIONS: dict[str, dict[str, Any]] = {
    "Empiricist": {
        "agent": "Empiricist",
        "claim": (
            "Metformin is usually the initial medication for newly diagnosed type 2 "
            "diabetes, but this patient's eGFR 52 makes renal dosing and monitoring "
            "a required condition."
        ),
        "reasoning": (
            "The first-line metformin claim needs a diabetes guideline citation, and "
            "the renal caution needs a dosing-threshold citation. With eGFR 52, I "
            "would not accept an unqualified 'start metformin' answer."
        ),
        "cited_flags": [
            {"claim": "Metformin is commonly first-line for type 2 diabetes", "status": "uncited"},
            {"claim": "eGFR 52 requires renal-dose caution for metformin", "status": "uncited"},
        ],
    },
    "Rationalist": {
        "agent": "Rationalist",
        "claim": (
            "If metformin is preferred unless contraindicated, and eGFR 52 is not an "
            "absolute contraindication, then dose-adjusted metformin is more logical "
            "than immediate insulin."
        ),
        "reasoning": (
            "If first-line therapy should be used unless a disqualifying condition "
            "exists, then the key premise is whether eGFR 52 disqualifies metformin. "
            "Assuming it requires caution rather than prohibition, the conclusion is "
            "conditional metformin, not insulin-first."
        ),
        "cited_flags": [
            {"claim": "eGFR 52 is not an absolute metformin contraindication", "status": "uncited"}
        ],
    },
    "Devils Advocate": {
        "agent": "Devils Advocate",
        "claim": (
            "Insulin should remain a serious alternative because reduced renal "
            "function could make a default metformin start unsafe without explicit "
            "dose adjustment and monitoring."
        ),
        "reasoning": (
            "The majority position risks compressing 'first-line' into 'automatic.' "
            "A patient with eGFR 52 is exactly the sort of edge case where renal "
            "accumulation risk and monitoring burden could change the treatment path."
        ),
        "cited_flags": [
            {"claim": "Reduced renal function increases metformin accumulation risk", "status": "uncited"}
        ],
        "devils_advocate_mode": True,
    },
    "Synthesizer": {
        "agent": "Synthesizer",
        "claim": (
            "The position most likely to survive is metformin with renal-aware dosing "
            "and monitoring, while keeping insulin as an alternative if risk factors "
            "or glycemic severity justify it."
        ),
        "reasoning": (
            "I believe conditional metformin will hold up because it preserves the "
            "standard initial-therapy logic while acknowledging kidney-function caveats. "
            "What would change my mind: grounding that eGFR 52 makes metformin "
            "contraindicated or that this patient has severe symptoms requiring insulin."
        ),
        "cited_flags": [
            {"claim": "Conditional metformin can preserve first-line therapy logic", "status": "uncited"}
        ],
    },
    "Judge": {
        "agent": "Judge",
        "claim": (
            "The question I think actually needs answering is whether eGFR 52 changes "
            "metformin from default first-line therapy to a conditional option; "
            "tentatively, conditional metformin is favored."
        ),
        "reasoning": (
            "The debate should not become metformin versus insulin in the abstract. "
            "It should decide whether reduced renal function creates a citable caveat "
            "large enough to alter initial therapy."
        ),
        "cited_flags": [
            {"claim": "eGFR 52 is the key treatment-modifying factor", "status": "uncited"}
        ],
    },
}


MOCK_CHALLENGES: dict[str, list[dict[str, Any]]] = {
    "Empiricist": [
        {
            "agent": "Empiricist",
            "target_agent": "Rationalist",
            "target_claim": MOCK_POSITIONS["Rationalist"]["claim"],
            "challenge_type": "missing-citation",
            "content": (
                "The claim that eGFR 52 is not an absolute contraindication needs a "
                "renal dosing guideline, not a logical assumption."
            ),
        },
        {
            "agent": "Empiricist",
            "target_agent": "Devils Advocate",
            "target_claim": MOCK_POSITIONS["Devils Advocate"]["claim"],
            "challenge_type": "missing-citation",
            "content": (
                "The renal accumulation risk claim is plausible but must be grounded "
                "against a kidney-function protocol."
            ),
        },
    ],
    "Rationalist": [
        {
            "agent": "Rationalist",
            "target_agent": "Devils Advocate",
            "target_claim": MOCK_POSITIONS["Devils Advocate"]["claim"],
            "challenge_type": "logical-contradiction",
            "content": (
                "Possible false dilemma: renal caution does not by itself imply "
                "insulin should replace a dose-adjusted oral option."
            ),
        }
    ],
    "Devils Advocate": [
        {
            "agent": "Devils Advocate",
            "target_agent": "Empiricist",
            "target_claim": MOCK_POSITIONS["Empiricist"]["claim"],
            "challenge_type": "counter-position",
            "content": (
                "The consensus answer hides the highest-risk detail: eGFR 52. If the "
                "team starts metformin as a reflex, the patient may face avoidable "
                "accumulation risk without a monitoring plan."
            ),
        },
        {
            "agent": "Devils Advocate",
            "target_agent": "Synthesizer",
            "target_claim": MOCK_POSITIONS["Synthesizer"]["claim"],
            "challenge_type": "counter-position",
            "content": (
                "Conditional metformin is only safe if 'conditional' is operational: "
                "dose, monitoring, and a threshold for switching to insulin must be explicit."
            ),
        },
    ],
    "Synthesizer": [
        {
            "agent": "Synthesizer",
            "target_agent": "Judge",
            "target_claim": MOCK_POSITIONS["Judge"]["claim"],
            "challenge_type": "convergence-note",
            "content": (
                "The group is converging on metformin not as an automatic default, but "
                "as a renal-aware initial option. The remaining dissent is whether "
                "renal risk should push insulin higher in the decision tree."
            ),
        }
    ],
    "Judge": [],
}


MOCK_VERDICT: dict[str, Any] = {
    "verdict_summary": (
        "For this newly treated type 2 diabetes patient with eGFR 52, the majority "
        "supports starting metformin only with renal-aware dose consideration and "
        "monitoring rather than moving directly to insulin."
    ),
    "agreement_ratio": 0.8,
    "dissent": [
        {
            "agent": "Devils Advocate",
            "claim": MOCK_POSITIONS["Devils Advocate"]["claim"],
            "citation_ref": (
                "Grounded by renal-function corpus entries; dissent survives as a "
                "caution, not as a complete refutation of metformin."
            ),
        }
    ],
    "citations": [],
    "confidence_label": "Moderate (80% - review dissent before acting)",
    "debate_trace": {
        "rounds": 4,
        "exchanges": 6,
        "claims_challenged": 5,
        "claims_revised": 0,
    },
}
