import type { AgentName, Position } from "@/lib/types";

type AgentCardProps = {
  name: AgentName;
  position?: Position;
  isActive: boolean;
};

/* ── agent identity maps ────────────────────────────────────────────── */

const ACCENT_COLOR: Record<AgentName, string> = {
  Empiricist: "#06B6D4",
  Rationalist: "#7C3AED",
  "Devils Advocate": "#EF4444",
  Synthesizer: "#10B981",
  Judge: "#F59E0B",
};

const ICON: Record<AgentName, string> = {
  Empiricist: "🔬",
  Rationalist: "🧠",
  "Devils Advocate": "😈",
  Synthesizer: "⚗️",
  Judge: "⚖️",
};

/* ── status helpers ─────────────────────────────────────────────────── */

function getStatus(isActive: boolean, position?: Position) {
  if (position) return "Positioned" as const;
  if (isActive) return "Thinking" as const;
  return "Queued" as const;
}

const STATUS_BADGE_CLASSES: Record<
  "Queued" | "Thinking" | "Positioned",
  string
> = {
  Queued: "bg-zinc-500/20 text-zinc-400",
  Thinking: "bg-yellow-500/20 text-yellow-300 animate-pulse-slow",
  Positioned: "bg-emerald-500/20 text-emerald-300",
};

/* ── shimmer skeleton blocks ────────────────────────────────────────── */

function ShimmerSkeleton() {
  return (
    <div className="mt-5 space-y-3">
      <div className="shimmer-bg animate-shimmer h-4 w-4/5 rounded-md" />
      <div className="shimmer-bg animate-shimmer h-4 w-3/5 rounded-md" />
      <div className="shimmer-bg animate-shimmer mt-4 h-3 w-full rounded-md" />
      <div className="shimmer-bg animate-shimmer h-3 w-5/6 rounded-md" />
      <div className="shimmer-bg animate-shimmer h-3 w-2/3 rounded-md" />
      <div className="mt-5 flex gap-2">
        <div className="shimmer-bg animate-shimmer h-5 w-16 rounded-full" />
        <div className="shimmer-bg animate-shimmer h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────── */

export default function AgentCard({ name, position, isActive }: AgentCardProps) {
  const accent = ACCENT_COLOR[name];
  const icon = ICON[name];
  const status = getStatus(isActive, position);
  const isThinking = status === "Thinking";

  return (
    <div
      className={`
        group relative min-h-[260px] rounded-xl
        bg-white/5 border border-white/10
        p-5 transition-all duration-200 ease-out
        hover:-translate-y-0.5
        hover:shadow-lg hover:shadow-black/40
        ${isThinking ? "animate-glow-pulse" : ""}
      `}
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderLeft: `3px solid ${accent}`,
        ...(isThinking
          ? ({ "--glow-color": `${accent}33` } as React.CSSProperties)
          : {}),
      }}
    >
      {/* ── subtle top-edge highlight ────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl opacity-40"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`,
        }}
      />

      {/* ── header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm leading-none w-5 h-5 flex items-center justify-center" role="img" aria-label={name}>
            <span style={{ fontSize: 20 }}>{icon}</span>
          </span>
          <h3
            className="text-sm font-bold uppercase tracking-widest text-white"
            style={{ textShadow: `0 0 20px ${accent}44` }}
          >
            {name}
          </h3>
        </div>
        <span
          className={`
            rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider
            ${STATUS_BADGE_CLASSES[status]}
          `}
        >
          {status}
        </span>
      </div>

      {/* ── content area ─────────────────────────────────────────── */}
      {position ? (
        <div className="animate-fade-in mt-5">
          {/* claim */}
          <p className="text-[13px] font-medium leading-relaxed text-zinc-100">
            {position.claim}
          </p>

          {/* reasoning */}
          <p className="mt-3 text-xs leading-relaxed text-zinc-400">
            {position.reasoning}
          </p>

          {/* meta badges */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {position.devils_advocate_mode && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/[.15] px-2.5 py-0.5 text-[10px] font-medium text-red-300">
                <span className="text-[9px]">🎭</span> Red Team
              </span>
            )}
            {position.revising && (
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/[.15] px-2.5 py-0.5 text-[10px] font-medium text-yellow-300">
                <span className="text-[9px]">↻</span> Revising
              </span>
            )}
          </div>

          {/* cited flags */}
          {position.cited_flags && position.cited_flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {position.cited_flags.map((flag, i) => (
                <span
                  key={`${flag.claim}-${flag.status}-${i}`}
                  className={`
                    inline-flex items-center gap-1 rounded-full px-2.5 py-0.5
                    text-[10px] font-medium border
                    ${
                      flag.status === "cited"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border-red-500/30"
                    }
                  `}
                >
                  <span className="text-[8px]">
                    {flag.status === "cited" ? "✓" : "✗"}
                  </span>
                  {flag.claim}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : isThinking ? (
        <div className="mt-4 space-y-2">
          <div className="shimmer-bar" />
          <div className="shimmer-bar" />
          <div className="shimmer-bar" />
        </div>
      ) : (
        /* queued – idle state */
        <div className="mt-4 py-4">
          <p className="text-sm text-zinc-600">Waiting for independent position...</p>
        </div>
      )}
    </div>
  );
}
