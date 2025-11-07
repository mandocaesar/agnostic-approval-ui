import { ApprovalStatus } from "@/types";

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: "Draft",
  waiting: "Waiting for Approval",
  reject: "Rejected",
  approved: "Approved",
};

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  draft:
    "border border-slate-200 bg-slate-100 text-slate-700",
  waiting:
    "border border-amber-200 bg-amber-50 text-amber-700",
  reject:
    "border border-rose-200 bg-rose-50 text-rose-700",
  approved:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",
};

const STATUS_DOTS: Record<ApprovalStatus, string> = {
  draft: "bg-slate-500",
  waiting: "bg-amber-500",
  reject: "bg-rose-500",
  approved: "bg-emerald-500",
};

interface StatusBadgeProps {
  status: ApprovalStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${STATUS_STYLES[status]}`}
    >
      <span className={`h-2 w-2 rounded-full ${STATUS_DOTS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
