"use client";

import { useMemo } from "react";

interface PayloadDiffProps {
    before: Record<string, any>;
    after: Record<string, any>;
    title?: string;
}

type DiffType = "added" | "removed" | "modified" | "unchanged";

interface DiffLine {
    type: DiffType;
    key: string;
    beforeValue?: any;
    afterValue?: any;
    indent: number;
}

function generateDiffLines(
    before: any,
    after: any,
    indent = 0,
    parentKey = ""
): DiffLine[] {
    const lines: DiffLine[] = [];
    const allKeys = new Set([
        ...Object.keys(before || {}),
        ...Object.keys(after || {}),
    ]);

    allKeys.forEach((key) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        const beforeValue = before?.[key];
        const afterValue = after?.[key];

        const beforeExists = before && key in before;
        const afterExists = after && key in after;

        if (!beforeExists && afterExists) {
            // Added
            lines.push({
                type: "added",
                key,
                afterValue,
                indent,
            });
        } else if (beforeExists && !afterExists) {
            // Removed
            lines.push({
                type: "removed",
                key,
                beforeValue,
                indent,
            });
        } else if (
            typeof beforeValue === "object" &&
            beforeValue !== null &&
            typeof afterValue === "object" &&
            afterValue !== null &&
            !Array.isArray(beforeValue) &&
            !Array.isArray(afterValue)
        ) {
            // Nested object - recurse
            lines.push({
                type: "unchanged",
                key: `${key}: {`,
                indent,
            });
            lines.push(...generateDiffLines(beforeValue, afterValue, indent + 1, fullKey));
            lines.push({
                type: "unchanged",
                key: "}",
                indent,
            });
        } else if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
            // Modified
            lines.push({
                type: "modified",
                key,
                beforeValue,
                afterValue,
                indent,
            });
        } else {
            // Unchanged
            lines.push({
                type: "unchanged",
                key,
                beforeValue,
                indent,
            });
        }
    });

    return lines;
}

function formatValue(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return `"${value}"`;
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === "object") return "{...}";
    return String(value);
}

export function PayloadDiff({ before, after, title }: PayloadDiffProps) {
    const diffLines = useMemo(
        () => generateDiffLines(before, after),
        [before, after]
    );

    const stats = useMemo(() => {
        const added = diffLines.filter((l) => l.type === "added").length;
        const removed = diffLines.filter((l) => l.type === "removed").length;
        const modified = diffLines.filter((l) => l.type === "modified").length;
        return { added, removed, modified };
    }, [diffLines]);

    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                        {title || "Payload Changes"}
                    </h3>
                    <div className="flex gap-3 text-xs">
                        {stats.added > 0 && (
                            <span className="text-emerald-600">+{stats.added} added</span>
                        )}
                        {stats.modified > 0 && (
                            <span className="text-amber-600">~{stats.modified} modified</span>
                        )}
                        {stats.removed > 0 && (
                            <span className="text-rose-600">-{stats.removed} removed</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Diff Content */}
            <div className="max-h-96 overflow-y-auto p-4">
                <div className="font-mono text-xs">
                    {diffLines.map((line, index) => {
                        const paddingLeft = `${line.indent * 1.5}rem`;

                        let bgColor = "";
                        let textColor = "text-slate-700";
                        let prefix = "  ";
                        let content = "";

                        switch (line.type) {
                            case "added":
                                bgColor = "bg-emerald-50";
                                textColor = "text-emerald-700";
                                prefix = "+ ";
                                content = `"${line.key}": ${formatValue(line.afterValue)}`;
                                break;
                            case "removed":
                                bgColor = "bg-rose-50";
                                textColor = "text-rose-700";
                                prefix = "- ";
                                content = `"${line.key}": ${formatValue(line.beforeValue)}`;
                                break;
                            case "modified":
                                bgColor = "bg-amber-50";
                                textColor = "text-amber-700";
                                prefix = "~ ";
                                content = `"${line.key}": ${formatValue(line.beforeValue)} → ${formatValue(line.afterValue)}`;
                                break;
                            case "unchanged":
                                bgColor = "";
                                textColor = "text-slate-500";
                                prefix = "  ";
                                content = line.beforeValue !== undefined
                                    ? `"${line.key}": ${formatValue(line.beforeValue)}`
                                    : line.key;
                                break;
                        }

                        return (
                            <div
                                key={`${line.key}-${index}`}
                                className={`${bgColor} ${textColor} py-0.5 px-2 -mx-2`}
                                style={{ paddingLeft }}
                            >
                                <span className="select-none opacity-50">{prefix}</span>
                                {content}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* No Changes */}
            {diffLines.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No changes detected
                </div>
            )}
        </div>
    );
}
