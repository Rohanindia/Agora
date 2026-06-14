from abc import ABC, abstractmethod

from orchestration.schemas import GroundingResult


class GroundingProvider(ABC):
    @abstractmethod
    async def search(self, claim: str) -> GroundingResult:
        ...
