import Link from "next/link";
import { readData } from "@/lib/dataStore";
import { StatCard } from "@/components/stat-card";
import { buildFlowNotifications } from "@/lib/notificationEngine";
import { PageHeaderMount } from "@/components/page-header";
import { RuleCatalogTable, type RuleCatalogEntry } from "@/components/rule-catalog-table";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function RulesPage() {
  const data = await readData();

  const flowEntries = data.domains.flatMap((domain) =>
    domain.subdomains.flatMap((subdomain) =>
      subdomain.flows.map((flow) => ({
        domain,
        subdomain,
        flow,
      })),
    ),
  );

  const totalFlows = flowEntries.length;
  const totalSubdomains = data.domains.reduce(
    (acc, domain) => acc + domain.subdomains.length,
    0,
  );
  const latestFlow = flowEntries
    .slice()
    .sort(
      (a, b) =>
        new Date(b.flow.updatedAt).getTime() -
        new Date(a.flow.updatedAt).getTime(),
    )[0];
  const totalNotifications = flowEntries.reduce((acc, entry) => {
    const notifications = buildFlowNotifications(entry.flow, {
      domain: entry.domain,
      subdomain: entry.subdomain,
      users: data.users,
    });
    return acc + notifications.length;
  }, 0);
  const latestUpdateDisplay = latestFlow
    ? dateFormatter.format(new Date(latestFlow.flow.updatedAt))
    : "N/A";

  const tableEntries: RuleCatalogEntry[] = flowEntries.map(
    ({ domain, subdomain, flow }) => {
      const notifications = buildFlowNotifications(flow, {
        domain,
        subdomain,
        users: data.users,
      });
      return {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        domainLabel: domain.name,
        subdomainLabel: subdomain.name,
        version: flow.version,
        stageCount: flow.definition.stages.length,
        notificationCount: notifications.length,
        updatedAt: dateFormatter.format(new Date(flow.updatedAt)),
      };
    },
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
          title="Approval flow blueprints"
          value={totalFlows}
          subtitle="Reusable flow definitions across domains"
        />
        <StatCard
          title="Subdomains governed"
          value={totalSubdomains}
          subtitle="Granular approval surfaces tracked"
        />
        <StatCard
          title="Notification hooks"
          value={totalNotifications}
          subtitle="Stage-level supervisor alerts configured"
        />
        <StatCard
          title="Latest blueprint update"
          value={latestUpdateDisplay}
          subtitle="Most recent change to a flow definition"
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
        <RuleCatalogTable entries={tableEntries} />
      </section>
    </>
  );
}
