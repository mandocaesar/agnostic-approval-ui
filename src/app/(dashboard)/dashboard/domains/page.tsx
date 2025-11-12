import { readData } from "@/lib/dataStore";
import { StatCard } from "@/components/stat-card";
import type { ApprovalStatus } from "@/types";
import { StatusBadge } from "@/components/status-badge";
import { buildFlowNotifications } from "@/lib/notificationEngine";
import { PageHeaderMount } from "@/components/page-header";

const STATUS_ORDER: ApprovalStatus[] = [
  "in_process",
  "approved",
  "reject",
  "end",
];

export default async function DomainsPage() {
  const data = await readData();
  const users = data.users;

  const totals = data.domains.map((domain) => {
    const domainApprovals = data.approvals.filter(
      (approval) => approval.domainId === domain.id,
    );
    const domainFlows = domain.subdomains.flatMap(
      (subdomain) => subdomain.flows,
    );
    const notificationCount = domain.subdomains.reduce((acc, subdomain) => {
      return (
        acc +
        subdomain.flows.reduce((flowSum, flow) => {
          const notifications = buildFlowNotifications(flow, {
            domain,
            subdomain,
            users,
          });
          return flowSum + notifications.length;
        }, 0)
      );
    }, 0);

    const statusCounts = domainApprovals.reduce<
      Record<ApprovalStatus, number>
    >(
      (acc, approval) => {
        acc[approval.status] += 1;
        return acc;
      },
      {
        in_process: 0,
        approved: 0,
        reject: 0,
        end: 0,
      },
    );

    return {
      domain,
      flows: domainFlows,
      approvals: domainApprovals,
      notificationCount,
      statusCounts,
    };
  });

  const totalApprovals = data.approvals.length;
  const totalDomains = data.domains.length;
  const totalFlows = totals.reduce(
    (acc, item) => acc + item.flows.length,
    0,
  );
  const totalNotifications = totals.reduce(
    (acc, item) => acc + item.notificationCount,
    0,
  );

  return (
    <>
      <PageHeaderMount
        eyebrow="Domains"
        title="Domains"
        description="Review governance coverage for every domain, including subdomains, flows, and notification density."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Domains under governance"
          value={totalDomains}
          subtitle="Distinct approval areas"
        />
        <StatCard
          title="Configured flow definitions"
          value={totalFlows}
          subtitle="Per-domain approval logic"
        />
        <StatCard
          title="Approvals catalogued"
          value={totalApprovals}
          subtitle="Cross-domain throughput"
        />
        <StatCard
          title="Email notifications"
          value={totalNotifications}
          subtitle="Supervisor alerts configured across stages"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Domain overview
          </h2>
          <p className="text-sm text-slate-500">
            Compare governed areas side by side, including flow coverage,
            notification density, and current approval distribution.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Domain</th>
                <th className="px-6 py-3 font-semibold">Status Distribution</th>
                <th className="px-6 py-3 font-semibold">Subdomains · Flows</th>
                <th className="px-6 py-3 font-semibold">Notifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {totals.map(
                ({
                  domain,
                  flows,
                  approvals,
                  statusCounts,
                  notificationCount,
                }) => (
                  <tr key={domain.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">
                        {domain.name}
                      </div>
                      <p className="text-xs text-slate-500">
                        {domain.description}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                        {flows.length} flows · {approvals.length} approvals
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        {STATUS_ORDER.map((status) => (
                          <span
                            key={`${domain.id}-${status}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                          >
                            <StatusBadge status={status} />
                            {statusCounts[status]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <ul className="space-y-2 text-xs text-slate-600">
                        {domain.subdomains.map((subdomain) => (
                          <li key={subdomain.id}>
                            <div className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {subdomain.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {subdomain.description}
                                </p>
                              </div>
                              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                                {subdomain.flows.length} flow(s)
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">
                        {notificationCount} notification(s)
                      </div>
                      <p className="text-xs text-slate-500">
                        Supervisor alerts across every stage
                      </p>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
