"use client";

import { useState, FormEvent } from "react";
import { Play, RotateCcw, Loader2 } from "lucide-react";

const DEMO_QUESTION =
  "Should this patient be started on metformin or insulin?";
const DEMO_CONTEXT =
  "Patient context: Type 2 diabetes, eGFR 52 (reduced kidney function), no prior medication.";

type QuestionFormProps = {
  onStart: (question: string, context?: string) => void;
  onReset: () => void;
  status: "idle" | "running" | "done" | "error";
};

export default function QuestionForm({
  onStart,
  onReset,
  status,
}: QuestionFormProps) {
  const [question, setQuestion] = useState(DEMO_QUESTION);
  const [context, setContext] = useState(DEMO_CONTEXT);

  const isRunning = status === "running";
  const canSubmit = question.trim().length > 0 && !isRunning;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onStart(question.trim(), context.trim() || undefined);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6"
      style={{ backdropFilter: "blur(16px)" }}
    >
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {/* Left – Brand */}
        <div>
          <div className="inline-flex items-center gap-2 text-2xl font-black uppercase tracking-tight text-white">
            <span>⚡</span>
            <span>AGORA</span>
          </div>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-zinc-500">
            Adversarial Intelligence System
          </p>
        </div>

        {/* Right – Actions */}
        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Start Deliberation */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              boxShadow:
                "0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(6,182,212,0.15)",
              ...(canSubmit
                ? {}
                : { filter: "brightness(0.7)" }),
            }}
            onMouseEnter={(e) => {
              if (!canSubmit) return;
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter = "brightness(1)";
            }}
            onMouseDown={(e) => {
              if (!canSubmit) return;
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              if (!canSubmit) return;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? "Running…" : "Start Deliberation"}
          </button>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="mb-5 mt-4 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* ── INPUT SECTION ──────────────────────────────────────── */}
      <div>
        {/* Query */}
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400">
          Query
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter a question for adversarial deliberation..."
          rows={3}
          className="w-full resize-y rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-zinc-100 placeholder:text-zinc-600 transition duration-150 focus:border-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          style={{
            backdropFilter: "blur(8px)",
            minHeight: "100px",
          }}
        />

        {/* Context */}
        <label className="mb-2 mt-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400">
          Context
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Optional background context..."
          rows={2}
          className="w-full resize-y rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-zinc-100 placeholder:text-zinc-600 transition duration-150 focus:border-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          style={{
            backdropFilter: "blur(8px)",
            minHeight: "80px",
          }}
        />
      </div>
    </form>
  );
}
