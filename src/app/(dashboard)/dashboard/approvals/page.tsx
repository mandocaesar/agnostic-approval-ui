import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { TrendChart } from "@/components/trend-chart";
import { PageHeaderMount } from "@/components/page-header";
import { AirportScheduleBoard } from "@/components/airport-schedule-board";
import { DomainDistributionChart } from "@/components/domain-distribution-chart";
import type { ApprovalStatus } from "@/types";
import Link from "next/link";

const STATUS_TITLES: Record<ApprovalStatus, string> = {
  in_process: "Pending",
  approved: "Approved",
  reject: "Rejected",
  end: "Completed",
};

function formatDate(date: Date): string {
  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatBoardTime(date: Date): string {
  return date.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function domainCodeFromName(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  if (letters.length === 0) return "DOM";
  if (letters.length < 3) return letters.padEnd(3, "X");
  return letters;
}

export default async function ApprovalsPage() {
  // Fetch data from database
  const [approvals, domains, users] = await Promise.all([
    prisma.approval.findMany({
      orderBy: { lastUpdatedAt: "desc" },
    }),
    prisma.domain.findMany({
      include: { subdomains: true },
    }),
    prisma.user.findMany(),
  ]);

  // Get current date and last month date
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Helper to check if date is in current month
  const isCurrentMonth = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  // Helper to check if date is in last month
  const isLastMonth = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  };

  // Calculate current month stats
  const totalApprovals = approvals.length;
  const totalThisMonth = approvals.filter((a) => isCurrentMonth(a.submittedAt)).length;
  const totalLastMonth = approvals.filter((a) => isLastMonth(a.submittedAt)).length;
  const totalTrend = totalLastMonth > 0
    ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
    : 0;

  const pendingCount = approvals.filter((a) => a.status === "in_process").length;
  const pendingThisMonth = approvals.filter((a) => a.status === "in_process" && isCurrentMonth(a.submittedAt)).length;
  const pendingLastMonth = approvals.filter((a) => a.status === "in_process" && isLastMonth(a.submittedAt)).length;
  const pendingTrend = pendingLastMonth > 0
    ? Math.round(((pendingThisMonth - pendingLastMonth) / pendingLastMonth) * 100)
    : 0;

  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const approvedThisMonth = approvals.filter((a) => a.status === "approved" && isCurrentMonth(a.submittedAt)).length;
  const approvedLastMonth = approvals.filter((a) => a.status === "approved" && isLastMonth(a.submittedAt)).length;
  const approvedTrend = approvedLastMonth > 0
    ? Math.round(((approvedThisMonth - approvedLastMonth) / approvedLastMonth) * 100)
    : 0;

  const rejectedCount = approvals.filter((a) => a.status === "reject").length;
  const rejectedThisMonth = approvals.filter((a) => a.status === "reject" && isCurrentMonth(a.submittedAt)).length;
  const rejectedLastMonth = approvals.filter((a) => a.status === "reject" && isLastMonth(a.submittedAt)).length;
  const rejectedTrend = rejectedLastMonth > 0
    ? Math.round(((rejectedThisMonth - rejectedLastMonth) / rejectedLastMonth) * 100)
    : 0;

  // Domain distribution for chart with consistent colors
  const domainColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const domainCounts = domains.map((domain, index) => ({
    label: domain.name,
    value: approvals.filter((a) => a.domainId === domain.id).length,
    color: domainColors[index % domainColors.length],
  }));
  const domainStatusColors: Record<ApprovalStatus, string> = {
    in_process: "#f59e0b",
    approved: "#10b981",
    reject: "#ef4444",
    end: "#94a3b8",
  };
  const domainStatusBreakdown = domains.map((domain, index) => {
    const approvalsForDomain = approvals.filter((a) => a.domainId === domain.id);
    const statusCounts: Record<ApprovalStatus, number> = {
      in_process: 0,
      approved: 0,
      reject: 0,
      end: 0,
    };

    approvalsForDomain.forEach((approval) => {
      statusCounts[approval.status as ApprovalStatus] += 1;
    });

    const lastUpdatedAt = approvalsForDomain.reduce((latest, approval) => {
      const ts = new Date(approval.lastUpdatedAt).getTime();
      return ts > latest ? ts : latest;
    }, 0);

    const safeTotal = approvalsForDomain.length || 1;

    return {
      id: domain.id,
      name: domain.name,
      color: domainColors[index % domainColors.length],
      total: approvalsForDomain.length,
      statusCounts,
      completion: Math.round(((statusCounts.approved + statusCounts.end) / safeTotal) * 100),
      lastUpdatedAt: lastUpdatedAt ? new Date(lastUpdatedAt) : null,
    };
  });
  const busiestDomain = domainStatusBreakdown
    .slice()
    .sort((a, b) => b.total - a.total)[0];
  const mostInFlightDomain = domainStatusBreakdown
    .slice()
    .sort((a, b) => b.statusCounts.in_process - a.statusCounts.in_process)[0];

  // Trend data (last 12 months) - pure API data
  // Track data for specific domains: Bill Payment, Procurement, IBB
  const billPaymentDomain = domains.find(d => d.name.toLowerCase().includes('bill'));
  const procurementDomain = domains.find(d => d.name.toLowerCase().includes('procurement'));
  const ibbDomain = domains.find(d => d.name.toLowerCase().includes('ibb'));

  const trendData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStr = date.toLocaleDateString("en-US", { month: "short" });

    // Get approvals for each domain for this month
    const getMonthlyDomainCount = (domainId: string | undefined) => {
      if (!domainId) return 0;
      return approvals.filter((approval) => {
        const approvalDate = new Date(approval.submittedAt);
        return approval.domainId === domainId &&
               approvalDate.getFullYear() === year && 
               approvalDate.getMonth() === month;
      }).length;
    };

    const billpayment = getMonthlyDomainCount(billPaymentDomain?.id);
    const procurement = getMonthlyDomainCount(procurementDomain?.id);
    const ibb = getMonthlyDomainCount(ibbDomain?.id);
    
    return { 
      date: monthStr, 
      billpayment,
      procurement,
      ibb,
      count: billpayment + procurement + ibb
    };
  });

  const boardRefreshedAt = now.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Recent approvals (last 10)
  const recentApprovals = approvals
    .slice()
    .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
    .slice(0, 10);

  const domainNameMap = Object.fromEntries(
    domains.map((domain) => [domain.id, domain.name])
  );

  return (
    <>
      <PageHeaderMount
        title="Approvals"
        description="Overview of all approval requests"
      />

      <div className="space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Approvals"
            value={totalApprovals.toString()}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            trend={{
              direction: totalTrend >= 0 ? "up" : "down",
              label: `${totalTrend >= 0 ? '+' : ''}${totalTrend}% from last month`
            }}
          />
          <StatCard
            title="Pending"
            value={pendingCount.toString()}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            trend={{
              direction: pendingTrend >= 0 ? "up" : "down",
              label: `${pendingTrend >= 0 ? '+' : ''}${pendingTrend}% from last month`
            }}
          />
          <StatCard
            title="Approved"
            value={approvedCount.toString()}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            trend={{
              direction: approvedTrend >= 0 ? "up" : "down",
              label: `${approvedTrend >= 0 ? '+' : ''}${approvedTrend}% from last month`
            }}
          />
          <StatCard
            title="Rejected"
            value={rejectedCount.toString()}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            trend={{
              direction: rejectedTrend >= 0 ? "up" : "down",
              label: `${rejectedTrend >= 0 ? '+' : ''}${rejectedTrend}% from last month`
            }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2 lg:h-[calc(100vh-400px)]">
          {/* Left Column: Trend Chart + Recent Approvals */}
          <div className="flex flex-col gap-6 overflow-hidden">
            <TrendChart data={trendData} title="Approvals (Last 30 Days)" height={220} />
            
            <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm min-h-0">
              <div className="border-b border-slate-200/70 px-6 py-4 shrink-0 flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-900">Recent Approvals</div>
                  <p className="text-sm text-slate-600">Latest approval activity</p>
                </div>
                <Link
                  href="/dashboard/approvals/all"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  View All →
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <AirportScheduleBoard 
                  approvals={approvals} 
                  users={users} 
                  domains={domainNameMap} 
                />
              </div>
            </div>
          </div>

          {/* Right Column: Domain Distribution */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-sm min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-6 py-4 shrink-0">
              <div>
                <div className="text-base font-semibold text-slate-900">Approvals by domain</div>
                <p className="text-sm text-slate-600">Volume, clearance, and share per domain</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {busiestDomain ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: busiestDomain.color }} />
                    Volume leader: {busiestDomain.name}
                  </span>
                ) : null}
                {mostInFlightDomain ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-50 shadow-sm ring-1 ring-slate-900/10">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Most in Review: {mostInFlightDomain.name}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
              <div className="space-y-3">
                {domainStatusBreakdown
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .map((domain) => {
                    const safeTotal = Math.max(domain.total, 1);
                    return (
                      <div
                        key={domain.id}
                        className="group rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm ring-1 ring-transparent transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-slate-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold text-slate-900"
                              style={{
                                borderColor: domain.color,
                                backgroundColor: `${domain.color}15`,
                              }}
                            >
                              {domainCodeFromName(domain.name)}
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {domain.name}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                <span className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600">
                                  {domain.total} total
                                </span>
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                                  {domain.completion}% cleared
                                </span>
                                {domain.lastUpdatedAt ? (
                                  <span className="rounded-full bg-slate-100 px-2 py-1">
                                    Updated {formatRelativeTime(domain.lastUpdatedAt)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Flow {domainCodeFromName(domain.name)}
                          </span>
                        </div>

                        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className="h-full"
                            style={{
                              width: `${(domain.statusCounts.approved / safeTotal) * 100}%`,
                              backgroundColor: domainStatusColors.approved,
                            }}
                            aria-hidden
                          />
                          <span
                            className="h-full"
                            style={{
                              width: `${(domain.statusCounts.in_process / safeTotal) * 100}%`,
                              backgroundColor: domainStatusColors.in_process,
                            }}
                            aria-hidden
                          />
                          <span
                            className="h-full"
                            style={{
                              width: `${(domain.statusCounts.reject / safeTotal) * 100}%`,
                              backgroundColor: domainStatusColors.reject,
                            }}
                            aria-hidden
                          />
                          <span
                            className="h-full"
                            style={{
                              width: `${(domain.statusCounts.end / safeTotal) * 100}%`,
                              backgroundColor: domainStatusColors.end,
                            }}
                            aria-hidden
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            Review {domain.statusCounts.in_process}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Approved {domain.statusCounts.approved}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Reject {domain.statusCounts.reject}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                            Completed {domain.statusCounts.end}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
