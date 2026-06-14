"use client";

import React from "react";
import { Check } from "lucide-react";

type RoundTrackerProps = {
  currentRound: number;
  status: "idle" | "running" | "done" | "error";
};
export default function RoundTracker({ currentRound }: RoundTrackerProps) {
  const steps = ['Formation','Challenge','Grounding','Verdict'];

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
            ${currentRound > i 
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50' 
              : currentRound === i + 1 
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/50 animate-pulse' 
              : 'border border-white/20 text-zinc-500'}`}>
                {currentRound > i ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium tracking-wider uppercase ${currentRound > i ? 'text-cyan-400' : currentRound === i+1 ? 'text-violet-400' : 'text-zinc-600'}`}>{step}</span>
            </div>
            {i < 3 && (
              <div className="flex-1 h-px mx-3 relative overflow-hidden bg-white/10">
                <div className={`absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-1000 ${currentRound > i ? 'w-full' : 'w-0'}`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
