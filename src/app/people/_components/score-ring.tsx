"use client";

import * as React from "react";

interface ScoreRingProps {
  score: number;
}

export function ScoreRing({ score }: ScoreRingProps) {
  const color =
    score >= 90
      ? "text-emerald-400 border-emerald-400"
      : score >= 75
        ? "text-amber-400 border-amber-400"
        : "text-blue-400 border-blue-400";
  return (
    <div
      className={`h-9 w-9 rounded-full border-2 flex items-center justify-center font-bold text-[11px] font-mono shrink-0 ${color}`}
    >
      {score}
    </div>
  );
}
