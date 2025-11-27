import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import type { ApprovalStatus, User } from "@/types";
import { StatusBadge } from "@/components/status-badge";
import { PageHeaderMount } from "@/components/page-header";

const STATUS_ORDER: ApprovalStatus[] = [
  "in_process",
  "approved",
  "reject",
  "end",
];

const ROLE_STYLES: Record<string, string> = {
  "Product Owner": "bg-sky-50 text-sky-700 border-sky-200",
  "Operations Approver": "bg-violet-50 text-violet-700 border-violet-200",
  Admin: "bg-slate-900 text-white border-slate-900",
  "Category Manager": "bg-blue-50 text-blue-700 border-blue-200",
  "Compliance Approver": "bg-amber-50 text-amber-700 border-amber-200",
  "Procurement Ops": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Budget Approver": "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const DEFAULT_ROLE_STYLE =
  "bg-slate-200 text-slate-700 border-slate-200";

const ITEMS_PER_PAGE = 5;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

  // Fetch data from database
  const [users, approvals, domains, totalUsers] = await Promise.all([
    prisma.user.findMany({
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.approval.findMany(),
    prisma.domain.findMany({
      include: { subdomains: true },
    }),
    prisma.user.count(),
  ]);
  
  const usersById = Object.fromEntries(users.map((user) => [user.id, user]));
  const domainMap = Object.fromEntries(
    domains.map((domain) => [domain.id, domain.name]),
  );
  const subdomainMap = Object.fromEntries(
    domains.flatMap((domain) =>
      domain.subdomains.map((subdomain) => [
        subdomain.id,
        `${domain.name} · ${subdomain.name}`,
      ]),
    ),
  );

  const userDetails = users.map((user) => {
    const requested = approvals.filter(
      (approval) => approval.requesterId === user.id,
    );
    
    // Get last active timestamp from most recent submission or approval
    const userApprovals = approvals.filter(
      (approval) => approval.requesterId === user.id || approval.approverIds.includes(user.id)
    );
    const lastActive = userApprovals.length > 0
      ? new Date(Math.max(...userApprovals.map(a => new Date(a.lastUpdatedAt).getTime())))
      : null;

    // Get unique domains and subdomains from user's approvals
    const userDomainSubdomains = new Set(
      userApprovals.map(approval => ({
        domain: domainMap[approval.domainId] || "Unknown",
        subdomain: subdomainMap[approval.subdomainId] || "Unknown",
      }))
    );

    const supervisor =
      user.supervisorId ? usersById[user.supervisorId] : undefined;

    return {
      ...user,
      requestedCount: requested.length,
      lastActive,
      domainSubdomains: Array.from(userDomainSubdomains),
      supervisor,
    };
  });

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <>
      <PageHeaderMount
        eyebrow="Users"
        title="Users"
        description="Track workload, reviewer coverage, and submission volume for every teammate involved in approvals."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active users"
          value={users.length}
          subtitle="Collaborators across roles"
        />
        <StatCard
          title="Total approvals requested"
          value={approvals.length}
          subtitle="Volume initiated by requesters"
        />
        <StatCard
          title="Average approvals per approver"
          value={computeAverageApprovalsPerApprover(users, approvals)}
          subtitle="Workload distribution"
        />
        <StatCard
          title="Approvals awaiting action"
          value={
            approvals.filter((approval) => approval.status === "in_process")
              .length
          }
          subtitle="Pending reviewer decisions"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Domains</th>
                <th className="px-6 py-3 font-semibold">Requests submitted</th>
                <th className="px-6 py-3 font-semibold">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userDetails.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                    <div className="text-xs text-slate-400">
                      Supervisor: {user.supervisor?.name ?? "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${ROLE_STYLES[user.role] ?? DEFAULT_ROLE_STYLE}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.domainSubdomains.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {user.domainSubdomains.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                          >
                            {item.subdomain}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No domains</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {user.requestedCount}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.lastActive ? (
                      <div className="text-sm text-slate-700">
                        {new Date(user.lastActive).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <div className="text-xs text-slate-500">
                          {new Date(user.lastActive).toLocaleTimeString("en", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No activity</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
              <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)}</span> of{" "}
              <span className="font-semibold">{totalUsers}</span> users
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/dashboard/users?page=${currentPage - 1}`}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  hasPrevPage
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </a>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <a
                      key={pageNum}
                      href={`/dashboard/users?page=${pageNum}`}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                        pageNum === currentPage
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </a>
                  );
                })}
              </div>

              <a
                href={`/dashboard/users?page=${currentPage + 1}`}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  hasNextPage
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                }`}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function computeAverageApprovalsPerApprover(
  users: User[],
  approvals: { approverIds: string[] }[],
) {
  const approvers = users.filter((user) =>
    /approver/i.test(user.role),
  );
  if (approvers.length === 0) {
    return "0.0";
  }

  const totals: Record<string, number> = {};
  approvals.forEach((approval) => {
    approval.approverIds.forEach((approverId) => {
      totals[approverId] = (totals[approverId] ?? 0) + 1;
    });
  });

  const avg =
    approvers.reduce((sum, approver) => sum + (totals[approver.id] ?? 0), 0) /
    approvers.length;
  return avg.toFixed(1);
}
