export type AgentName =
  | "Empiricist"
  | "Rationalist"
  | "Devils Advocate"
  | "Synthesizer"
  | "Judge";

export type Position = {
  agent: AgentName;
  claim: string;
  reasoning: string;
  cited_flags: Array<{ claim: string; status: "cited" | "uncited"; error?: boolean }>;
  devils_advocate_mode: boolean;
  revising: boolean;
};

export type Challenge = {
  agent: AgentName;
  target_agent: AgentName;
  target_claim: string;
  challenge_type:
    | "missing-citation"
    | "logical-contradiction"
    | "counter-position"
    | "convergence-note";
  content: string;
};

export type Citation = {
  source: string;
  relevance: string;
  url?: string | null;
};

export type GroundingResult = {
  claim: string;
  status: "grounded" | "ungrounded" | "contradicted";
  citations: Citation[];
};

export type DissentEntry = {
  agent: AgentName;
  claim: string;
  citation_ref?: string | null;
};

export type DebateTrace = {
  rounds: number;
  exchanges: number;
  claims_challenged: number;
  claims_revised: number;
};

export type Verdict = {
  verdict_summary: string;
  agreement_ratio: number;
  dissent: DissentEntry[];
  citations: Citation[];
  confidence_label: string;
  debate_trace: DebateTrace;
};

export type TimelineItem =
  | { id: string; time: string; type: "challenge"; data: Challenge }
  | { id: string; time: string; type: "grounding_result"; data: GroundingResult }
  | { id: string; time: string; type: "error"; data: { message: string } };

export type DeliberationState = {
  positions: Partial<Record<AgentName, Position>>;
  challenges: Challenge[];
  grounding: Record<string, GroundingResult>;
  verdict: Verdict | null;
  currentRound: number;
  status: "idle" | "running" | "done" | "error";
  timeline: TimelineItem[];
  sessionId?: string;
  error?: string;
};
