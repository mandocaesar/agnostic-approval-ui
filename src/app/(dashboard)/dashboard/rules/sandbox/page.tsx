import Link from "next/link";
import { readData } from "@/lib/dataStore";
import { RuleTester } from "@/components/rule-tester";
import { PageHeaderMount } from "@/components/page-header";

export default async function RuleSandboxPage() {
  const data = await readData();

  return (
    <>
      <PageHeaderMount
        eyebrow="Rules Sandbox"
        title="Flow Evaluation Sandbox"
        description="Explore approval flow definitions, preview notifications, and test path validity with explicit start and end states."
        actions={
          <Link
            href="/dashboard/rules"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            ← Back to Rules Catalog
          </Link>
        }
      />
      <div className="flex flex-col gap-6">
        <RuleTester domains={data.domains} users={data.users} />
      </div>
    </>
  );
}
