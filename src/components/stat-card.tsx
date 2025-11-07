interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
}

export function StatCard({ title, value, subtitle, trend }: StatCardProps) {
  return (
    <div className="border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-3xl font-semibold tracking-tight text-[#0d1d3b]">
        {value}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-600">{title}</div>
      {subtitle ? (
        <div className="mt-1 text-xs uppercase tracking-[0.35em] text-slate-400">
          {subtitle}
        </div>
      ) : null}
      {trend ? (
        <div
          className={[
            "mt-4 inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold",
            trend.direction === "up"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          <span
            className={[
              "h-2 w-2 ",
              trend.direction === "up" ? "bg-emerald-500" : "bg-rose-500",
            ].join(" ")}
          />
          {trend.label}
        </div>
      ) : null}
    </div>
  );
}
