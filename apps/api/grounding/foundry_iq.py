from __future__ import annotations

import os

from grounding.base import GroundingProvider
from orchestration.schemas import GroundingResult


class FoundryIQGroundingProvider(GroundingProvider):
    async def search(self, claim: str) -> GroundingResult:
        if not (
            os.getenv("FOUNDRY_PROJECT_ENDPOINT")
            and os.getenv("FOUNDRY_IQ_KNOWLEDGE_BASE_ID")
        ):
            return GroundingResult(
                claim=claim,
                status="ungrounded",
                citations=[],
            )

        # Stretch hook: map Foundry IQ / Azure AI Search agentic retrieval source
        # references into Citation objects here. The local corpus provider is the
        # required demo path and uses the same GroundingProvider contract.
        return GroundingResult(
            claim=claim,
            status="ungrounded",
            citations=[],
        )
