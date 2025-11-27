import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subdomainId = searchParams.get("subdomainId");
        const domainId = searchParams.get("domainId");

        let where: any = {};

        if (subdomainId) {
            where.subdomainId = subdomainId;
        } else if (domainId) {
            // Get all flows for a domain (across all subdomains)
            const subdomains = await prisma.subdomain.findMany({
                where: { domainId },
                select: { id: true },
            });
            where.subdomainId = { in: subdomains.map(s => s.id) };
        }

        const flows = await prisma.approvalFlow.findMany({
            where,
            include: {
                subdomain: {
                    include: {
                        domain: true,
                    },
                },
            },
        });

        return NextResponse.json(flows);
    } catch (error) {
        console.error("Failed to fetch flows:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name || !body.subdomainId || !body.definition) {
            return NextResponse.json(
                { error: "Missing required fields: name, subdomainId, definition" },
                { status: 400 }
            );
        }

        const version = body.version || "1.0.0";

        // Create flow and first version in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the flow
            const flow = await tx.approvalFlow.create({
                data: {
                    name: body.name,
                    version,
                    description: body.description || "",
                    subdomainId: body.subdomainId,
                    definition: body.definition,
                    metadata: body.metadata || {},
                },
            });

            // Create the first version
            const firstVersion = await tx.flowVersion.create({
                data: {
                    flowId: flow.id,
                    version,
                    name: body.name,
                    description: body.description || "Initial version",
                    definition: body.definition,
                    metadata: body.metadata || {},
                    isActive: true,
                    createdBy: body.createdBy || "system",
                },
            });

            // Update flow with active version reference
            const updatedFlow = await tx.approvalFlow.update({
                where: { id: flow.id },
                data: { activeVersionId: firstVersion.id },
            });

            // Create log entry for flow creation
            await tx.logEntry.create({
                data: {
                    level: "info",
                    message: `New flow created: ${flow.name}`,
                    context: {
                        flowId: flow.id,
                        flowName: flow.name,
                        version: flow.version,
                        subdomainId: flow.subdomainId,
                        createdBy: body.createdBy || "system",
                        timestamp: new Date().toISOString(),
                    },
                },
            });

            return { flow: updatedFlow, version: firstVersion };
        });

        return NextResponse.json(result.flow, { status: 201 });
    } catch (error) {
        console.error("Failed to create flow:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
