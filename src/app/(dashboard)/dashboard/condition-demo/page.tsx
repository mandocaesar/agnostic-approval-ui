"use client";

import { useState } from "react";
import { ConditionBuilder } from "@/components/condition-builder";
import { evaluateConditionGroupsWithDetails } from "@/lib/conditionEngine";
import type { ConditionGroup } from "@/types";
import type { EvaluationContext } from "@/lib/conditionEngine";

export default function ConditionBuilderDemo() {
    const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([]);
    const [testData, setTestData] = useState({
        amount: "15000",
        riskLevel: "high",
        category: "payment",
        requesterDepartment: "finance",
    });

    const context: EvaluationContext = {
        resource: {
            amount: Number(testData.amount),
            riskLevel: testData.riskLevel,
            category: testData.category,
        },
        requester: {
            id: "user123",
            name: "John Doe",
            email: "john@example.com",
            role: "manager",
            department: testData.requesterDepartment,
        },
    };

    const result = evaluateConditionGroupsWithDetails(conditionGroups, context);

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Condition Builder Demo
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Build and test conditional logic for approval workflows
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Builder */}
                    <div className="space-y-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                Condition Builder
                            </h2>
                            <ConditionBuilder
                                groups={conditionGroups}
                                onChange={setConditionGroups}
                            />
                        </div>
                    </div>

                    {/* Test Panel */}
                    <div className="space-y-4">
                        {/* Test Data */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                Test Data
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={testData.amount}
                                        onChange={(e) =>
                                            setTestData({ ...testData, amount: e.target.value })
                                        }
                                        className="w-full rounded border border-slate-200 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Risk Level
                                    </label>
                                    <select
                                        value={testData.riskLevel}
                                        onChange={(e) =>
                                            setTestData({ ...testData, riskLevel: e.target.value })
                                        }
                                        className="w-full rounded border border-slate-200 px-3 py-2"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={testData.category}
                                        onChange={(e) =>
                                            setTestData({ ...testData, category: e.target.value })
                                        }
                                        className="w-full rounded border border-slate-200 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Requester Department
                                    </label>
                                    <input
                                        type="text"
                                        value={testData.requesterDepartment}
                                        onChange={(e) =>
                                            setTestData({
                                                ...testData,
                                                requesterDepartment: e.target.value,
                                            })
                                        }
                                        className="w-full rounded border border-slate-200 px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Evaluation Result */}
                        <div
                            className={`rounded-lg border p-6 shadow-sm ${result.passed
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-rose-200 bg-rose-50"
                                }`}
                        >
                            <h2
                                className={`mb-4 text-lg font-semibold ${result.passed ? "text-emerald-900" : "text-rose-900"
                                    }`}
                            >
                                Evaluation Result
                            </h2>
                            <div
                                className={`mb-4 flex items-center gap-2 text-2xl font-bold ${result.passed ? "text-emerald-700" : "text-rose-700"
                                    }`}
                            >
                                {result.passed ? (
                                    <>
                                        <svg
                                            className="h-8 w-8"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        PASSED
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-8 w-8"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        FAILED
                                    </>
                                )}
                            </div>

                            {result.details && result.details.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        Details:
                                    </h3>
                                    {result.details.map((detail, i) => (
                                        <div
                                            key={i}
                                            className={`rounded border p-2 text-sm ${detail.passed
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                    : "border-rose-200 bg-rose-50 text-rose-800"
                                                }`}
                                        >
                                            <code>
                                                {detail.field} {detail.operator}{" "}
                                                {JSON.stringify(detail.expectedValue)} →{" "}
                                                <strong>
                                                    {detail.passed ? "✓ PASS" : "✗ FAIL"}
                                                </strong>
                                            </code>
                                            <div className="mt-1 text-xs opacity-75">
                                                Actual value: {JSON.stringify(detail.actualValue)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* JSON Output */}
                        <div className="rounded-lg border border-slate-200 bg-slate-900 p-4">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                JSON Output
                            </h3>
                            <pre className="overflow-auto text-xs text-emerald-400">
                                {JSON.stringify(conditionGroups, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
