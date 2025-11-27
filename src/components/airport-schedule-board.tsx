import { Approval, ApprovalStatus, User } from "@/types";
import Link from "next/link";

interface AirportScheduleBoardProps {
  approvals: Approval[];
  users: User[];
  domains: Record<string, string>; // map domainId to name
}

const STATUS_MAP: Record<ApprovalStatus, { label: string; color: string }> = {
  in_process: { label: "REVIEW", color: "text-yellow-400" },
  approved: { label: "APPROVED", color: "text-emerald-400" },
  reject: { label: "REJECT", color: "text-red-500" },
  end: { label: "COMPLETED", color: "text-blue-400" },
};

function formatTime(dateStr: string | Date) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function AirportScheduleBoard({ approvals, users, domains }: AirportScheduleBoardProps) {
  // Sort by submittedAt desc, take top 10
  const recentApprovals = [...approvals]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 10);

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[600px] text-left font-mono text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-4 py-2 font-normal tracking-wider">TIME</th>
              <th className="px-4 py-2 font-normal tracking-wider">FLOW</th>
              <th className="px-4 py-2 font-normal tracking-wider">SUB DOMAIN</th>
              <th className="px-4 py-2 font-normal tracking-wider">APPROVER</th>
              <th className="px-4 py-2 font-normal tracking-wider text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentApprovals.map((approval) => {
              const domainName = domains[approval.domainId] || "UNKNOWN";
              const flightCode = (domainName.substring(0, 2) + approval.id.substring(0, 3)).toUpperCase();
              const status = STATUS_MAP[approval.status] || { label: approval.status.toUpperCase(), color: "text-gray-400" };
              const approver = approval.approverIds.length > 0 
                ? users.find(u => u.id === approval.approverIds[0])?.name.split(" ")[0].toUpperCase() 
                : "AUTO";

              return (
                <tr key={approval.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatTime(approval.submittedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-900 font-medium">
                    <Link 
                      href={`/dashboard/approvals/${approval.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {flightCode}
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-600" title={approval.title}>
                    <Link 
                      href={`/dashboard/approvals/${approval.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {approval.title.toUpperCase()}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {approver}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-bold ${status.color}`}>
                    {status.label}
                  </td>
                </tr>
              );
            })}
            {recentApprovals.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        NO APPROVALS SCHEDULED
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-4 py-2 text-center border-t border-slate-100">
        <span className="font-mono text-xs text-slate-400">PLEASE CHECK APPROVER INFORMATION ON SCREENS</span>
      </div>
    </div>
  );
}
