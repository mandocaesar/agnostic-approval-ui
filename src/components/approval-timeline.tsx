"use client";

interface TimelineEvent {
    id: string;
    stageId: string;
    stageName: string;
    userId: string;
    userName: string;
    action: "approve" | "reject" | "return" | "submit";
    comment?: string;
    timestamp: string;
}

interface ApprovalTimelineProps {
    events: TimelineEvent[];
    currentStageId?: string;
}

const ACTION_LABELS: Record<TimelineEvent["action"], string> = {
    submit: "Submitted",
    approve: "Approved",
    reject: "Rejected",
    return: "Returned for revision",
};

const ACTION_COLORS: Record<TimelineEvent["action"], string> = {
    submit: "text-blue-600 bg-blue-100",
    approve: "text-emerald-600 bg-emerald-100",
    reject: "text-rose-600 bg-rose-100",
    return: "text-amber-600 bg-amber-100",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
});

export function ApprovalTimeline({ events, currentStageId }: ApprovalTimelineProps) {
    return (
        <div className="space-y-4">
            {events.map((event, index) => {
                const isLast = index === events.length - 1;
                const isCurrent = event.stageId === currentStageId;
                const actionColor = ACTION_COLORS[event.action];

                return (
                    <div key={event.id} className="relative">
                        {/* Timeline Line */}
                        {!isLast && (
                            <div className="absolute left-4 top-8 h-full w-0.5 bg-slate-200" />
                        )}

                        {/* Event */}
                        <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${actionColor}`}>
                                {event.action === "approve" && (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {event.action === "reject" && (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                {event.action === "return" && (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                )}
                                {event.action === "submit" && (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {ACTION_LABELS[event.action]}
                                            {isCurrent && (
                                                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                                    Current
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {event.stageName}
                                        </p>
                                    </div>
                                    <time className="text-xs text-slate-500">
                                        {dateFormatter.format(new Date(event.timestamp))}
                                    </time>
                                </div>

                                <p className="mt-1 text-sm text-slate-600">
                                    by <span className="font-medium">{event.userName}</span>
                                </p>

                                {event.comment && (
                                    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                        <p className="text-xs font-medium text-slate-500 mb-1">Comment:</p>
                                        {event.comment}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
