from typing import Literal, Optional

from pydantic import BaseModel


AGENT_NAMES = Literal[
    "Empiricist",
    "Rationalist",
    "Devils Advocate",
    "Synthesizer",
    "Judge",
]


class Position(BaseModel):
    agent: AGENT_NAMES
    claim: str
    reasoning: str
    cited_flags: list[dict] = []
    devils_advocate_mode: bool = False
    revising: bool = False


class Challenge(BaseModel):
    agent: AGENT_NAMES
    target_agent: AGENT_NAMES
    target_claim: str
    challenge_type: Literal[
        "missing-citation",
        "logical-contradiction",
        "counter-position",
        "convergence-note",
    ]
    content: str


class Citation(BaseModel):
    source: str
    relevance: str
    url: Optional[str] = None


class GroundingResult(BaseModel):
    claim: str
    status: Literal["grounded", "ungrounded", "contradicted"]
    citations: list[Citation] = []


class DissentEntry(BaseModel):
    agent: AGENT_NAMES
    claim: str
    citation_ref: Optional[str] = None


class DebateTrace(BaseModel):
    rounds: int = 4
    exchanges: int
    claims_challenged: int
    claims_revised: int


class Verdict(BaseModel):
    verdict_summary: str
    agreement_ratio: float
    dissent: list[DissentEntry] = []
    citations: list[Citation] = []
    confidence_label: str
    debate_trace: DebateTrace
