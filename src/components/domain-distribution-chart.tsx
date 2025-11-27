"use client";

import { useMemo } from "react";

interface DomainDistributionChartProps {
  data: Array<{ label: string; value: number; color: string }>;
}

export function DomainDistributionChart({ data }: DomainDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const segments = useMemo(() => {
    let currentOffset = 0;
    return data.map((item) => {
      const percent = total > 0 ? (item.value / total) * 100 : 0;
      const segment = {
        ...item,
        percent,
        offset: currentOffset,
      };
      currentOffset += percent;
      return segment;
    });
  }, [data, total]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <div className="text-center">
          <h3 className="text-sm font-medium text-slate-900">No domain data</h3>
          <p className="mt-1 text-sm text-slate-500">Create approvals to see distribution</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="18"
            cy="18"
            r="15.915"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="4"
          />
          {/* Segments */}
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={segment.color}
              strokeWidth="4"
              strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
              strokeDashoffset={-segment.offset}
              className="transition-all duration-500 ease-out hover:opacity-80"
            >
              <title>{`${segment.label}: ${segment.value} (${Math.round(segment.percent)}%)`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{total}</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {segments.map((item, index) => (
          <div key={index} className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full shadow-sm ring-2 ring-white"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
                <span className="text-xs text-slate-500 w-8 text-right">
                    {Math.round(item.percent)}%
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
