interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
  icon?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/30 p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50">
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-200/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-3xl font-semibold tracking-tight text-[#0d1d3b] transition-colors duration-200 group-hover:text-[#132a52]">
              {value}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-600">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-xs uppercase tracking-[0.35em] text-slate-400">
                {subtitle}
              </div>
            ) : null}
          </div>
          {icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#0d1d3b] to-[#1a3a5f] text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
          ) : null}
        </div>
        {trend ? (
          <div
            className={[
              "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
              trend.direction === "up"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100",
            ].join(" ")}
          >
            <span
              className={[
                "h-2 w-2 rounded-full",
                trend.direction === "up" ? "bg-emerald-500" : "bg-rose-500",
              ].join(" ")}
            />
            {trend.label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
