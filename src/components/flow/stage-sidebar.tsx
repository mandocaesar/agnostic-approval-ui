import { DragEvent } from "react";
import type { ApprovalStatus } from "@/types";

interface StageTemplate {
    id: string;
    label: string;
    status: ApprovalStatus;
    description: string;
    icon: string;
}

const STAGE_TEMPLATES: StageTemplate[] = [
    {
        id: "draft",
        label: "Draft",
        status: "in_process",
        description: "Initial stage for drafting",
        icon: "📝",
    },
    {
        id: "review",
        label: "Review",
        status: "in_process",
        description: "Review and validation stage",
        icon: "👀",
    },
    {
        id: "approval",
        label: "Approval",
        status: "in_process",
        description: "Approval decision stage",
        icon: "✅",
    },
    {
        id: "approved",
        label: "Approved",
        status: "approved",
        description: "Final approval state",
        icon: "🎉",
    },
    {
        id: "rejected",
        label: "Rejected",
        status: "reject",
        description: "Rejection state",
        icon: "❌",
    },
];

export function StageSidebar() {
    const onDragStart = (event: DragEvent<HTMLDivElement>, template: StageTemplate) => {
        event.dataTransfer.setData("application/reactflow", template.id);
        event.dataTransfer.setData("stage-template", JSON.stringify(template));
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <aside className="w-64 border-r border-slate-200 bg-slate-50 p-4">
            <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Stage Templates
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                    Drag and drop to canvas
                </p>
            </div>

            <div className="space-y-2">
                {STAGE_TEMPLATES.map((template) => (
                    <div
                        key={template.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, template)}
                        className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md active:cursor-grabbing"
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-2xl">{template.icon}</span>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                    {template.label}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {template.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-800">
                    💡 Quick Tips
                </p>
                <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                    <li>• Drag stages to canvas</li>
                    <li>• Connect with handles</li>
                    <li>• Double-click to edit</li>
                </ul>
            </div>
        </aside>
    );
}
