from grounding.base import GroundingProvider
from grounding.foundry_iq import FoundryIQGroundingProvider
from grounding.local_corpus import LocalCorpusGroundingProvider


def build_grounding_provider() -> GroundingProvider:
    import os

    provider = os.getenv("GROUNDING_PROVIDER", "local_corpus").lower()
    if provider == "foundry_iq":
        return FoundryIQGroundingProvider()
    return LocalCorpusGroundingProvider()
