import Link from "next/link";
import { readData } from "@/lib/dataStore";
import { PageHeaderMount } from "@/components/page-header";
import { RuleBuilder } from "@/components/rule-builder";
import type { ApprovalFlow, Domain } from "@/types";

interface NewRulePageProps {
  searchParams: {
    flowId?: string;
  };
}

function findFlowContext(domains: Domain[], flowId: string | undefined) {
  if (!flowId) {
    return null;
  }
  for (const domain of domains) {
    for (const subdomain of domain.subdomains) {
      const flow = subdomain.flows.find((item) => item.id === flowId);
      if (flow) {
        return { flow, domain, subdomain } as {
          flow: ApprovalFlow;
          domain: Domain;
          subdomain: Domain["subdomains"][number];
        };
      }
    }
  }
  return null;
}

export default async function NewRulePage({ searchParams }: NewRulePageProps) {
  const data = await readData();
  const flowContext = findFlowContext(data.domains, searchParams.flowId);
  const isEditing = Boolean(flowContext);

  return (
    <>
      <PageHeaderMount
        eyebrow={isEditing ? "Edit rule" : "New rule"}
        title={isEditing ? "Edit approval flow" : "Compose an approval flow"}
        description={
          isEditing
            ? "Update an existing blueprint, adjust actors, and reshare the JSON definition."
            : "Drag stages across the canvas, zoom to inspect, and export JSON for downstream automation."
        }
        actions={
          <Link
            href="/dashboard/rules"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            ← Back to catalog
          </Link>
        }
      />
      <RuleBuilder
        key={flowContext?.flow.id ?? "create"}
        users={data.users}
        domains={data.domains}
        initialFlowContext={flowContext ?? undefined}
      />
    </>
  );
}
