import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const flow = await prisma.approvalFlow.findUnique({
            where: { id },
            include: {
                subdomain: {
                    include: {
                        domain: true,
                    },
                },
            },
        });

        if (!flow) {
            return NextResponse.json({ error: "Flow not found" }, { status: 404 });
        }

        return NextResponse.json(flow);
    } catch (error) {
        console.error("Failed to fetch flow:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Get current flow to save as version history
        const currentFlow = await prisma.approvalFlow.findUnique({
            where: { id },
        });

        if (!currentFlow) {
            return NextResponse.json({ error: "Flow not found" }, { status: 404 });
        }

        // Deactivate all previous versions
        await prisma.flowVersion.updateMany({
            where: { flowId: id, isActive: true },
            data: { isActive: false },
        });

        // Auto-increment version number
        const currentVersion = currentFlow.version;
        const versionParts = currentVersion.split('.');
        const majorMinor = versionParts.slice(0, 2).join('.');
        const patch = parseInt(versionParts[2] || '0', 10);
        const newVersion = `${majorMinor}.${patch + 1}`;

        // Create version history entry for the current state and mark as active
        const newVersionEntry = await prisma.flowVersion.create({
            data: {
                flowId: id,
                version: newVersion,
                name: body.name,
                description: body.description,
                definition: body.definition,
                metadata: body.metadata,
                isActive: true,
                createdBy: body.createdBy || null,
            },
        });

        // Update the flow with new version (keep main flow in sync with active version)
        const flow = await prisma.approvalFlow.update({
            where: { id },
            data: {
                name: body.name,
                version: newVersion,
                description: body.description,
                definition: body.definition,
                metadata: body.metadata,
                activeVersionId: newVersionEntry.id,
            },
        });

        // Create log entry for flow update
        await prisma.logEntry.create({
            data: {
                level: "info",
                message: `Flow updated: ${flow.name} (${existingFlow.version} → ${newVersion})`,
                context: {
                    flowId: id,
                    flowName: flow.name,
                    previousVersion: existingFlow.version,
                    newVersion: newVersion,
                    updatedBy: body.createdBy || "system",
                    timestamp: new Date().toISOString(),
                },
            },
        });

        return NextResponse.json(flow);
    } catch (error) {
        console.error("Failed to update flow:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if flow is in use
        const approvalsUsingFlow = await prisma.approval.count({
            where: { flowId: id },
        });

        if (approvalsUsingFlow > 0) {
            return NextResponse.json(
                { error: `Cannot delete flow: ${approvalsUsingFlow} approvals are using this flow` },
                { status: 400 }
            );
        }

        await prisma.approvalFlow.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete flow:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
