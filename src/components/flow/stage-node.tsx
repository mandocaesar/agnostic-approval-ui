import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { ApprovalStatus, StageEvent, User } from "@/types";

const STATUS_LABELS: Record<ApprovalStatus, string> = {
    in_process: "In Process",
    approved: "Approved",
    reject: "Rejected",
    end: "End",
};

export type StageNodeData = {
    label: string;
    status: ApprovalStatus;
    description: string;
    actorUserId: string;
    notifySupervisor: boolean;
    ccActor: boolean;
    isFinal: boolean;
    events?: StageEvent[];
    transitions?: string[]; // List of target stage IDs
    users: User[];
    onEdit: (id: string) => void;
};

export type StageNodeType = Node<StageNodeData>;

function StageNode({ data, id, selected }: NodeProps<StageNodeType>) {
    const {
        label,
        status,
        description,
        actorUserId,
        notifySupervisor,
        isFinal,
        users,
        onEdit,
    } = data;

    const actor = users.find((u: User) => u.id === actorUserId);
    const statusLabel = STATUS_LABELS[status] ?? status;

    return (
        <div
            className={[
                "group flex h-[150px] w-[220px] flex-col gap-2 rounded-2xl border px-4 py-3 text-left shadow-xl transition",
                selected
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/20 bg-slate-900/90 hover:border-emerald-200/70",
            ].join(" ")}
            onDoubleClick={() => onEdit(id)}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-3 !w-3 !-translate-x-1.5 !border-2 !border-slate-900 !bg-slate-400 transition hover:!bg-emerald-400"
            />

            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                <span>
                    {statusLabel}
                    {isFinal ? " · Final" : ""}
                </span>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black leading-none text-emerald-400">
                        ●
                    </span>
                </div>
            </div>

            <div>
                <p className="text-base font-semibold text-white line-clamp-1" title={label}>
                    {label}
                </p>
                <p className="text-xs text-slate-300 line-clamp-2" title={description}>
                    {description}
                </p>
            </div>

            <div className="text-xs text-slate-300">
                Actor:{" "}
                <span className="text-slate-100">
                    {actor?.name ?? "Unassigned"}
                </span>
            </div>

            <div className="mt-auto text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                {notifySupervisor ? "Notifies supervisor" : "Silent"}
            </div>

            {!isFinal && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!h-3 !w-3 !translate-x-1.5 !border-2 !border-slate-900 !bg-slate-400 transition hover:!bg-emerald-400"
                />
            )}
        </div>
    );
}

export default memo(StageNode);
