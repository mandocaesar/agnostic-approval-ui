import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { ApprovalTimeline } from "@/components/approval-timeline";
import { PayloadDiff } from "@/components/payload-diff";
import { PageHeaderMount } from "@/components/page-header";
import { ApprovalActionForm } from "@/components/approval-action-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ApprovalStatus } from "@/types";

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleString("en", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default async function ApprovalDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Fetch approval with all relations
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        domain: true,
        subdomain: true,
        flow: true,
        requester: true,
      },
    });

    if (!approval) {
        notFound();
    }

    const { domain, subdomain, flow, requester } = approval;

    // Get all users for timeline
    const users = await prisma.user.findMany();

    // Get workflow stages
    const flowDefinition = flow.definition as any;
    const stages = flowDefinition.stages || [];
    const currentStage = stages.find((s: any) => s.id === approval.currentStageId);
    const currentStageIndex = stages.findIndex((s: any) => s.id === approval.currentStageId);

    // Build timeline events from metadata
    const metadata = (approval.metadata || {}) as any;
    const timelineEvents = [
        {
            id: "submit",
            stageId: "initial",
            stageName: "Submitted",
            userId: approval.requesterId,
            userName: requester?.name || "Unknown User",
            action: "submit" as const,
            timestamp: approval.submittedAt,
        },
        ...(metadata.comments || []).map((comment: any) => ({
            id: comment.stageId + comment.timestamp,
            stageId: comment.stageId,
            stageName: comment.stageId,
            userId: comment.userId,
            userName: comment.userName,
            action: comment.action,
            comment: comment.comment,
            timestamp: comment.timestamp,
        })),
    ];

    return (
        <>
            <PageHeaderMount
                title={approval.title}
                description={`Approval #${approval.id}`}
            />

            <div className="space-y-6 p-6">
                {/* Back Button */}
                <Link
                    href="/dashboard/approvals/all"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Approvals Board
                </Link>

                {/* Header Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">{approval.title}</h1>
                                <StatusBadge status={approval.status} />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span>
                                    <span className="font-medium">Domain:</span> {domain?.name || "Unknown"}
                                </span>
                                <span>•</span>
                                <span>
                                    <span className="font-medium">Subdomain:</span> {subdomain?.name || "Unknown"}
                                </span>
                                <span>•</span>
                                <span>
                                    <span className="font-medium">Requester:</span> {requester?.name || "Unknown"}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-slate-500">
                                Submitted {formatDate(new Date(approval.submittedAt))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workflow Progress */}
                {stages.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 text-sm font-semibold text-slate-900">Workflow Progress</h2>
                        <div className="flex items-center gap-2">
                            {stages.map((stage, index) => {
                                const isCompleted = index < currentStageIndex;
                                const isCurrent = index === currentStageIndex;
                                const isPending = index > currentStageIndex;

                                return (
                                    <div key={stage.id} className="flex flex-1 items-center">
                                        {/* Stage */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${isCompleted
                                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                                    : isCurrent
                                                        ? "border-blue-500 bg-blue-500 text-white"
                                                        : "border-slate-300 bg-white text-slate-400"
                                                    }`}
                                            >
                                                {isCompleted ? (
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-sm font-medium">{index + 1}</span>
                                                )}
                                            </div>
                                            <span className={`mt-2 text-xs ${isCurrent ? "font-medium text-slate-900" : "text-slate-500"}`}>
                                                {stage.name}
                                            </span>
                                        </div>

                                        {/* Connector */}
                                        {index < stages.length - 1 && (
                                            <div
                                                className={`h-0.5 flex-1 ${isCompleted ? "bg-emerald-500" : "bg-slate-300"
                                                    }`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Timeline & Payload */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* History Timeline */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h2 className="mb-4 text-sm font-semibold text-slate-900">Approval History</h2>
                            <ApprovalTimeline events={timelineEvents} currentStageId={approval.currentStageId} />
                        </div>

                        {/* Payload Viewer */}
                        <div className="rounded-lg border border-slate-200 bg-white p-6">
                            <h2 className="mb-4 text-sm font-semibold text-slate-900">Request Payload</h2>
                            <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-50 p-4">
                                <pre className="text-xs text-slate-700">
                                    {JSON.stringify(approval.payload, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Action Form */}
                    <div className="space-y-6">
                        {/* Action Form - Only show if approval is in process (not approved/rejected) */}
                        {approval.status === "in_process" && currentStage && (
                            <ApprovalActionForm
                                approvalId={approval.id}
                                currentStage={currentStage}
                                flowDefinition={flowDefinition}
                            />
                        )}

                        {/* Final Status Message */}
                        {(approval.status === "approved" || approval.status === "reject") && (
                            <div className={`rounded-lg border p-6 ${
                                approval.status === "approved" 
                                    ? "bg-emerald-50 border-emerald-200" 
                                    : "bg-rose-50 border-rose-200"
                            }`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {approval.status === "approved" ? (
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    <h2 className={`text-lg font-semibold ${
                                        approval.status === "approved" ? "text-emerald-900" : "text-rose-900"
                                    }`}>
                                        {approval.status === "approved" ? "Approved" : "Rejected"}
                                    </h2>
                                </div>
                                <p className={`text-sm ${
                                    approval.status === "approved" ? "text-emerald-700" : "text-rose-700"
                                }`}>
                                    This approval request has been finalized and no further actions can be taken.
                                </p>
                                {approval.completedAt && (
                                    <p className="text-xs text-slate-600 mt-2">
                                        Completed on {new Date(approval.completedAt).toLocaleDateString("en", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Metadata Card */}
                        {metadata && Object.keys(metadata).length > 0 && (
                            <div className="rounded-lg border border-slate-200 bg-white p-6">
                                <h2 className="mb-4 text-sm font-semibold text-slate-900">Additional Info</h2>
                                <div className="space-y-3">
                                    {metadata.iterationCount !== undefined && (
                                        <div>
                                            <p className="text-xs text-slate-500">Iteration Count</p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {metadata.iterationCount}
                                            </p>
                                        </div>
                                    )}
                                    {metadata.previousStageId && (
                                        <div>
                                            <p className="text-xs text-slate-500">Previous Stage</p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {stages.find((s: any) => s.id === metadata.previousStageId)?.name || metadata.previousStageId}
                                            </p>
                                        </div>
                                    )}
                                    {approval.completedAt && (
                                        <div>
                                            <p className="text-xs text-slate-500">Completed At</p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {formatDate(approval.completedAt)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
