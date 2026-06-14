# 🏛️ Agora — The Adversarial Deliberation System

> *What if AI agents argued their way to a better truth?*

Agora is a multi-agent adversarial AI debate system. Give it a question → 5 AI agents independently form positions, challenge each other, cite evidence, and produce a verdict with **explicit dissent preserved** — not smoothed away.

Built for the **Microsoft Agents League Hackathon 2026** · Reasoning Agents Track · Powered by **Microsoft Foundry IQ**

---

## The Problem with Cooperative AI Agents

Standard multi-agent systems are *cooperative* — agents pass outputs forward and trust each other blindly. If agent 1 makes a mistake, agents 2, 3, 4, and 5 build on that mistake. Errors **compound silently**.

**Agora breaks this pattern.**

Every agent has an adversarial epistemic identity. The Devil's Advocate is *required* to attack consensus. The Empiricist *rejects* uncited claims. The Judge is *required* to publish dissent — not smooth it away.

**Disagreement is a first-class artifact. Uncertainty is a feature, not a bug.**

---

## 🤖 The 5 Agents

| Agent | Role |
|-------|------|
| 🔬 **Empiricist** | Trusts only evidence. Demands citations for every factual claim. Flags anything uncited. |
| 🧠 **Rationalist** | Audits logical consistency. Hunts contradictions, fallacies, and circular reasoning. |
| 😈 **Devil's Advocate** | Attacks the emerging consensus. The system's built-in red team. Never softens a challenge. |
| 🔮 **Synthesizer** | Tracks convergence across agents. Publicly revises its own position if stronger arguments emerge. |
| ⚖️ **Judge** | Issues the final verdict with agreement ratio. Must explicitly disclose every surviving dissent. |

---

## ⚙️ The 4-Round Debate Pipeline

```
Round 1 → FORMATION    Each agent independently forms a position (no communication)
Round 2 → CHALLENGE    Agents adversarially challenge each other's claims
Round 3 → GROUNDING    Surviving claims are fact-checked against a knowledge base  
Round 4 → VERDICT      Judge issues consensus + agreement ratio + explicit dissent
```

All events stream **live** to the frontend via WebSocket.

---

## 🏗️ Architecture

```
apps/web  (Next.js 15 + TypeScript + Tailwind CSS)
  QuestionForm → RoundTracker → AgentCards → DebateTrace → VerdictCard
          |
          | WebSocket  ws://localhost:8001/ws/deliberate
          v
apps/api  (FastAPI + Python 3.12)
  agents/personas.py          → 5 adversarial agent system prompts
  orchestration/rounds.py     → 4-round pipeline orchestrator
  grounding/local_corpus.py   → TF-IDF semantic search over Markdown KB
  grounding/foundry_iq.py     → Microsoft Foundry IQ hook (upgrade path)
  storage/db.py               → SQLite session replay store
```

---

## 🎨 UI Highlights

- **Deep space black** background (`#080B14`) with animated fractal noise texture
- **Violet-to-cyan** accent theme with smooth glows
- **Glassmorphic agent cards** with individual left-border accent colors per agent identity
- **SVG consensus circle** showing live agreement ratio
- **Real-time debate trace feed** with color-coded challenge badges
- **Collapsible dissent panel** — dissent is never hidden, always surfaced

---

## 🚀 Quick Start

### Backend

```bash
cd apps/api
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
python server.py
```

> **Windows note:** Use `python server.py` instead of raw `uvicorn`. It selects the Selector event loop (avoids `[Errno 22]` with concurrent HTTP calls) and defaults to port `8001`.

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3002`

---

## 🔑 Environment Variables

Create `apps/api/.env`:

### With Groq (recommended — fastest inference)

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=gsk_your_groq_key_here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-8b-instant
GROUNDING_PROVIDER=local_corpus
```

### With OpenAI

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_openai_key_here
OPENAI_MODEL=gpt-4o-mini
GROUNDING_PROVIDER=local_corpus
```

### Mock Mode (no credentials needed)

If `OPENAI_API_KEY` is missing, the backend automatically uses deterministic mock outputs while still running the real 4-round pipeline, local grounding, and SQLite persistence.

---

## ☁️ Microsoft Foundry IQ Upgrade Path

The grounding system sits behind a `GroundingProvider` interface. The demo uses `LocalCorpusGroundingProvider`. The Foundry IQ path is isolated in `grounding/foundry_iq.py`.

Set these to activate Foundry IQ:

```env
GROUNDING_PROVIDER=foundry_iq
FOUNDRY_PROJECT_ENDPOINT=https://your-project.api.azureml.ms
FOUNDRY_MODEL_DEPLOYMENT=your-deployment-name
FOUNDRY_IQ_KNOWLEDGE_BASE_ID=your-kb-id
```

---

## 🌐 Deployment

### Backend → Render

| Setting | Value |
|---------|-------|
| Root Directory | `apps/api` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

Add all environment variables from the `.env` section above in the Render dashboard.

> **SQLite note:** Session history is ephemeral on Render's free tier. Mount a Persistent Disk at `/apps/api/storage` or swap `db.py` to PostgreSQL to persist sessions across restarts.

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Framework | Next.js (auto-detected) |
| `NEXT_PUBLIC_API_WS_URL` | `wss://your-backend.onrender.com/ws/deliberate` |

---

## 🧪 Demo Question

```
Should this patient be started on metformin or insulin?

Patient context: Type 2 diabetes, eGFR 52 (reduced kidney function), no prior medication.
```

The local clinical corpus is designed so the **majority answer (metformin) is grounded** by first-line therapy guidelines, but the **Devil's Advocate's renal-function caveat survives as a cited dissent** — exactly as Agora is meant to work.

**Expected verdict:** Moderate (80%) — conditional metformin with renal-aware dosing. Dissent: insulin as alternative if monitoring burden is too high.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12 |
| Transport | WebSocket (real-time streaming) |
| LLM | Groq llama-3.1-8b-instant / OpenAI-compatible |
| Grounding | Local Markdown corpus + Microsoft Foundry IQ hook |
| Storage | SQLite (session replay) |

---

## 💡 Why Adversarial?

Cooperative agent systems silently compound early mistakes. Agora makes disagreement a first-class artifact:

- The **Devil's Advocate** attacks consensus by design
- The **Empiricist** rejects any claim without a citation
- The **Rationalist** audits logical validity, not just content
- The **Synthesizer** openly revises its position under pressure
- The **Judge** must disclose dissent — smoothing it away is not allowed

The result: an output you can actually interrogate. Not "the AI says X" — but "4 of 5 agents agree on X, and here is exactly what the fifth agent still disputes, and why."

---

*Built by Rohan · MCA Year 1, KLE Technological University · Agents League Hackathon 2026*