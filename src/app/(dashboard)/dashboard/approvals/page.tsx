import { readData } from "@/lib/dataStore";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import type { ApprovalStatus } from "@/types";
import { PageHeaderMount } from "@/components/page-header";

const STATUS_ORDER: ApprovalStatus[] = [
  "in_process",
  "approved",
  "reject",
  "end",
];

const STATUS_TITLES: Record<ApprovalStatus, string> = {
  in_process: "In process",
  approved: "Approved",
  reject: "Reject",
  end: "End",
};

const STATUS_DESCRIPTIONS: Record<ApprovalStatus, string> = {
  in_process: "Requests actively being worked or reviewed.",
  approved: "Successfully cleared review.",
  reject: "Declined and requires action or reroute.",
  end: "Closed out after final decision.",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ApprovalsPage() {
  const data = await readData();
  const domainMap = Object.fromEntries(
    data.domains.map((domain) => [domain.id, domain.name]),
  );
  const subdomainMap = Object.fromEntries(
    data.domains.flatMap((domain) =>
      domain.subdomains.map((subdomain) => [subdomain.id, subdomain.name]),
    ),
  );
  const userMap = Object.fromEntries(
    data.users.map((user) => [user.id, user.name]),
  );

  const statusTotals = data.approvals.reduce<Record<ApprovalStatus, number>>(
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

  const approvals = data.approvals
    .slice()
    .sort(
      (a, b) =>
        new Date(b.lastUpdatedAt).getTime() -
        new Date(a.lastUpdatedAt).getTime(),
    );

  const approvalsByStatus = STATUS_ORDER.reduce<
    Record<ApprovalStatus, typeof approvals>
  >(
    (acc, status) => {
      acc[status] = approvals.filter(
        (approval) => approval.status === status,
      );
      return acc;
    },
    {
      in_process: [],
      approved: [],
      reject: [],
      end: [],
    },
  );

  return (
    <>
      <PageHeaderMount
        eyebrow="Approvals"
        title="Approvals"
        description="Monitor request throughput, recent activities, and status distribution across every domain."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <StatCard
            key={status}
            title={STATUS_DESCRIPTIONS[status]}
            value={statusTotals[status]}
            subtitle={`Status: ${STATUS_TITLES[status].toUpperCase()}`}
          />
        ))}
      </section>

      <section className="border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Approval Activity
            </h2>
            <div className="inline-flex items-center border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {approvals.length} total
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Monitor recently submitted approvals and track their decision trail.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-lg items-center gap-3 border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <svg
                className="h-4 w-4 text-slate-400"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m15.5 15.5-3.4-3.4a4.5 4.5 0 1 0-6.36-6.36 4.5 4.5 0 0 0 6.36 6.36l3.4 3.4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="search"
                placeholder="Cari berdasarkan judul, domain, atau requester"
                className="w-full border-none bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Filter
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-[#0d1d3b] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#132a52]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4.167 4.167h11.666M5.833 7.5v7.083c0 .23.092.451.256.614.163.164.385.256.614.256h6.594c.23 0 .45-.092.614-.256.164-.163.256-.384.256-.614V7.5M8.333 7.5V5.833h3.334V7.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-500">Request</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Domain</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Requester</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Approvers</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvals.map((approval) => (
                <tr key={approval.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {approval.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      #{approval.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">
                      {domainMap[approval.domainId] ?? "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {subdomainMap[approval.subdomainId] ?? "— subdomain —"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {userMap[approval.requesterId] ?? "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {approval.approverIds.length > 0
                      ? approval.approverIds
                          .map((id) => userMap[id] ?? "Unknown")
                          .join(", ")
                      : "Not assigned"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={approval.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {dateFormatter.format(new Date(approval.lastUpdatedAt))}
                  </td>
                </tr>
              ))}
              {approvals.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-8 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    No approvals recorded in the mock data set.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Menampilkan 1 sampai {Math.min(10, approvals.length)} dari {approvals.length} baris</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            >
              «
            </button>
            <button
              type="button"
              className="flex h-8 min-w-[2rem] items-center justify-center border border-[#0d1d3b] bg-white text-sm font-medium text-[#0d1d3b]"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-8 min-w-[2rem] items-center justify-center  border border-transparent bg-white text-sm font-medium text-slate-400 hover:border-slate-200 hover:text-slate-600"
            >
              2
            </button>
            <button
              type="button"
              className="flex h-8 min-w-[2rem] items-center justify-center border border-transparent bg-white text-sm font-medium text-slate-400 hover:border-slate-200 hover:text-slate-600"
            >
              3
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            >
              »
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {STATUS_ORDER.map((status) => (
          <article
            key={status}
            className="border border-slate-200 bg-white shadow-sm"
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-2">
                <StatusBadge status={status} />
                <span className="text-sm text-slate-500">
                  {STATUS_DESCRIPTIONS[status]}
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {statusTotals[status]} item(s)
              </span>
            </header>
            <ul className="divide-y divide-slate-100">
              {approvalsByStatus[status].map((approval) => (
                <li key={approval.id} className="px-6 py-4">
                  <div className="font-medium text-slate-900">
                    {approval.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Requester: {userMap[approval.requesterId] ?? "Unknown"} ·{" "}
                    Domain: {domainMap[approval.domainId] ?? "Unknown"} ·{" "}
                    {subdomainMap[approval.subdomainId] ?? "Subdomain unknown"}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Last updated{" "}
                    {dateFormatter.format(new Date(approval.lastUpdatedAt))}
                  </div>
                </li>
              ))}
              {approvalsByStatus[status].length === 0 ? (
                <li className="px-6 py-8 text-sm text-slate-500">
                  No approvals currently in {STATUS_TITLES[status]} status.
                </li>
              ) : null}
            </ul>
          </article>
        ))}
      </section>
    </>
  );
}
