"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AgentName,
  Challenge,
  DeliberationState,
  GroundingResult,
  Position,
  TimelineItem,
  Verdict,
} from "./types";

const INITIAL_STATE: DeliberationState = {
  positions: {},
  challenges: [],
  grounding: {},
  verdict: null,
  currentRound: 0,
  status: "idle",
  timeline: [],
};

export function useDeliberation() {
  const [state, setState] = useState<DeliberationState>(INITIAL_STATE);
  const wsRef = useRef<WebSocket | null>(null);

  const start = useCallback((question: string, context = "") => {
    wsRef.current?.close();
    const wsUrl =
      process.env.NEXT_PUBLIC_API_WS_URL ?? "ws://localhost:8000/ws/deliberate";

    setState({ ...INITIAL_STATE, status: "running" });

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ question, context }));
    };

    ws.onmessage = (message) => {
      const chunks = String(message.data)
        .split("\n")
        .map((chunk) => chunk.trim())
        .filter(Boolean);

      for (const chunk of chunks) {
        const event = JSON.parse(chunk);
        setState((previous) => reduceEvent(previous, event));
      }
    };

    ws.onerror = () => {
      setState((previous) => ({
        ...previous,
        status: "error",
        error: "WebSocket connection failed.",
      }));
    };

    ws.onclose = () => {
      setState((previous) =>
        previous.status === "running"
          ? { ...previous, status: "error", error: "WebSocket closed before completion." }
          : previous,
      );
    };
  }, []);

  const reset = useCallback(() => {
    wsRef.current?.close();
    setState(INITIAL_STATE);
  }, []);

  return { state, start, reset };
}

function reduceEvent(previous: DeliberationState, event: any): DeliberationState {
  if (event.type === "round_start") {
    return { ...previous, currentRound: event.round, status: "running" };
  }

  if (event.type === "agent_position") {
    const position = event.data as Position;
    return {
      ...previous,
      positions: {
        ...previous.positions,
        [position.agent as AgentName]: position,
      },
    };
  }

  if (event.type === "challenge") {
    const challenge = event.data as Challenge;
    return {
      ...previous,
      challenges: [...previous.challenges, challenge],
      timeline: [...previous.timeline, toTimeline("challenge", challenge)],
    };
  }

  if (event.type === "grounding_result") {
    const result = event.data as GroundingResult;
    return {
      ...previous,
      grounding: {
        ...previous.grounding,
        [result.claim]: result,
      },
      timeline: [...previous.timeline, toTimeline("grounding_result", result)],
    };
  }

  if (event.type === "verdict") {
    return { ...previous, verdict: event.data as Verdict };
  }

  if (event.type === "done") {
    return {
      ...previous,
      status: "done",
      currentRound: 4,
      sessionId: event.session_id,
    };
  }

  if (event.type === "error") {
    return {
      ...previous,
      status: "error",
      error: event.message,
      timeline: [
        ...previous.timeline,
        {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString(),
          type: "error",
          data: { message: event.message },
        },
      ],
    };
  }

  return previous;
}

function toTimeline(
  type: "challenge",
  data: Challenge,
): TimelineItem;
function toTimeline(
  type: "grounding_result",
  data: GroundingResult,
): TimelineItem;
function toTimeline(
  type: "challenge" | "grounding_result",
  data: Challenge | GroundingResult,
): TimelineItem {
  return {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString(),
    type,
    data,
  } as TimelineItem;
}
