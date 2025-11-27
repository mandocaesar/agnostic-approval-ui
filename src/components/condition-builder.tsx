"use client";

import { useState } from "react";
import type {
    TransitionCondition,
    ConditionGroup,
    ConditionOperator,
    LogicalOperator,
} from "@/types";

interface ConditionBuilderProps {
    groups: ConditionGroup[];
    onChange: (groups: ConditionGroup[]) => void;
    availableFields?: Array<{
        value: string;
        label: string;
        type?: "string" | "number";
    }>;
}

const DEFAULT_FIELDS = [
    { value: "amount", label: "Amount", type: "number" as const },
    { value: "riskLevel", label: "Risk Level", type: "string" as const },
    { value: "category", label: "Category", type: "string" as const },
    { value: "requester.department", label: "Requester Department", type: "string" as const },
    { value: "requester.role", label: "Requester Role", type: "string" as const },
    { value: "workflow.iterationCount", label: "Iteration Count", type: "number" as const },
];

const OPERATORS: Array<{ value: ConditionOperator; label: string }> = [
    { value: "==", label: "equals" },
    { value: "!=", label: "not equals" },
    { value: ">", label: "greater than" },
    { value: "<", label: "less than" },
    { value: ">=", label: "greater than or equal" },
    { value: "<=", label: "less than or equal" },
    { value: "CONTAINS", label: "contains" },
    { value: "NOT_CONTAINS", label: "does not contain" },
    { value: "IN", label: "in list" },
    { value: "NOT_IN", label: "not in list" },
    { value: "STARTS_WITH", label: "starts with" },
    { value: "ENDS_WITH", label: "ends with" },
    { value: "IS_EMPTY", label: "is empty" },
    { value: "IS_NOT_EMPTY", label: "is not empty" },
];

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ConditionBuilder({
    groups,
    onChange,
    availableFields = DEFAULT_FIELDS,
}: ConditionBuilderProps) {
    const addGroup = () => {
        const newGroup: ConditionGroup = {
            id: generateId(),
            operator: "AND",
            conditions: [
                {
                    id: generateId(),
                    field: availableFields[0]?.value || "amount",
                    operator: "==",
                    value: "",
                },
            ],
        };
        onChange([...groups, newGroup]);
    };

    const removeGroup = (groupId: string) => {
        onChange(groups.filter((g) => g.id !== groupId));
    };

    const updateGroupOperator = (groupId: string, operator: LogicalOperator) => {
        onChange(
            groups.map((g) => (g.id === groupId ? { ...g, operator } : g))
        );
    };

    const addCondition = (groupId: string) => {
        onChange(
            groups.map((g) =>
                g.id === groupId
                    ? {
                        ...g,
                        conditions: [
                            ...g.conditions,
                            {
                                id: generateId(),
                                field: availableFields[0]?.value || "amount",
                                operator: "==",
                                value: "",
                            },
                        ],
                    }
                    : g
            )
        );
    };

    const removeCondition = (groupId: string, conditionId: string) => {
        onChange(
            groups.map((g) =>
                g.id === groupId
                    ? {
                        ...g,
                        conditions: g.conditions.filter((c) => c.id !== conditionId),
                    }
                    : g
            )
        );
    };

    const updateCondition = (
        groupId: string,
        conditionId: string,
        updates: Partial<TransitionCondition>
    ) => {
        onChange(
            groups.map((g) =>
                g.id === groupId
                    ? {
                        ...g,
                        conditions: g.conditions.map((c) =>
                            c.id === conditionId ? { ...c, ...updates } : c
                        ),
                    }
                    : g
            )
        );
    };

    return (
        <div className="space-y-4">
            {groups.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="mb-4 text-sm text-slate-600">
                        No conditions defined. This transition will always be available.
                    </p>
                    <button
                        type="button"
                        onClick={addGroup}
                        className="rounded-lg bg-[#0d1d3b] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#132a52]"
                    >
                        Add Condition Group
                    </button>
                </div>
            ) : (
                <>
                    {groups.map((group, groupIndex) => (
                        <div
                            key={group.id}
                            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            {/* Group Header */}
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Group {groupIndex + 1}
                                    </span>
                                    <select
                                        value={group.operator}
                                        onChange={(e) =>
                                            updateGroupOperator(
                                                group.id,
                                                e.target.value as LogicalOperator
                                            )
                                        }
                                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                                    >
                                        <option value="AND">All conditions (AND)</option>
                                        <option value="OR">Any condition (OR)</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeGroup(group.id)}
                                    className="text-sm text-slate-400 transition-colors hover:text-rose-600"
                                >
                                    Remove Group
                                </button>
                            </div>

                            {/* Conditions */}
                            <div className="space-y-2">
                                {group.conditions.map((condition, conditionIndex) => (
                                    <div
                                        key={condition.id}
                                        className="flex items-center gap-2 rounded-lg bg-slate-50 p-3"
                                    >
                                        {conditionIndex > 0 && (
                                            <span className="text-xs font-semibold text-slate-400">
                                                {group.operator}
                                            </span>
                                        )}

                                        <select
                                            value={condition.field}
                                            onChange={(e) =>
                                                updateCondition(group.id, condition.id, {
                                                    field: e.target.value,
                                                })
                                            }
                                            className="flex-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-sm"
                                        >
                                            {availableFields.map((field) => (
                                                <option key={field.value} value={field.value}>
                                                    {field.label}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={condition.operator}
                                            onChange={(e) =>
                                                updateCondition(group.id, condition.id, {
                                                    operator: e.target.value as ConditionOperator,
                                                })
                                            }
                                            className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm"
                                        >
                                            {OPERATORS.map((op) => (
                                                <option key={op.value} value={op.value}>
                                                    {op.label}
                                                </option>
                                            ))}
                                        </select>


                                        {!["IS_EMPTY", "IS_NOT_EMPTY"].includes(condition.operator) && (
                                            <input
                                                type="text"
                                                value={condition.value}
                                                onChange={(e) =>
                                                    updateCondition(group.id, condition.id, {
                                                        value:
                                                            availableFields.find((f) => f.value === condition.field)
                                                                ?.type === "number"
                                                                ? Number(e.target.value)
                                                                : e.target.value,
                                                    })
                                                }
                                                placeholder="Value"
                                                className="w-32 rounded border border-slate-200 bg-white px-3 py-1.5 text-sm"
                                            />
                                        )}


                                        <button
                                            type="button"
                                            onClick={() => removeCondition(group.id, condition.id)}
                                            className="text-slate-400 transition-colors hover:text-rose-600"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => addCondition(group.id)}
                                    className="text-sm text-[#0d1d3b] transition-colors hover:text-[#132a52]"
                                >
                                    + Add Condition
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addGroup}
                        className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100"
                    >
                        + Add Condition Group
                    </button>
                </>
            )}

            {/* Preview */}
            {groups.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Condition Preview
                    </h4>
                    <code className="block text-xs text-slate-700">
                        {groups
                            .map((group) => {
                                const conditions = group.conditions
                                    .map(
                                        (c) =>
                                            `(${c.field} ${c.operator} ${JSON.stringify(c.value)})`
                                    )
                                    .join(` ${group.operator} `);
                                return `(${conditions})`;
                            })
                            .join(" AND ")}
                    </code>
                </div>
            )}
        </div>
    );
}
