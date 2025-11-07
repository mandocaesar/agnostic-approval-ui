import { readData } from "@/lib/dataStore";
import { StatCard } from "@/components/stat-card";
import type { ApprovalStatus, User } from "@/types";
import { StatusBadge } from "@/components/status-badge";
import { PageHeaderMount } from "@/components/page-header";

const STATUS_ORDER: ApprovalStatus[] = ["draft", "waiting", "approved", "reject"];

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

export default async function UsersPage() {
  const data = await readData();
  const usersById = Object.fromEntries(data.users.map((user) => [user.id, user]));
  const domainMap = Object.fromEntries(
    data.domains.map((domain) => [domain.id, domain.name]),
  );
  const subdomainMap = Object.fromEntries(
    data.domains.flatMap((domain) =>
      domain.subdomains.map((subdomain) => [
        subdomain.id,
        `${domain.name} · ${subdomain.name}`,
      ]),
    ),
  );

  const userDetails = data.users.map((user) => {
    const requested = data.approvals.filter(
      (approval) => approval.requesterId === user.id,
    );
    const approvalsByStatus = requested.reduce<Record<ApprovalStatus, number>>(
      (acc, approval) => {
        acc[approval.status] += 1;
        return acc;
      },
      {
        draft: 0,
        waiting: 0,
        approved: 0,
        reject: 0,
      },
    );

    const approvalsToReview = data.approvals.filter((approval) =>
      approval.approverIds.includes(user.id),
    );

    const domainCoverage = new Set(
      approvalsToReview.map(
        (approval) =>
          subdomainMap[approval.subdomainId] ??
          domainMap[approval.domainId] ??
          approval.subdomainId,
      ),
    );
    const supervisor =
      user.supervisorId ? usersById[user.supervisorId] : undefined;

    return {
      ...user,
      requested,
      approvalsByStatus,
      approvalsToReview,
      domainCoverage,
      supervisor,
    };
  });

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
          value={data.users.length}
          subtitle="Collaborators across roles"
        />
        <StatCard
          title="Total approvals requested"
          value={data.approvals.length}
          subtitle="Volume initiated by requesters"
        />
        <StatCard
          title="Average approvals per approver"
          value={computeAverageApprovalsPerApprover(data.users, data.approvals)}
          subtitle="Workload distribution"
        />
        <StatCard
          title="Approvals awaiting action"
          value={
            data.approvals.filter((approval) => approval.status === "waiting")
              .length
          }
          subtitle="Pending reviewer decisions"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            User roster
          </h2>
          <p className="text-sm text-slate-500">
            Roles, load, and approval coverage for each teammate.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Requests submitted</th>
                <th className="px-6 py-3 font-semibold">Approvals to review</th>
                <th className="px-6 py-3 font-semibold">Domain coverage</th>
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
                    <div className="flex flex-col gap-2">
                      {STATUS_ORDER.map((status) => (
                        <div
                          key={`${user.id}-submissions-${status}`}
                          className="flex items-center gap-2"
                        >
                          <StatusBadge status={status} />
                          <span className="text-sm font-semibold text-slate-600">
                            {user.approvalsByStatus[status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {user.approvalsToReview.length > 0 ? (
                      <>
                        <div className="font-semibold text-slate-800">
                          {user.approvalsToReview.length} assigned
                        </div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
                          {user.approvalsToReview.slice(0, 3).map((approval) => (
                            <li key={approval.id}>{approval.title}</li>
                          ))}
                          {user.approvalsToReview.length > 3 ? (
                            <li>+ more</li>
                          ) : null}
                        </ul>
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">
                        None assigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {user.domainCoverage.size > 0 ? (
                      Array.from(user.domainCoverage).join(", ")
                    ) : (
                      <span className="text-sm text-slate-500">
                        — no reviewer coverage —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
