"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDeliberation } from "@/lib/useDeliberation";
import type { AgentName } from "@/lib/types";

export default function Home() {
  const [question, setQuestion] = useState(
    "Should this patient be started on metformin or insulin?"
  );
  const [context, setContext] = useState(
    "Patient context: Type 2 diabetes, eGFR 52 (reduced kidney function), no prior medication."
  );
  const { state, start, reset } = useDeliberation();

  // Track the question used for the last deliberation
  const lastRunQuestion = useRef<string>("");
  const [isStale, setIsStale] = useState(false);

  // Mark results as stale when the user edits the question after a completed run
  useEffect(() => {
    if (
      (state.status === "done" || state.status === "idle") &&
      state.verdict &&
      lastRunQuestion.current &&
      question !== lastRunQuestion.current
    ) {
      setIsStale(true);
    } else {
      setIsStale(false);
    }
  }, [question, state.status, state.verdict]);

  // Wrapper that records which question was run and clears stale flag
  const handleStart = () => {
    lastRunQuestion.current = question;
    setIsStale(false);
    start(question, context);
  };

  const handleReset = () => {
    lastRunQuestion.current = "";
    setIsStale(false);
    reset();
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        @keyframes orb-drift-1 {
          0%   { transform: translate(0,0) scale(1); opacity: 0.15; }
          50%  { transform: translate(60px,-40px) scale(1.15); opacity: 0.2; }
          100% { transform: translate(30px,-80px) scale(0.9); opacity: 0.12; }
        }
        @keyframes orb-drift-2 {
          0%   { transform: translate(0,0) scale(1); opacity: 0.12; }
          50%  { transform: translate(-50px,30px) scale(1.1); opacity: 0.18; }
          100% { transform: translate(-80px,60px) scale(0.95); opacity: 0.1; }
        }
        @keyframes orb-drift-3 {
          0%   { transform: translate(0,0); opacity: 0.08; }
          100% { transform: translate(40px,40px); opacity: 0.15; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes slide-up-fade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .page-bg {
          min-height: 100vh;
          background: #070A12;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Vercel dot grid texture */
        .page-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 0;
        }

        /* Gradient orbs */
        .orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; filter: blur(80px); }
        .orb-1 {
          width: 600px; height: 600px; top: -200px; left: -200px;
          background: radial-gradient(circle, rgba(109,40,217,0.4) 0%, transparent 70%);
          animation: orb-drift-1 18s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 700px; height: 700px; bottom: -250px; right: -250px;
          background: radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%);
          animation: orb-drift-2 22s ease-in-out infinite alternate;
        }
        .orb-3 {
          width: 400px; height: 400px; top: 40%; left: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%);
          animation: orb-drift-3 14s ease-in-out infinite alternate;
        }

        .content-layer { position: relative; z-index: 1; }

        /* Glass cards — Linear style */
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
        }
        .glass-card-elevated {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
        }

        /* Shimmer skeleton */
        .shimmer-bar {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.03) 0%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.03) 100%);
          background-size: 400px 100%;
          animation: shimmer 1.8s ease infinite;
          border-radius: 6px;
        }

        .event-item { animation: slide-up-fade 0.35s ease forwards; }

        /* Accent left borders */
        .accent-cyan    { border-left: 2px solid #06B6D4 !important; }
        .accent-violet  { border-left: 2px solid #8B5CF6 !important; }
        .accent-red     { border-left: 2px solid #EF4444 !important; }
        .accent-emerald { border-left: 2px solid #10B981 !important; }
        .accent-amber   { border-left: 2px solid #F59E0B !important; }

        /* Glowing CTA button */
        .start-btn {
          background: linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%);
          background-size: 200% 200%;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .start-btn:hover:not(:disabled) {
          background-position: right center;
          transform: scale(1.04);
          box-shadow: 0 0 30px rgba(124,58,237,0.5), 0 0 60px rgba(6,182,212,0.2);
        }
        .start-btn:active:not(:disabled) { transform: scale(0.97); }
        .start-btn:disabled { cursor: not-allowed; }

        /* Inputs */
        .elite-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          color: #fff;
          border-radius: 10px;
          width: 100%;
          padding: 12px 14px;
          font-size: 14px;
          line-height: 1.6;
          transition: border-color 0.2s;
          resize: vertical;
          font-family: inherit;
        }
        .elite-input:focus {
          outline: none;
          border-color: rgba(139,92,246,0.6);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .elite-input::placeholder { color: rgba(255,255,255,0.2); }

        /* Agent card hover */
        .agent-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }
        .agent-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        /* Status badges */
        .badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          padding: 3px 8px; border-radius: 20px; text-transform: uppercase;
        }
        .badge-queued    { background: rgba(255,255,255,0.05);  color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.08); }
        .badge-thinking  { background: rgba(251,191,36,0.15);   color: #FCD34D;               border: 1px solid rgba(251,191,36,0.3); }
        .badge-positioned{ background: rgba(16,185,129,0.15);   color: #34D399;               border: 1px solid rgba(16,185,129,0.3); }

        .elite-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #7C3AED; margin-bottom: 8px; display: block;
        }

        /* Thin scrollbar */
        .thin-scroll::-webkit-scrollbar { width: 4px; }
        .thin-scroll::-webkit-scrollbar-track { background: transparent; }
        .thin-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* Citation cards */
        .citation-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 12px;
          min-width: 240px;
          flex-shrink: 0;
          transition: border-color 0.2s;
        }
        .citation-card:hover { border-color: rgba(139,92,246,0.4); }

        /* Reset button hover */
        .reset-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .reset-btn:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
        }
      `}</style>

      <div className="page-bg">
        {/* Ambient orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div
          className="content-layer"
          style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}
        >
          {/* ═══ HEADER ═══ */}
          <div
            className="glass-card"
            style={{
              padding: "20px 28px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>⚡</span>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "#fff",
                    letterSpacing: "-0.02em",
                  }}
                >
                  AGORA
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Adversarial Intelligence System
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button className="reset-btn" onClick={handleReset} title="Reset">
                ↺
              </button>
              <button
                className="start-btn"
                onClick={handleStart}
                disabled={state.status === "running" || !question.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity:
                    state.status === "running" || !question.trim() ? 0.5 : 1,
                }}
              >
                <span>{state.status === "running" ? "⏳" : "▶"}</span>
                {state.status === "running"
                  ? "Deliberating..."
                  : "Start Deliberation"}
              </button>
            </div>
          </div>

          {/* ═══ QUERY + CONTEXT ═══ */}
          <div
            className="glass-card"
            style={{ padding: "24px 28px", marginBottom: "16px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label className="elite-label">Query</label>
                <textarea
                  className="elite-input"
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question for adversarial deliberation..."
                />
              </div>
              <div>
                <label className="elite-label">Context</label>
                <textarea
                  className="elite-input"
                  rows={3}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add optional patient context, background, or constraints..."
                />
              </div>
            </div>

            {/* Stale results warning */}
            {isStale && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: "#FCD34D",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span>
                  <span style={{ fontWeight: 700, marginRight: 6 }}>⚠ Stale results.</span>
                  The verdict below is from your previous question. Press
                  {" "}<strong>Start Deliberation</strong> to run a new one.
                </span>
                <button
                  onClick={handleStart}
                  disabled={!question.trim()}
                  style={{
                    flexShrink: 0,
                    padding: "5px 14px",
                    borderRadius: "6px",
                    background: "rgba(245,158,11,0.2)",
                    border: "1px solid rgba(245,158,11,0.4)",
                    color: "#FCD34D",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Run New ▶
                </button>
              </div>
            )}

            {/* Error banner */}
            {state.status === "error" && state.error && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#FCA5A5",
                  fontSize: "13px",
                }}
              >
                ⚠ {state.error}
              </div>
            )}
          </div>

          {/* ═══ ROUND STEPPER ═══ */}
          <div
            className="glass-card"
            style={{ padding: "20px 32px", marginBottom: "20px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {(["Formation", "Challenge", "Grounding", "Verdict"] as const).map(
                (step, i) => (
                  <React.Fragment key={step}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: "800",
                          transition: "all 0.5s ease",
                          background:
                            state.currentRound > i
                              ? "linear-gradient(135deg, #06B6D4, #3B82F6)"
                              : state.currentRound === i + 1
                              ? "linear-gradient(135deg, #7C3AED, #8B5CF6)"
                              : "rgba(255,255,255,0.04)",
                          border:
                            state.currentRound > i
                              ? "none"
                              : state.currentRound === i + 1
                              ? "1px solid rgba(139,92,246,0.6)"
                              : "1px solid rgba(255,255,255,0.08)",
                          color:
                            state.currentRound > i
                              ? "#000"
                              : state.currentRound === i + 1
                              ? "#fff"
                              : "rgba(255,255,255,0.2)",
                          boxShadow:
                            state.currentRound === i + 1
                              ? "0 0 20px rgba(124,58,237,0.5)"
                              : "none",
                        }}
                      >
                        {state.currentRound > i ? "✓" : i + 1}
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color:
                            state.currentRound > i
                              ? "#06B6D4"
                              : state.currentRound === i + 1
                              ? "#8B5CF6"
                              : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {step}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        style={{
                          flex: 1,
                          height: "1px",
                          margin: "0 12px",
                          background: "rgba(255,255,255,0.06)",
                          position: "relative",
                          marginBottom: "20px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #7C3AED, #06B6D4)",
                            width: state.currentRound > i ? "100%" : "0%",
                            transition: "width 1.2s ease",
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                )
              )}
            </div>
          </div>

          {/* ═══ AGENT CARDS GRID ═══ */}
          {(() => {
            const agents: Array<{
              key: AgentName;
              label: string;
              icon: string;
              accent: string;
              color: string;
            }> = [
              {
                key: "Empiricist",
                label: "EMPIRICIST",
                icon: "🔬",
                accent: "accent-cyan",
                color: "#06B6D4",
              },
              {
                key: "Rationalist",
                label: "RATIONALIST",
                icon: "🧠",
                accent: "accent-violet",
                color: "#8B5CF6",
              },
              {
                key: "Devils Advocate",
                label: "DEVIL'S ADVOCATE",
                icon: "😈",
                accent: "accent-red",
                color: "#EF4444",
              },
              {
                key: "Synthesizer",
                label: "SYNTHESIZER",
                icon: "🔮",
                accent: "accent-emerald",
                color: "#10B981",
              },
              {
                key: "Judge",
                label: "JUDGE",
                icon: "⚖️",
                accent: "accent-amber",
                color: "#F59E0B",
              },
            ];

            const getStatus = (agentKey: AgentName) => {
              const pos = state.positions[agentKey];
              if (!pos)
                return state.status === "running" && state.currentRound === 1
                  ? "thinking"
                  : "queued";
              return "positioned";
            };

            const AgentCard = ({
              agent,
            }: {
              agent: (typeof agents)[number];
            }) => {
              const status = getStatus(agent.key);
              const pos = state.positions[agent.key];
              return (
                <div
                  className={`glass-card agent-card ${agent.accent}`}
                  style={{
                    padding: "18px",
                    minHeight: "160px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>{agent.icon}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          color: "#fff",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {agent.label}
                      </span>
                    </div>
                    <span
                      className={`badge ${
                        status === "queued"
                          ? "badge-queued"
                          : status === "thinking"
                          ? "badge-thinking"
                          : "badge-positioned"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    {status === "queued" && (
                      <p
                        style={{
                          color: "rgba(255,255,255,0.2)",
                          fontSize: "12px",
                          margin: 0,
                        }}
                      >
                        Awaiting activation...
                      </p>
                    )}
                    {status === "thinking" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div
                          className="shimmer-bar"
                          style={{ height: "10px", width: "90%" }}
                        />
                        <div
                          className="shimmer-bar"
                          style={{ height: "10px", width: "70%" }}
                        />
                        <div
                          className="shimmer-bar"
                          style={{ height: "10px", width: "80%" }}
                        />
                      </div>
                    )}
                    {status === "positioned" && pos && (
                      <div style={{ animation: "fade-in 0.5s ease" }}>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.8)",
                            fontSize: "12px",
                            lineHeight: "1.6",
                            margin: "0 0 8px 0",
                          }}
                        >
                          {pos.claim}
                        </p>
                        {pos.cited_flags && pos.cited_flags.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            {pos.cited_flags
                              .filter((f) => f.status === "cited")
                              .map((f, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "rgba(16,185,129,0.15)",
                                    color: "#34D399",
                                    border: "1px solid rgba(16,185,129,0.2)",
                                  }}
                                >
                                  cited
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  {agents.slice(0, 3).map((a) => (
                    <AgentCard key={a.key} agent={a} />
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                    maxWidth: "800px",
                    margin: "0 auto",
                  }}
                >
                  {agents.slice(3).map((a) => (
                    <AgentCard key={a.key} agent={a} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ═══ LIVE FEED + VERDICT ═══ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            {/* Live Feed */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                maxHeight: "420px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                  }}
                >
                  Live Feed
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    background: "rgba(124,58,237,0.2)",
                    color: "#A78BFA",
                    border: "1px solid rgba(124,58,237,0.3)",
                    padding: "2px 8px",
                    borderRadius: "20px",
                  }}
                >
                  {state.timeline.length}
                </span>
              </div>

              <div
                className="thin-scroll"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {state.timeline.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: "12px",
                      padding: "40px 0",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        color: "rgba(255,255,255,0.2)",
                      }}
                    >
                      📡
                    </div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: "12px",
                        margin: 0,
                      }}
                    >
                      Awaiting signals...
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.1)",
                        fontSize: "11px",
                        margin: 0,
                      }}
                    >
                      Events stream here during deliberation
                    </p>
                  </div>
                ) : (
                  state.timeline.map((event) => {
                    const agentColors: Record<string, string> = {
                      Empiricist: "#06B6D4",
                      Rationalist: "#8B5CF6",
                      "Devils Advocate": "#EF4444",
                      Synthesizer: "#10B981",
                      Judge: "#F59E0B",
                    };

                    let agentKey = "";
                    let message: string = event.type;

                    if (event.type === "challenge") {
                      agentKey = event.data.agent;
                      message = event.data.content;
                    } else if (event.type === "grounding_result") {
                      agentKey = "";
                      message = event.data.claim;
                    } else if (event.type === "error") {
                      agentKey = "";
                      message = event.data.message;
                    }

                    const color = agentColors[agentKey] || "#6B7280";

                    return (
                      <div
                        key={event.id}
                        className="event-item"
                        style={{
                          display: "flex",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: color,
                            marginTop: "5px",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                              marginBottom: "4px",
                            }}
                          >
                            {agentKey && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  color,
                                  background: `${color}18`,
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {agentKey}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "10px",
                                color: "rgba(255,255,255,0.25)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {event.type === "challenge"
                                ? event.data.challenge_type
                                : event.type}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "rgba(255,255,255,0.2)",
                              }}
                            >
                              {event.time}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.5)",
                              margin: 0,
                              lineHeight: "1.5",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            } as React.CSSProperties}
                          >
                            {message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Verdict */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                border: "1px solid rgba(245,158,11,0.15)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "0.15em",
                    color: "#F59E0B",
                    textTransform: "uppercase",
                  }}
                >
                  Verdict
                </span>
              </div>

              {!state.verdict ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "300px",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      border: "1px solid rgba(245,158,11,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                    }}
                  >
                    ⚖️
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      fontSize: "13px",
                      textAlign: "center",
                      margin: 0,
                      lineHeight: "1.6",
                    }}
                  >
                    Verdict appears after
                    <br />
                    all 4 rounds complete
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    animation: "fade-in 0.6s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* Agreement ratio */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(16,185,129,0.15)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: "900",
                        color: "#34D399",
                      }}
                    >
                      {Math.round((state.verdict.agreement_ratio ?? 0) * 100)}%
                    </span>
                    <span
                      style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}
                    >
                      agent agreement
                    </span>
                  </div>

                  {/* Summary */}
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.8)",
                      lineHeight: "1.7",
                      margin: 0,
                    }}
                  >
                    {state.verdict.verdict_summary}
                  </p>

                  {/* Confidence label */}
                  {state.verdict.confidence_label && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          fontWeight: "700",
                        }}
                      >
                        Confidence
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#A78BFA",
                          fontWeight: "700",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          background: "rgba(139,92,246,0.15)",
                          border: "1px solid rgba(139,92,246,0.25)",
                        }}
                      >
                        {state.verdict.confidence_label}
                      </span>
                    </div>
                  )}

                  {/* Agreement bar */}
                  <div>
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "4px",
                          background:
                            "linear-gradient(90deg, #7C3AED, #06B6D4)",
                          width: `${Math.round(
                            (state.verdict.agreement_ratio ?? 0) * 100
                          )}%`,
                          transition: "width 1.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Debate trace */}
                  {state.verdict.debate_trace && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      {[
                        {
                          label: "Rounds",
                          value: state.verdict.debate_trace.rounds,
                        },
                        {
                          label: "Exchanges",
                          value: state.verdict.debate_trace.exchanges,
                        },
                        {
                          label: "Challenged",
                          value: state.verdict.debate_trace.claims_challenged,
                        },
                        {
                          label: "Revised",
                          value: state.verdict.debate_trace.claims_revised,
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "800",
                              color: "#fff",
                            }}
                          >
                            {value ?? "—"}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "rgba(255,255,255,0.3)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              fontWeight: "600",
                            }}
                          >
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dissent */}
                  {state.verdict.dissent && state.verdict.dissent.length > 0 && (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.12)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: "#F87171",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Explicit Dissent
                      </p>
                      {state.verdict.dissent.map((d, i) => (
                        <p
                          key={i}
                          style={{
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.5)",
                            margin: "4px 0",
                            lineHeight: "1.5",
                          }}
                        >
                          <span
                            style={{ color: "#EF4444", fontWeight: "700" }}
                          >
                            {d.agent}:{" "}
                          </span>
                          {d.claim}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ═══ CITATIONS ═══ */}
          {state.verdict &&
            state.verdict.citations &&
            state.verdict.citations.length > 0 && (
              <div className="glass-card" style={{ padding: "20px" }}>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    margin: "0 0 16px 0",
                  }}
                >
                  Citations
                </p>
                <div
                  className="thin-scroll"
                  style={{
                    display: "flex",
                    gap: "12px",
                    overflowX: "auto",
                    paddingBottom: "8px",
                  }}
                >
                  {state.verdict.citations.map((c, i) => (
                    <div key={i} className="citation-card">
                      <p
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.7)",
                          margin: "0 0 6px 0",
                          fontWeight: "600",
                          lineHeight: "1.4",
                        }}
                      >
                        {c.source}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.4)",
                          margin: "0 0 8px 0",
                          lineHeight: "1.4",
                        }}
                      >
                        {c.relevance}
                      </p>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "10px",
                            color: "#8B5CF6",
                            textDecoration: "none",
                          }}
                        >
                          ↗ View source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
