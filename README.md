# Agora - The Adversarial Deliberation System

Agora is a hackathon MVP for adversarial multi-agent deliberation. Five agents form
independent positions, challenge each other, ground surviving claims against a local
knowledge base, and produce a verdict that preserves explicit dissent.

The seeded demo asks:

```text
Should this patient be started on metformin or insulin?

Patient context: Type 2 diabetes, eGFR 52 (reduced kidney function), no prior medication.
```

The local corpus is designed so the majority metformin-first answer is grounded, but
the renal-function caveat survives as a cited Devil's Advocate dissent.

## Architecture

```text
apps/web (Next.js 15)
  QuestionForm
  useDeliberation WebSocket hook
  Agent cards + debate trace + verdict card
          |
          | ws://localhost:8000/ws/deliberate
          v
apps/api (FastAPI)
  Round 1: independent agent formation
  Round 2: adversarial challenges
  Round 3: local corpus grounding
  Round 4: Judge verdict
          |
          v
SQLite replay store + clinical_corpus markdown KB
```

## Quick Start

Backend:

```powershell
cd apps/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

On Windows, use `python server.py` instead of raw `uvicorn`. It selects the
Selector event loop (avoids `[Errno 22] Invalid argument` with concurrent HTTP
calls) and defaults to port `8001`, matching `apps/web/.env.local`. Run only one
API instance at a time.

Frontend:

```powershell
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3002`.

## Mock Mode First

No credentials are required for the default demo. If `LLM_PROVIDER=openai` is set
but `OPENAI_API_KEY` is missing, the backend automatically uses deterministic mock
agent outputs while still running the real four-round pipeline, local grounding, and
SQLite persistence.

For OpenAI-compatible generation, create `apps/api/.env`:

```text
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
GROUNDING_PROVIDER=local_corpus
```

For GitHub Models or another OpenAI-compatible endpoint, also set:

```text
OPENAI_BASE_URL=https://models.inference.ai.azure.com/v1
```

## Azure and Foundry Upgrade Path

The code keeps grounding behind `GroundingProvider`, so the demo path uses
`LocalCorpusGroundingProvider` and the Foundry path is isolated in
`grounding/foundry_iq.py`.

Set these when a Foundry IQ knowledge base is available:

```text
GROUNDING_PROVIDER=foundry_iq
FOUNDRY_PROJECT_ENDPOINT=
FOUNDRY_MODEL_DEPLOYMENT=
FOUNDRY_IQ_KNOWLEDGE_BASE_ID=
```

The current `FoundryIQGroundingProvider` is a stretch hook that preserves the
interface and fails closed to `ungrounded` when credentials are absent. Populate it
with the Foundry IQ / Azure AI Search agentic retrieval response mapping when the
knowledge base is provisioned.

## Why Adversarial?

Cooperative agent systems can silently compound early mistakes. Agora makes
disagreement a first-class artifact: the Devil's Advocate attacks consensus, the
Empiricist demands citations, the Rationalist audits logic, the Synthesizer tracks
convergence, and the Judge must disclose dissent instead of smoothing it away.
