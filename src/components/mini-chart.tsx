interface MiniChartProps {
    data: Array<{ label: string; value: number; color: string }>;
    type?: "bar" | "donut";
}

export function MiniChart({ data, type = "bar" }: MiniChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (type === "donut") {
        let currentOffset = 0;
        const segments = data.map((item) => {
            const percent = (item.value / total) * 100;
            const segment = {
                ...item,
                percent,
                offset: currentOffset,
            };
            currentOffset += percent;
            return segment;
        });

        return (
            <div className="flex items-center gap-4">
                <div className="relative h-24 w-24">
                    <svg viewBox="0 0 36 36" className="transform -rotate-90">
                        <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="3"
                        />
                        {segments.map((segment, index) => (
                            <circle
                                key={index}
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke={segment.color}
                                strokeWidth="3"
                                strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                                strokeDashoffset={-segment.offset}
                                className="transition-all duration-300"
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-semibold text-slate-900">{total}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-slate-600">{item.label}</span>
                            <span className="font-semibold text-slate-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Bar chart
    const max = Math.max(...data.map((d) => d.value));

    return (
        <div className="flex flex-col gap-3">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 w-24 truncate">
                        {item.label}
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${(item.value / max) * 100}%`,
                                backgroundColor: item.color,
                            }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-slate-900 w-8 text-right">
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
