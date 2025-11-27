import { ApprovalStatus } from "@/types";

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  in_process: "Pending",
  approved: "Approved",
  reject: "Rejected",
  end: "Completed",
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
  const icons: Record<ApprovalStatus, React.ReactNode> = {
    in_process: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
      </svg>
    ),
    approved: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
    reject: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    ),
    end: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-4.464a.75.75 0 10-1.061-1.061 3.5 3.5 0 01-4.95 0 .75.75 0 00-1.06 1.06 5 5 0 007.07 0zM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide shadow-sm transition-all duration-200 hover:shadow-md ${STATUS_STYLES[status]}`}
    >
      <span className="flex items-center gap-1.5">
        {icons[status]}
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status]} ${status === "in_process" ? "animate-pulse-slow" : ""}`} />
      </span>
      {STATUS_LABELS[status]}
    </span>
  );
}
