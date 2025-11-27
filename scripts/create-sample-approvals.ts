import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Use environment variable or default connection string
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/approval";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createSampleApprovals() {
  console.log("🚀 Creating sample approval requests...\n");

  try {
    // Get existing data
    const [domains, users] = await Promise.all([
      prisma.domain.findMany({ include: { subdomains: true } }),
      prisma.user.findMany(),
    ]);

    if (domains.length === 0) {
      console.error("❌ No domains found. Please run seed first.");
      process.exit(1);
    }

    if (users.length === 0) {
      console.error("❌ No users found. Please run seed first.");
      process.exit(1);
    }

    // Get flows for each subdomain
    const flowsData = await Promise.all(
      domains.flatMap((domain) =>
        domain.subdomains.map((subdomain) =>
          prisma.approvalFlow.findFirst({
            where: { subdomainId: subdomain.id },
          }).then((flow) => ({ domain, subdomain, flow }))
        )
      )
    );

    const validFlows = flowsData.filter((f) => f.flow !== null);

    if (validFlows.length === 0) {
      console.error("❌ No flows found. Please create flows first.");
      process.exit(1);
    }

    console.log(`📊 Found ${validFlows.length} flows to create approvals for\n`);

    // Sample approval scenarios
    const approvalScenarios = [
      {
        title: "Emergency Server Maintenance",
        payload: {
          type: "maintenance",
          server: "prod-api-01",
          duration: "2 hours",
          impact: "high",
          reason: "Critical security patch deployment",
          scheduledTime: "2025-11-28T02:00:00Z",
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
          quarter: "Q1-2026",
        },
      },
      {
        title: "New Feature Deployment",
        payload: {
          feature: "User Analytics Dashboard",
          environment: "production",
          estimatedUsers: 5000,
          riskLevel: "medium",
          rollbackPlan: true,
          deploymentDate: "2025-12-01",
        },
      },
      {
        title: "Contract Renewal Approval",
        payload: {
          vendor: "Cloud Services Inc",
          contractValue: 75000,
          term: "12 months",
          previousValue: 60000,
          savings: 0,
          justification: "Increased usage and storage needs",
        },
      },
      {
        title: "Database Schema Change",
        payload: {
          database: "users_db",
          changeType: "add_column",
          affectedTables: ["users", "user_profiles"],
          backupCompleted: true,
          estimatedDowntime: "5 minutes",
          reversible: true,
        },
      },
      {
        title: "Marketing Campaign Budget",
        payload: {
          campaign: "Q4 Product Launch",
          budget: 25000,
          channels: ["social_media", "email", "paid_ads"],
          expectedROI: "3x",
          duration: "30 days",
          targetAudience: "B2B SaaS companies",
        },
      },
      {
        title: "Security Policy Update",
        payload: {
          policyName: "Remote Access Policy",
          changes: ["Add MFA requirement", "Update VPN protocols"],
          affectedUsers: 150,
          effectiveDate: "2025-12-15",
          complianceRequirement: "ISO 27001",
        },
      },
      {
        title: "Vendor Onboarding Request",
        payload: {
          vendorName: "Analytics Pro LLC",
          service: "Business Intelligence Tools",
          monthlyFee: 5000,
          contractLength: "24 months",
          dataAccess: "read-only",
          securityReviewCompleted: true,
        },
      },
      {
        title: "Infrastructure Upgrade",
        payload: {
          component: "Load Balancer",
          currentCapacity: "10k req/sec",
          newCapacity: "50k req/sec",
          cost: 12000,
          implementation: "zero-downtime",
          vendor: "AWS",
        },
      },
      {
        title: "Employee Hardware Request",
        payload: {
          requestor: "John Doe",
          equipment: "MacBook Pro M3",
          quantity: 1,
          unitPrice: 3500,
          justification: "Current laptop is 4 years old",
          urgency: "medium",
        },
      },
    ];

    // Create approvals
    const createdApprovals = [];

    for (let i = 0; i < Math.min(15, approvalScenarios.length); i++) {
      const scenario = approvalScenarios[i % approvalScenarios.length];
      const flowData = validFlows[i % validFlows.length];
      const requester = users[i % users.length];

      if (!flowData.flow) continue;

      const flowDefinition = flowData.flow.definition as any;
      const firstStage = flowDefinition.stages?.[0];

      if (!firstStage) {
        console.warn(`⚠️  Flow ${flowData.flow.name} has no stages, skipping...`);
        continue;
      }

      // Determine approvers based on flow definition
      const approverIds: string[] = [];
      if (firstStage.actorUserId) {
        approverIds.push(firstStage.actorUserId);
      } else {
        // Assign random approvers
        const numApprovers = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numApprovers; j++) {
          const approver = users[(i + j + 1) % users.length];
          if (!approverIds.includes(approver.id)) {
            approverIds.push(approver.id);
          }
        }
      }

      // Randomly set status and stage
      const statusOptions = ["in_process", "in_process", "in_process", "approved", "reject"] as const;
      const status = statusOptions[i % statusOptions.length];
      
      let currentStageId = firstStage.id;
      let completedAt = null;

      if (status === "approved" || status === "reject") {
        completedAt = new Date(Date.now() - Math.random() * 86400000 * 3); // Random time in last 3 days
      } else if (status === "in_process" && flowDefinition.stages.length > 1) {
        // Randomly advance to middle stages
        const stageIndex = Math.floor(Math.random() * (flowDefinition.stages.length - 1));
        currentStageId = flowDefinition.stages[stageIndex].id;
      }

      const approval = await prisma.approval.create({
        data: {
          title: `${scenario.title} ${i + 1}`,
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
          submittedAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Random time in last 7 days
          completedAt,
        },
      });

      createdApprovals.push(approval);

      const statusEmoji = status === "approved" ? "✅" : status === "reject" ? "❌" : "⏳";
      console.log(
        `${statusEmoji} Created: "${approval.title}" - ${flowData.domain.name}/${flowData.subdomain.name} [${status}]`
      );
    }

    console.log(`\n✨ Successfully created ${createdApprovals.length} sample approvals!`);
    console.log(`\n📋 Summary:`);
    console.log(`   - In Process: ${createdApprovals.filter((a) => a.status === "in_process").length}`);
    console.log(`   - Approved: ${createdApprovals.filter((a) => a.status === "approved").length}`);
    console.log(`   - Rejected: ${createdApprovals.filter((a) => a.status === "reject").length}`);
  } catch (error) {
    console.error("❌ Error creating sample approvals:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createSampleApprovals()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  });
