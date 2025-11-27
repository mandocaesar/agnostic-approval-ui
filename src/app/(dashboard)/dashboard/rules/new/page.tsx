import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeaderMount } from "@/components/page-header";
import { RuleBuilderClient } from "@/components/rule-builder-client";
import type { ApprovalFlow, Domain } from "@/types";

interface NewRulePageProps {
  searchParams: {
    flowId?: string;
    domainId?: string;
    subdomainId?: string;
  };
}

async function findFlowContext(flowId: string | undefined) {
  if (!flowId) {
    return null;
  }
  
  const flow = await prisma.approvalFlow.findUnique({
    where: { id: flowId },
    include: {
      subdomain: {
        include: {
          domain: true,
        },
      },
    },
  });

  if (!flow) {
    return null;
  }

  return {
    flow: flow as any,
    domain: flow.subdomain.domain as any,
    subdomain: flow.subdomain as any,
  };
}

export default async function NewRulePage({ searchParams }: NewRulePageProps) {
  const { flowId, domainId, subdomainId } = await searchParams;
  
  const [users, domains] = await Promise.all([
    prisma.user.findMany(),
    prisma.domain.findMany({
      include: { subdomains: true },
    }),
  ]);

  // Find flow context if editing existing flow
  const flowContext = flowId ? await findFlowContext(flowId) : null;
  const isEditing = Boolean(flowContext);

  // Get selected domain and subdomain if provided
  const selectedDomain = domainId ? domains.find(d => d.id === domainId) : null;
  const selectedSubdomain = subdomainId && selectedDomain 
    ? selectedDomain.subdomains.find(s => s.id === subdomainId) 
    : null;

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
      <RuleBuilderClient
        key={flowContext?.flow.id ?? "create"}
        users={users as any}
        domains={domains as any}
        initialFlowContext={flowContext ?? undefined}
        selectedDomainId={domainId}
        selectedSubdomainId={subdomainId}
      />
    </>
  );
}
