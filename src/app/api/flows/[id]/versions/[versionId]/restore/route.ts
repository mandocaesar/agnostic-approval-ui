import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; versionId: string }> }
) {
    try {
        const { id, versionId } = await params;

        // Get the version to restore
        const version = await prisma.flowVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.flowId !== id) {
            return NextResponse.json({ error: "Version not found" }, { status: 404 });
        }

        const currentFlow = await prisma.approvalFlow.findUnique({
            where: { id },
        });

        if (!currentFlow) {
            return NextResponse.json({ error: "Flow not found" }, { status: 404 });
        }

        // Deactivate all versions
        await prisma.flowVersion.updateMany({
            where: { flowId: id, isActive: true },
            data: { isActive: false },
        });

        // Mark the selected version as active
        await prisma.flowVersion.update({
            where: { id: versionId },
            data: { isActive: true },
        });

        // Update the flow to match the restored version
        const updatedFlow = await prisma.approvalFlow.update({
            where: { id },
            data: {
                name: version.name,
                version: version.version,
                description: version.description,
                definition: version.definition,
                metadata: version.metadata,
                activeVersionId: versionId,
            },
        });

        return NextResponse.json(updatedFlow);
    } catch (error) {
        console.error("Failed to restore flow version:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
