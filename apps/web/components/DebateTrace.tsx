"use client";

import { AlertTriangle, Quote, SearchCheck, Radio } from "lucide-react";
import type { TimelineItem, AgentName, Challenge, GroundingResult } from "@/lib/types";

/* ─── props ─── */
type DebateTraceProps = {
  items: TimelineItem[];
};

/* ─── agent color map ─── */
const agentDot: Record<AgentName, string> = {
  Empiricist: "bg-cyan-400",
  Rationalist: "bg-violet-400",
  "Devils Advocate": "bg-red-400",
  Synthesizer: "bg-emerald-400",
  Judge: "bg-amber-400",
};

const agentChip: Record<AgentName, string> = {
  Empiricist: "bg-cyan-500/15 text-cyan-300",
  Rationalist: "bg-violet-500/15 text-violet-300",
  "Devils Advocate": "bg-red-500/15 text-red-300",
  Synthesizer: "bg-emerald-500/15 text-emerald-300",
  Judge: "bg-amber-500/15 text-amber-300",
};

/* ─── challenge type badge ─── */
const challengeBadge: Record<Challenge["challenge_type"], string> = {
  "missing-citation": "bg-red-500/15 text-red-300",
  "logical-contradiction": "bg-amber-500/15 text-amber-300",
  "counter-position": "bg-violet-500/15 text-violet-300",
  "convergence-note": "bg-emerald-500/15 text-emerald-300",
};

const challengeLabel: Record<Challenge["challenge_type"], string> = {
  "missing-citation": "Missing Citation",
  "logical-contradiction": "Logical Contradiction",
  "counter-position": "Counter Position",
  "convergence-note": "Convergence Note",
};

/* ─── grounding status badge ─── */
const groundingBadge: Record<GroundingResult["status"], string> = {
  grounded: "bg-emerald-500/15 text-emerald-300",
  ungrounded: "bg-red-500/15 text-red-300",
  contradicted: "bg-amber-500/15 text-amber-300",
};

const groundingLabel: Record<GroundingResult["status"], string> = {
  grounded: "Grounded",
  ungrounded: "Ungrounded",
  contradicted: "Contradicted",
};

/* ─── main component ─── */
export default function DebateTrace({ items }: DebateTraceProps) {
  return (
    <section
      className="rounded-xl border border-white/10 bg-white/5 p-5"
      style={{ backdropFilter: "blur(16px)" }}
    >
      {/* ─ header ─ */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
          Live Feed
        </h2>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/20 px-2.5 py-0.5 text-xs text-violet-300">
          {items.length}
        </span>
      </div>

      {/* ─ scrollable feed ─ */}
      <div
        className={
          "max-h-[500px] overflow-y-auto pr-1 " +
          "[&::-webkit-scrollbar]:w-[5px] " +
          "[&::-webkit-scrollbar-track]:bg-transparent " +
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 " +
          "[&::-webkit-scrollbar-thumb:hover]:bg-white/20"
        }
      >
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-0">
            {items.map((item) => (
              <li key={item.id} className="animate-slide-up">
                <FeedItem item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─── empty state ─── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* scanning radar animation */}
      <div className="relative mb-4 flex h-12 w-12 items-center justify-center">
        {/* outer ping ring */}
        <span className="absolute inset-0 animate-ring-ping rounded-full border border-violet-500/40" />
        {/* second ring with delay */}
        <span
          className="absolute inset-0 rounded-full border border-violet-500/30"
          style={{ animation: "ring-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s" }}
        />
        {/* center icon */}
        <Radio size={20} className="animate-pulse-slow text-violet-400" />
      </div>
      <p className="text-sm font-medium text-zinc-500">Awaiting signals…</p>
      <p className="mt-1 text-xs text-zinc-600">
        Challenges and grounding results will stream here
      </p>
    </div>
  );
}

/* ─── feed item dispatcher ─── */
function FeedItem({ item }: { item: TimelineItem }) {
  if (item.type === "challenge") return <ChallengeItem item={item} />;
  if (item.type === "grounding_result") return <GroundingItem item={item} />;
  return <ErrorItem item={item} />;
}

/* ─── challenge event ─── */
function ChallengeItem({
  item,
}: {
  item: Extract<TimelineItem, { type: "challenge" }>;
}) {
  const { agent, target_agent, challenge_type, content, target_claim } = item.data;

  return (
    <article className="border-b border-white/5 px-1 py-3 last:border-0">
      <div className="flex items-start gap-3">
        {/* dot */}
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${agentDot[agent]}`}
        />

        <div className="min-w-0 flex-1">
          {/* meta row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <time className="font-mono text-[10px] text-zinc-600">
              {item.time}
            </time>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${agentChip[agent]}`}
            >
              {agent}
            </span>
            <span className="text-[10px] text-zinc-600">→</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${agentChip[target_agent]}`}
            >
              {target_agent}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${challengeBadge[challenge_type]}`}
            >
              {challengeLabel[challenge_type]}
            </span>
          </div>

          {/* action */}
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-300">
            <Quote size={12} className="shrink-0 text-zinc-500" />
            <span className="line-clamp-1 italic text-zinc-500">
              &ldquo;{target_claim}&rdquo;
            </span>
          </div>

          {/* content */}
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            {content}
          </p>
        </div>
      </div>
    </article>
  );
}

/* ─── grounding result event ─── */
function GroundingItem({
  item,
}: {
  item: Extract<TimelineItem, { type: "grounding_result" }>;
}) {
  const { claim, status, citations } = item.data;

  return (
    <article className="border-b border-white/5 px-1 py-3 last:border-0">
      <div className="flex items-start gap-3">
        {/* dot – always emerald for grounding checks */}
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

        <div className="min-w-0 flex-1">
          {/* meta row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <time className="font-mono text-[10px] text-zinc-600">
              {item.time}
            </time>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              <SearchCheck size={10} />
              Grounding Check
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${groundingBadge[status]}`}
            >
              {groundingLabel[status]}
            </span>
            {citations.length > 0 && (
              <span className="text-[10px] text-zinc-600">
                · {citations.length} citation{citations.length !== 1 && "s"}
              </span>
            )}
          </div>

          {/* claim */}
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
            {claim}
          </p>

          {/* citations preview */}
          {citations.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {citations.slice(0, 2).map((c) => (
                <p key={c.source} className="text-xs leading-5 text-zinc-500">
                  <span className="text-zinc-400">{c.source}</span>
                  {c.relevance && <> — {c.relevance}</>}
                </p>
              ))}
              {citations.length > 2 && (
                <p className="text-[10px] text-zinc-600">
                  +{citations.length - 2} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── error event ─── */
function ErrorItem({
  item,
}: {
  item: Extract<TimelineItem, { type: "error" }>;
}) {
  return (
    <article className="border-b border-white/5 px-1 py-3 last:border-0">
      <div className="flex items-start gap-3">
        {/* dot */}
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <time className="font-mono text-[10px] text-zinc-600">
              {item.time}
            </time>
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              <AlertTriangle size={10} />
              Warning
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-amber-200/80">
            {item.data.message}
          </p>
        </div>
      </div>
    </article>
  );
}
