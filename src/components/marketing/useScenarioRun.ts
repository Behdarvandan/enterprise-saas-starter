"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCENARIOS, type Scenario, type ScenarioId } from "@/lib/marketing/scenarios";

const STEP_INTERVAL_MS = 700;
const REPLY_DELAY_MS = 600;

export interface ScenarioRun {
  scenario: Scenario | null;
  /** How many thought steps are on screen. */
  visibleSteps: number;
  replyVisible: boolean;
  running: boolean;
  start: (id: ScenarioId) => void;
}

/**
 * Plays a scripted scenario: the visitor's question is on screen at once,
 * thought steps arrive one by one, then the reply. Under reduced motion the
 * whole run is shown instantly. Timers are cleared on restart and unmount.
 */
export function useScenarioRun(): ScenarioRun {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [replyVisible, setReplyVisible] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const start = useCallback(
    (id: ScenarioId) => {
      const next = SCENARIOS.find((candidate) => candidate.id === id);
      if (!next) return;

      clearTimers();
      setScenario(next);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVisibleSteps(next.steps.length);
        setReplyVisible(true);
        return;
      }

      setVisibleSteps(0);
      setReplyVisible(false);

      next.steps.forEach((_, index) => {
        timers.current.push(
          window.setTimeout(() => setVisibleSteps(index + 1), STEP_INTERVAL_MS * (index + 1)),
        );
      });
      timers.current.push(
        window.setTimeout(
          () => setReplyVisible(true),
          STEP_INTERVAL_MS * next.steps.length + REPLY_DELAY_MS,
        ),
      );
    },
    [clearTimers],
  );

  return {
    scenario,
    visibleSteps,
    replyVisible,
    running: scenario !== null && !replyVisible,
    start,
  };
}
