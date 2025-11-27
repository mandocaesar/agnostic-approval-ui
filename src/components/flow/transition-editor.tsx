import { useState } from "react";
import type {
    ConditionGroup,
    TransitionCondition,
    ConditionOperator,
    LogicalOperator,
} from "@/types";

interface TransitionEditorProps {
    edgeId: string;
    sourceLabel: string;
    targetLabel: string;
    conditionGroups?: ConditionGroup[];
    isDefault?: boolean;
    onSave: (data: {
        conditionGroups: ConditionGroup[];
        isDefault: boolean;
    }) => void;
    onClose: () => void;
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
    { value: ">", label: "Greater than (>)" },
    { value: "<", label: "Less than (<)" },
    { value: ">=", label: "Greater than or equal (>=)" },
    { value: "<=", label: "Less than or equal (<=)" },
    { value: "==", label: "Equals (==)" },
    { value: "!=", label: "Not equals (!=)" },
    { value: "CONTAINS", label: "Contains" },
    { value: "NOT_CONTAINS", label: "Does not contain" },
];

const SAMPLE_FIELDS = [
    { value: "amount", label: "Amount", type: "number" },
    { value: "risk", label: "Risk Level", type: "string" },
    { value: "department", label: "Department", type: "string" },
    { value: "priority", label: "Priority", type: "string" },
    { value: "status", label: "Status", type: "string" },
];

function createEmptyCondition(): TransitionCondition {
    return {
        id: crypto.randomUUID(),
        field: SAMPLE_FIELDS[0].value,
        operator: "==",
        value: "",
    };
}

function createEmptyGroup(): ConditionGroup {
    return {
        id: crypto.randomUUID(),
        operator: "AND",
        conditions: [createEmptyCondition()],
    };
}

export function TransitionEditor({
    edgeId,
    sourceLabel,
    targetLabel,
    conditionGroups: initialGroups,
    isDefault: initialIsDefault,
    onSave,
    onClose,
}: TransitionEditorProps) {
    const [groups, setGroups] = useState<ConditionGroup[]>(
        initialGroups && initialGroups.length > 0
            ? initialGroups
            : [createEmptyGroup()]
    );
    const [isDefault, setIsDefault] = useState(initialIsDefault || false);

    const addGroup = () => {
        setGroups([...groups, createEmptyGroup()]);
    };

    const removeGroup = (groupId: string) => {
        setGroups(groups.filter((g) => g.id !== groupId));
    };

    const updateGroup = (groupId: string, operator: LogicalOperator) => {
        setGroups(
            groups.map((g) => (g.id === groupId ? { ...g, operator } : g))
        );
    };

    const addCondition = (groupId: string) => {
        setGroups(
            groups.map((g) =>
                g.id === groupId
                    ? { ...g, conditions: [...g.conditions, createEmptyCondition()] }
                    : g
            )
        );
    };

    const removeCondition = (groupId: string, conditionId: string) => {
        setGroups(
            groups.map((g) =>
                g.id === groupId
                    ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) }
                    : g
            )
        );
    };

    const updateCondition = (
        groupId: string,
        conditionId: string,
        updates: Partial<TransitionCondition>
    ) => {
        setGroups(
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

    const handleSave = () => {
        onSave({ conditionGroups: groups, isDefault });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex flex-col gap-2 border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Transition Conditions
                            </p>
                            <h3 className="text-lg font-semibold text-slate-900">
                                {sourceLabel} → {targetLabel}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {/* Default Path Toggle */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-700">
                                        Default Path
                                    </span>
                                    <p className="text-xs text-slate-500">
                                        Use this transition when no other conditions match
                                    </p>
                                </div>
                            </label>
                        </div>

                        {!isDefault && (
                            <>
                                {/* Condition Groups */}
                                {groups.map((group, groupIndex) => (
                                    <div
                                        key={group.id}
                                        className="rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                    Group {groupIndex + 1}
                                                </span>
                                                <select
                                                    value={group.operator}
                                                    onChange={(e) =>
                                                        updateGroup(group.id, e.target.value as LogicalOperator)
                                                    }
                                                    className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-emerald-700"
                                                >
                                                    <option value="AND">AND</option>
                                                    <option value="OR">OR</option>
                                                </select>
                                            </div>
                                            {groups.length > 1 && (
                                                <button
                                                    onClick={() => removeGroup(group.id)}
                                                    className="text-xs text-rose-600 hover:text-rose-700"
                                                >
                                                    Remove Group
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {group.conditions.map((condition, condIndex) => (
                                                <div
                                                    key={condition.id}
                                                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3"
                                                >
                                                    <select
                                                        value={condition.field}
                                                        onChange={(e) =>
                                                            updateCondition(group.id, condition.id, {
                                                                field: e.target.value,
                                                            })
                                                        }
                                                        className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm"
                                                    >
                                                        {SAMPLE_FIELDS.map((field) => (
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
                                                        className="w-40 rounded border border-slate-200 px-2 py-1.5 text-sm"
                                                    >
                                                        {OPERATORS.map((op) => (
                                                            <option key={op.value} value={op.value}>
                                                                {op.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <input
                                                        type="text"
                                                        value={condition.value}
                                                        onChange={(e) =>
                                                            updateCondition(group.id, condition.id, {
                                                                value: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Value"
                                                        className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm"
                                                    />

                                                    {group.conditions.length > 1 && (
                                                        <button
                                                            onClick={() =>
                                                                removeCondition(group.id, condition.id)
                                                            }
                                                            className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {condIndex < group.conditions.length - 1 && (
                                                        <span className="text-xs font-semibold text-emerald-600">
                                                            {group.operator}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => addCondition(group.id)}
                                            className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                        >
                                            + Add Condition
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={addGroup}
                                    className="w-full rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                                >
                                    + Add Condition Group (OR)
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <footer className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                    >
                        Save Conditions
                    </button>
                </footer>
            </div>
        </div>
    );
}
