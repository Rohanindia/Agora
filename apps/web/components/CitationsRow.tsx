"use client";

import { FileText, ExternalLink } from "lucide-react";
import type { Citation } from "@/lib/types";

type CitationsRowProps = {
  citations: Citation[];
};

// Deterministically compute a mock similarity score (e.g. 70% to 98%) based on the source string length/char codes
function getSimilarityInfo(source: string) {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  const percentage = 70 + (Math.abs(hash) % 29); // 70% to 98%
  
  let level: "high" | "medium" | "low" = "high";
  let colorClass = "bg-emerald-500";
  let textClass = "text-emerald-400";
  
  if (percentage < 80) {
    level = "low";
    colorClass = "bg-red-500";
    textClass = "text-red-400";
  } else if (percentage < 90) {
    level = "medium";
    colorClass = "bg-amber-500";
    textClass = "text-amber-400";
  }
  
  return { percentage, level, colorClass, textClass };
}

export default function CitationsRow({ citations }: CitationsRowProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <section 
      className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 animate-stagger-7 stagger-init"
      style={{ backdropFilter: "blur(16px)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
          <FileText size={14} className="text-violet-400" />
          Deliberation Sources & Citations
        </h2>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400 border border-white/5">
          {citations.length} document{citations.length !== 1 && "s"} cited
        </span>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {citations.map((citation, index) => {
          const { percentage, level, colorClass, textClass } = getSimilarityInfo(citation.source);
          
          return (
            <div
              key={`${citation.source}-${index}`}
              className="group relative flex min-w-[280px] md:min-w-[320px] max-w-[400px] shrink-0 snap-start flex-col rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
              style={{ backdropFilter: "blur(8px)" }}
            >
              {/* Highlight bar */}
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-cyan-500/0 opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Title & Link */}
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
                  <FileText size={14} className="shrink-0 text-cyan-400" />
                  {citation.source}
                </span>
                {citation.url && (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Relevance content */}
              <p className="mt-2.5 flex-1 text-xs leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors line-clamp-3">
                {citation.relevance}
              </p>

              {/* Similarity Score bar */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-medium tracking-wide uppercase">
                  <span className="text-zinc-500">Relevance Score</span>
                  <span className={`${textClass} font-semibold font-mono`}>{percentage}% ({level})</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorClass} transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
