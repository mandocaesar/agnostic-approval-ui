import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🚀 Creating sample approvals...");

    // Get existing data
    const [domains, users] = await Promise.all([
      prisma.domain.findMany({ include: { subdomains: true } }),
      prisma.user.findMany(),
    ]);

    if (domains.length === 0 || users.length === 0) {
      return NextResponse.json(
        { error: "No domains or users found. Please seed database first." },
        { status: 400 }
      );
    }

    // Get flows for subdomains
    const flowsData = await Promise.all(
      domains.flatMap((domain) =>
        domain.subdomains.map(async (subdomain) => {
          const flow = await prisma.approvalFlow.findFirst({
            where: { subdomainId: subdomain.id },
          });
          return { domain, subdomain, flow };
        })
      )
    );

    const validFlows = flowsData.filter((f) => f.flow !== null);

    if (validFlows.length === 0) {
      return NextResponse.json(
        { error: "No flows found. Please create flows first." },
        { status: 400 }
      );
    }

    // Sample scenarios
    const scenarios = [
      {
        title: "Emergency Server Maintenance",
        payload: {
          type: "maintenance",
          server: "prod-api-01",
          duration: "2 hours",
          impact: "high",
          reason: "Critical security patch deployment",
        },
      },
      {
        title: "Budget Increase Request",
        payload: {
          department: "Engineering",
          currentBudget: 100000,
          requestedBudget: 150000,
          increase: 50000,
          reason: "Additional hiring for Q1 2026",
        },
      },
      {
        title: "New Feature Deployment",
        payload: {
          feature: "User Analytics Dashboard",
          environment: "production",
          estimatedUsers: 5000,
          riskLevel: "medium",
        },
      },
      {
        title: "Contract Renewal Approval",
        payload: {
          vendor: "Cloud Services Inc",
          contractValue: 75000,
          term: "12 months",
        },
      },
      {
        title: "Database Schema Change",
        payload: {
          database: "users_db",
          changeType: "add_column",
          affectedTables: ["users", "user_profiles"],
        },
      },
    ];

    const createdApprovals = [];

    for (let i = 0; i < Math.min(10, scenarios.length * 2); i++) {
      const scenario = scenarios[i % scenarios.length];
      const flowData = validFlows[i % validFlows.length];
      const requester = users[i % users.length];

      if (!flowData.flow) continue;

      const flowDefinition = flowData.flow.definition as any;
      const firstStage = flowDefinition.stages?.[0];

      if (!firstStage) continue;

      // Assign approvers
      const approverIds: string[] = [];
      const numApprovers = Math.min(Math.floor(Math.random() * 2) + 1, users.length);
      for (let j = 0; j < numApprovers; j++) {
        const approver = users[(i + j + 1) % users.length];
        if (!approverIds.includes(approver.id)) {
          approverIds.push(approver.id);
        }
      }

      // Random status
      const statusOptions = ["in_process", "in_process", "in_process", "approved", "reject"] as const;
      const status = statusOptions[i % statusOptions.length];

      let currentStageId = firstStage.id;
      let completedAt = null;

      if (status === "approved" || status === "reject") {
        completedAt = new Date(Date.now() - Math.random() * 86400000 * 3);
      } else if (status === "in_process" && flowDefinition.stages.length > 1) {
        const stageIndex = Math.floor(Math.random() * (flowDefinition.stages.length - 1));
        currentStageId = flowDefinition.stages[stageIndex].id;
      }

      const approval = await prisma.approval.create({
        data: {
          title: `${scenario.title} #${i + 1}`,
          domainId: flowData.domain.id,
          subdomainId: flowData.subdomain.id,
          flowId: flowData.flow.id,
          requesterId: requester.id,
          approverIds,
          status,
          currentStageId,
          payload: scenario.payload,
          metadata: {
            iterationCount: Math.floor(Math.random() * 3),
            comments: [],
          },
          submittedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
          completedAt,
        },
      });

      createdApprovals.push({
        id: approval.id,
        title: approval.title,
        status: approval.status,
        domain: flowData.domain.name,
        subdomain: flowData.subdomain.name,
      });
    }

    return NextResponse.json({
      success: true,
      count: createdApprovals.length,
      approvals: createdApprovals,
      summary: {
        inProcess: createdApprovals.filter((a) => a.status === "in_process").length,
        approved: createdApprovals.filter((a) => a.status === "approved").length,
        rejected: createdApprovals.filter((a) => a.status === "reject").length,
      },
    });
  } catch (error) {
    console.error("Error creating sample approvals:", error);
    return NextResponse.json(
      { error: "Failed to create sample approvals", details: String(error) },
      { status: 500 }
    );
  }
}
