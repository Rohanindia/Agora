"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, FileText, Scale } from "lucide-react";
import type { AgentName, Verdict } from "@/lib/types";

/* ─── agent color map ─────────────────────────────────────────────── */
const AGENT_COLORS: Record<AgentName, string> = {
  Empiricist: "#06B6D4",
  Rationalist: "#7C3AED",
  "Devils Advocate": "#EF4444",
  Synthesizer: "#10B981",
  Judge: "#F59E0B",
};

const AGENTS: AgentName[] = [
  "Empiricist",
  "Rationalist",
  "Devils Advocate",
  "Synthesizer",
  "Judge",
];

/* ─── progress ring color ─────────────────────────────────────────── */
function ringColor(ratio: number): string {
  if (ratio > 0.6) return "#34D399"; // emerald-400
  if (ratio >= 0.4) return "#FACC15"; // yellow-400
  return "#F87171"; // red-400
}

/* ─── component ───────────────────────────────────────────────────── */
type VerdictCardProps = { verdict: Verdict | null };

export default function VerdictCard({ verdict }: VerdictCardProps) {
  const [dissentOpen, setDissentOpen] = useState(false);
  const [animatedRatio, setAnimatedRatio] = useState(0);
  const [revealed, setRevealed] = useState(false);

  /* Animate the ring on mount / verdict change */
  useEffect(() => {
    if (!verdict) {
      setAnimatedRatio(0);
      setRevealed(false);
      return;
    }
    // kick reveal animation
    const revealTimer = requestAnimationFrame(() => setRevealed(true));
    // delay the ring fill so it plays after the card fades in
    const ringTimer = setTimeout(
      () => setAnimatedRatio(verdict.agreement_ratio),
      350,
    );
    return () => {
      cancelAnimationFrame(revealTimer);
      clearTimeout(ringTimer);
    };
  }, [verdict]);

  /* ── empty state ─────────────────────────────────────────────────── */
  if (!verdict) {
    return (
      <section
        className="rounded-xl border border-white/10 bg-white/5 p-5"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "2px solid #F59E0B",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Verdict
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 py-4">
          <Scale size={36} className="text-amber-400/60" />
          <p className="text-sm text-zinc-500">
            Awaiting deliberation — a verdict will appear once all agents reach
            consensus or finalize their positions.
          </p>
        </div>
      </section>
    );
  }

  /* ── derived values ──────────────────────────────────────────────── */
  const pct = Math.round(verdict.agreement_ratio * 100);
  const agreeCount = Math.round(verdict.agreement_ratio * 5);
  const RADIUS = 36;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeOffset = CIRCUMFERENCE * (1 - animatedRatio);
  const color = ringColor(verdict.agreement_ratio);

  const dissentAgents = new Set(verdict.dissent.map((d) => d.agent));

  return (
    <section
      className={`rounded-xl border border-white/10 bg-white/5 p-5 transition-all duration-600 ease-out ${
        revealed
          ? "scale-100 opacity-100"
          : "scale-[0.95] opacity-0"
      }`}
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "2px solid #F59E0B",
      }}
    >
      {/* ── header ──────────────────────────────────────────────────── */}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
        Verdict
      </p>

      {/* ── confidence ring + summary ───────────────────────────────── */}
      <div className="mt-5 flex items-start gap-5">
        {/* SVG ring */}
        <div className="shrink-0">
          <svg
            width={100}
            height={100}
            viewBox="0 0 100 100"
            className="drop-shadow-[0_0_14px_rgba(245,158,11,0.15)]"
          >
            {/* bg ring */}
            <circle
              cx={50}
              cy={50}
              r={RADIUS}
              fill="none"
              stroke="#27272a"
              strokeWidth={6}
            />
            {/* progress ring */}
            <circle
              cx={50}
              cy={50}
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 50 50)"
              style={{
                transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",
              }}
            />
            {/* percentage */}
            <text
              x={50}
              y={46}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[22px] font-bold"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {pct}%
            </text>
            {/* label */}
            <text
              x={50}
              y={64}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-zinc-400 text-[8px]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {verdict.confidence_label}
            </text>
          </svg>
        </div>

        {/* summary text */}
        <p className="mt-1 text-base leading-7 text-zinc-200">
          {verdict.verdict_summary}
        </p>
      </div>

      {/* ── agent consensus dots ────────────────────────────────────── */}
      <div className="mt-5 flex items-center gap-2">
        <span className="mr-1 text-[10px] uppercase tracking-wider text-zinc-500">
          Agents
        </span>
        {AGENTS.map((name, i) => {
          const agrees = i < agreeCount && !dissentAgents.has(name);
          const agentColor = AGENT_COLORS[name];
          return (
            <span
              key={name}
              title={name}
              className="relative flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300"
              style={
                agrees
                  ? { backgroundColor: agentColor }
                  : { border: `1.5px solid ${agentColor}` }
              }
            >
              {!agrees && (
                <svg
                  width={8}
                  height={8}
                  viewBox="0 0 8 8"
                  className="opacity-70"
                >
                  <line
                    x1={1}
                    y1={1}
                    x2={7}
                    y2={7}
                    stroke={agentColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                  <line
                    x1={7}
                    y1={1}
                    x2={1}
                    y2={7}
                    stroke={agentColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
          );
        })}
        <span className="ml-auto text-xs text-zinc-500">
          {agreeCount}/5 agree
        </span>
      </div>

      {/* ── dissent section (collapsible) ───────────────────────────── */}
      {verdict.dissent.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setDissentOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Explicit Dissent
            </span>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-red-400">
              {verdict.dissent.length}
            </span>
            <span className="ml-auto text-zinc-500">
              {dissentOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </span>
          </button>

          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: dissentOpen ? `${verdict.dissent.length * 120}px` : "0",
              opacity: dissentOpen ? 1 : 0,
            }}
          >
            <div className="mt-2 space-y-2">
              {verdict.dissent.map((entry, idx) => (
                <div
                  key={`${entry.agent}-${idx}`}
                  className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5 text-sm leading-6"
                >
                  <span
                    className="font-semibold"
                    style={{ color: AGENT_COLORS[entry.agent] }}
                  >
                    {entry.agent}
                  </span>
                  <span className="mx-1.5 text-zinc-600">—</span>
                  <span className="text-zinc-300">{entry.claim}</span>
                  {entry.citation_ref && (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      ↳ {entry.citation_ref}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── debate stats (2×2 grid) ─────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <StatBox label="Rounds" value={verdict.debate_trace.rounds} />
        <StatBox label="Exchanges" value={verdict.debate_trace.exchanges} />
        <StatBox
          label="Challenged"
          value={verdict.debate_trace.claims_challenged}
        />
        <StatBox label="Revised" value={verdict.debate_trace.claims_revised} />
      </div>

      {/* ── citations rail ──────────────────────────────────────────── */}
      {verdict.citations.length > 0 && (
        <div className="mt-5">
          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
            <FileText size={12} />
            Sources
          </p>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {verdict.citations.map((c, i) => (
              <a
                key={`${c.source}-${i}`}
                href={c.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex min-w-[220px] shrink-0 snap-start flex-col rounded-lg border border-white/5 bg-white/[0.04] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.07] ${
                  c.url ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 group-hover:text-white">
                  <FileText size={12} className="shrink-0 text-amber-400/70" />
                  {c.source}
                </span>
                <span className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-zinc-500">
                  {c.relevance}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── stat mini-card ──────────────────────────────────────────────── */
function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 p-3">
      <div
        className="text-2xl font-bold"
        style={{
          backgroundImage: "linear-gradient(to right, #A78BFA, #22D3EE)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </div>
  );
}
