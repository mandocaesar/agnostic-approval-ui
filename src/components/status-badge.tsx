import { ApprovalStatus } from "@/types";

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  in_process: "In process",
  approved: "Approved",
  reject: "Reject",
  end: "End",
};

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  in_process:
    "border border-sky-200 bg-sky-50 text-sky-700",
  approved:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",
  reject:
    "border border-rose-200 bg-rose-50 text-rose-700",
  end:
    "border border-slate-200 bg-slate-100 text-slate-700",
};

const STATUS_DOTS: Record<ApprovalStatus, string> = {
  in_process: "bg-sky-500",
  approved: "bg-emerald-500",
  reject: "bg-rose-500",
  end: "bg-slate-500",
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
