import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { PageHeaderMount } from "@/components/page-header";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function RulesPage() {
  const [domains, users, flows] = await Promise.all([
    prisma.domain.findMany({
      include: { subdomains: true },
    }),
    prisma.user.findMany(),
    prisma.approvalFlow.findMany({
      include: {
        subdomain: {
          include: {
            domain: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  ]);

  const totalSubdomains = domains.reduce(
    (acc, domain) => acc + domain.subdomains.length,
    0,
  );

  return (
    <>
      <PageHeaderMount
        eyebrow="Rules"
        title="Rules"
        description="Browse governed flows by domain, then sketch fresh variations with the node-inspired builder."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Approval Flows"
          value={flows.length}
          subtitle="Total flow definitions created"
        />
        <StatCard
          title="Domains"
          value={domains.length}
          subtitle="Total approval domains configured"
        />
        <StatCard
          title="Subdomains governed"
          value={totalSubdomains}
          subtitle="Granular approval surfaces tracked"
        />
        <StatCard
          title="Users"
          value={users.length}
          subtitle="Total users in the system"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Approval flow catalog
            </h2>
            <p className="text-sm text-slate-500">
              Domain and subdomain journey definitions, with stage counts,
              notification coverage, and latest update timestamps.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/rules/new"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-600"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 4.167v11.666M4.167 10h11.666"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Create new rule
            </Link>
            <Link
              href="/dashboard/rules/sandbox"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14m7-7H5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              Flow evaluation sandbox
            </Link>
          </div>
        </header>
        
        {flows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-600 mb-4">No flows created yet. Create your first approval flow to get started.</p>
            <Link
              href="/dashboard/rules/new"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-600"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 4.167v11.666M4.167 10h11.666"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Create your first flow
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Flow Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Subdomain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Stages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flows.map((flow) => {
                  const definition = flow.definition as any;
                  const stageCount = definition?.stages?.length ?? 0;
                  
                  return (
                    <tr key={flow.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{flow.name}</div>
                        <div className="text-sm text-slate-500">{flow.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {flow.subdomain.domain.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {flow.subdomain.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          v{flow.version}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {stageCount} {stageCount === 1 ? 'stage' : 'stages'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {dateFormatter.format(new Date(flow.updatedAt))}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/rules/new?flowId=${flow.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
