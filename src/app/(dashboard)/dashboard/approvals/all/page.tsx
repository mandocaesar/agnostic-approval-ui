import { PageHeaderMount } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import type { ApprovalStatus } from "@/types";
import Link from "next/link";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function codeFrom(domainName: string, approvalId: string) {
  const prefix = domainName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, "X");
  return `${prefix}-${approvalId.slice(0, 4).toUpperCase()}`;
}

const STATUS_MAP: Record<ApprovalStatus, { label: string; color: string }> = {
  in_process: { label: "Pending", color: "text-amber-500" },
  approved: { label: "Approved", color: "text-emerald-600" },
  reject: { label: "Rejected", color: "text-rose-600" },
  end: { label: "Completed", color: "text-slate-600" },
};

export default async function ApprovalsAllPage() {
  const [approvals, domains, users] = await Promise.all([
    prisma.approval.findMany({
      orderBy: { lastUpdatedAt: "desc" },
    }),
    prisma.domain.findMany({
      include: { subdomains: true },
    }),
    prisma.user.findMany(),
  ]);

  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d.name]));
  const subdomainMap = Object.fromEntries(
    domains.flatMap((d) => d.subdomains.map((s) => [s.id, { name: s.name, domainName: d.name }]))
  );
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <>
      <PageHeaderMount
        title="Approvals Schedule"
        description="Full list of every approval across domains"
      />

      <div className="space-y-6 p-6">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h2 className="font-mono text-lg font-bold tracking-widest text-slate-900">
              ALL APPROVALS BOARD
            </h2>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              <span className="rounded-full bg-white px-3 py-1 font-mono text-[11px] tracking-[0.2em] text-slate-600 shadow-inner shadow-slate-200">
                {approvals.length} scheduled
              </span>
              <Link
                href="/dashboard/approvals"
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
              >
                Back to overview →
              </Link>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left font-mono text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Flow Code</th>
                  <th className="px-4 py-3 font-medium">Title / Route</th>
                  <th className="px-4 py-3 font-medium">Requester</th>
                  <th className="px-4 py-3 font-medium">Approver</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Last Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {approvals.map((approval) => {
                  const domainName = domainMap[approval.domainId] || "Unknown Domain";
                  const subdomain = subdomainMap[approval.subdomainId];
                  const routeLabel = subdomain ? `${subdomain.domainName} / ${subdomain.name}` : domainName;
                  const requesterName = userMap[approval.requesterId] || "Unknown User";
                  const approverName =
                    approval.approverIds.length > 0
                      ? userMap[approval.approverIds[0]] || "Unassigned"
                      : "Unassigned";
                  const rowCode = codeFrom(domainName, approval.id);
                  const status = STATUS_MAP[approval.status];

                  return (
                    <tr key={approval.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        <div className="font-mono text-xs">{formatTime(approval.submittedAt)}</div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                          {formatDate(approval.submittedAt)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-900 font-semibold">
                        {rowCode}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{approval.title}</div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                          {routeLabel}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {requesterName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {approverName}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 font-bold ${status.color}`}>
                        {status.label}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        <div className="font-mono text-xs">{formatTime(approval.lastUpdatedAt)}</div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                          {formatDate(approval.lastUpdatedAt)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/approvals/${approval.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {approvals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No approvals in the board
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center">
            <span className="font-mono text-xs text-slate-500">
              SDE 2.1 @2025
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
