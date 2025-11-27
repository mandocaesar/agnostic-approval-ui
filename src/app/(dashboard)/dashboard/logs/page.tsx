import { prisma } from "@/lib/prisma";
import { PageHeaderMount } from "@/components/page-header";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "medium",
});

const LEVEL_STYLES: Record<string, string> = {
  info: "border border-sky-200 bg-sky-50 text-sky-700",
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  error: "border border-rose-200 bg-rose-50 text-rose-700",
};

export default async function LogsPage() {
  const logs = await prisma.logEntry.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeaderMount
        eyebrow="Logs"
        title="Logs"
        description="Traceable record of significant approval events and system signals."
      />
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {logs.map((log) => {
            const levelClass =
              LEVEL_STYLES[log.level] ??
              "border border-slate-200 bg-slate-50 text-slate-600";
            return (
            <article
              key={log.id}
              className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClass}`}
                  >
                    {log.level}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {log.message}
                  </span>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-500 underline decoration-dotted underline-offset-4">
                    View context
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950/90 px-4 py-3 text-xs text-slate-100">
{JSON.stringify(log.context, null, 2)}
                  </pre>
                </details>
              </div>
              <time className="text-sm text-slate-500">
                {dateFormatter.format(new Date(log.timestamp))}
              </time>
            </article>
          );})}
          {logs.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No log entries captured in the mock dataset.
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
