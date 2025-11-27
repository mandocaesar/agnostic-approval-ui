import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";
import path from "path";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const dataPath = path.join(process.cwd(), "src", "data", "mockData.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    console.log("Seeding database...");

    // Seed Users
    for (const user of data.users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                supervisorId: user.supervisorId,
            },
        });
    }
    console.log(`Seeded ${data.users.length} users`);

    // Seed Domains and Subdomains
    for (const domain of data.domains) {
        const createdDomain = await prisma.domain.upsert({
            where: { id: domain.id },
            update: {},
            create: {
                id: domain.id,
                name: domain.name,
                description: domain.description,
                tags: domain.tags || [],
                owner: domain.owner || {},
                connectivity: domain.connectivity || {},
            },
        });

        for (const subdomain of domain.subdomains) {
            await prisma.subdomain.upsert({
                where: { id: subdomain.id },
                update: {},
                create: {
                    id: subdomain.id,
                    name: subdomain.name,
                    description: subdomain.description,
                    domainId: createdDomain.id,
                    tags: subdomain.tags || [],
                    owner: subdomain.owner || {},
                    connectivity: subdomain.connectivity || {},
                },
            });

            // Seed Flows for Subdomain
            if (subdomain.flows) {
                for (const flow of subdomain.flows) {
                    await prisma.approvalFlow.upsert({
                        where: { id: flow.id },
                        update: {},
                        create: {
                            id: flow.id,
                            name: flow.name,
                            version: flow.version,
                            description: flow.description,
                            definition: flow.definition as any,
                            metadata: flow.metadata || {},
                            subdomainId: subdomain.id,
                        }
                    })
                }
            }
        }
    }
    console.log(`Seeded ${data.domains.length} domains`);

    // Seed Approvals
    for (const approval of data.approvals) {
        // Find the subdomain to get a flow
        const subdomain = data.domains
            .flatMap(d => d.subdomains)
            .find(s => s.id === approval.subdomainId);
        
        if (!subdomain || !subdomain.flows || subdomain.flows.length === 0) {
            console.warn(`Skipping approval ${approval.id} because subdomain ${approval.subdomainId} has no flows`);
            continue;
        }

        // Use the first flow from the subdomain
        const flowId = subdomain.flows[0].id;

        await prisma.approval.upsert({
            where: { id: approval.id },
            update: {},
            create: {
                id: approval.id,
                title: approval.title,
                domainId: approval.domainId,
                subdomainId: approval.subdomainId,
                flowId: flowId,
                requesterId: approval.requesterId,
                approverIds: approval.approverIds,
                status: approval.status,
                currentStageId: approval.currentStageId || null,
                payload: approval.payload || {},
                metadata: approval.metadata || {},
                submittedAt: new Date(approval.submittedAt),
                lastUpdatedAt: new Date(approval.lastUpdatedAt),
                completedAt: approval.completedAt ? new Date(approval.completedAt) : null,
            },
        });
    }
    console.log(`Seeded ${data.approvals.length} approvals`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
