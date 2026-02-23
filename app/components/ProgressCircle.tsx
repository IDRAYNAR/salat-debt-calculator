"use client";

import { formatPercent, type NumberLocale } from "../lib/calculations";

interface ProgressCircleProps {
  progress: number;
  locale: NumberLocale;
  size?: number;
  strokeWidth?: number;
}

export function ProgressCircle({
  progress,
  locale,
  size = 200,
  strokeWidth = 12
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          background: "radial-gradient(circle, rgba(203,181,121,.18) 0%, rgba(20,86,53,0) 70%)"
        }}
      />

      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="sa-progress" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ccb06a" />
            <stop offset="45%" stopColor="#3ab06c" />
            <stop offset="100%" stopColor="#156b40" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="rgba(191,165,94,.22)"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="url(#sa-progress)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-emerald-100">
            {formatPercent(Math.round(progress), locale)}
          </div>
        </div>
      </div>
    </div>
  );
}
