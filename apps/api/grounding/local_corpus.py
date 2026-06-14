from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from grounding.base import GroundingProvider
from orchestration.schemas import Citation, GroundingResult


TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")


@dataclass
class CorpusDoc:
    source: str
    keywords: list[str]
    body: str
    path: Path

    @property
    def searchable_text(self) -> str:
        return f"{self.source} {' '.join(self.keywords)} {self.body}"


class LocalCorpusGroundingProvider(GroundingProvider):
    def __init__(self, corpus_dir: Path | None = None) -> None:
        self.corpus_dir = corpus_dir or Path(__file__).resolve().parents[1] / "data" / "clinical_corpus"
        self.docs = self._load_docs()

    async def search(self, claim: str) -> GroundingResult:
        if not self.docs:
            return GroundingResult(claim=claim, status="ungrounded", citations=[])

        matches = self._rank(claim)
        citations = [
            Citation(
                source=doc.source,
                relevance=f"Similarity {score:.2f}; matched local demo corpus file {doc.path.name}.",
            )
            for score, doc in matches[:2]
            if score >= 0.08
        ]
        status = "grounded" if citations else "ungrounded"
        return GroundingResult(claim=claim, status=status, citations=citations)

    def _load_docs(self) -> list[CorpusDoc]:
        docs: list[CorpusDoc] = []
        for path in sorted(self.corpus_dir.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            docs.append(self._parse_doc(text, path))
        return docs

    def _parse_doc(self, text: str, path: Path) -> CorpusDoc:
        source = path.stem
        keywords: list[str] = []
        body = text
        if text.startswith("---"):
            _, frontmatter, body = text.split("---", 2)
            for line in frontmatter.splitlines():
                if line.startswith("source:"):
                    source = line.split(":", 1)[1].strip().strip('"')
                if line.startswith("relevance_keywords:"):
                    raw = line.split(":", 1)[1].strip().strip("[]")
                    keywords = [item.strip().strip('"') for item in raw.split(",") if item.strip()]
        return CorpusDoc(source=source, keywords=keywords, body=body.strip(), path=path)

    def _rank(self, claim: str) -> list[tuple[float, CorpusDoc]]:
        try:
            return self._rank_with_tfidf(claim)
        except Exception:
            claim_tokens = Counter(tokenize(claim))
            return sorted(
                ((cosine_counter(claim_tokens, Counter(tokenize(doc.searchable_text))), doc) for doc in self.docs),
                key=lambda item: item[0],
                reverse=True,
            )

    def _rank_with_tfidf(self, claim: str) -> list[tuple[float, CorpusDoc]]:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = vectorizer.fit_transform([claim] + [doc.searchable_text for doc in self.docs])
        scores = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
        return sorted(zip(scores.tolist(), self.docs), key=lambda item: item[0], reverse=True)


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_RE.findall(text)]


def cosine_counter(left: Counter[str], right: Counter[str]) -> float:
    if not left or not right:
        return 0.0
    shared = set(left) & set(right)
    numerator = sum(left[token] * right[token] for token in shared)
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    return numerator / (left_norm * right_norm)
