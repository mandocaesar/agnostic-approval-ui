import { prisma } from "@/lib/prisma";
import { mq } from "@/lib/queue";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { action, comment, userId, userName } = await request.json();

        // Validate action
        if (!["approve", "reject", "return"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be: approve, reject, or return" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // Get current approval
        const approval = await prisma.approval.findUnique({ where: { id } });
        if (!approval) {
            return NextResponse.json({ error: "Approval not found" }, { status: 404 });
        }

        // Determine new status based on action
        let newStatus = approval.status;
        if (action === "approve") {
            newStatus = "approved";
        } else if (action === "reject") {
            newStatus = "reject";
        }
        // "return" keeps status as "in_process"

        // Update metadata with comment
        const metadata = (approval.metadata as any) || {};
        const comments = metadata.comments || [];

        comments.push({
            stageId: approval.currentStageId || "",
            userId,
            userName: userName || "Unknown User",
            comment: comment || "",
            action,
            timestamp: new Date().toISOString(),
        });

        // Update approval
        const updated = await prisma.approval.update({
            where: { id },
            data: {
                status: newStatus,
                metadata: {
                    ...metadata,
                    comments,
                },
                completedAt: action === "approve" || action === "reject" ? new Date() : null,
            },
        });

        // Publish event to message queue
        await mq.publish("approval-events", `approval.${action}`, {
            approvalId: updated.id,
            action,
            userId,
            comment,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to perform approval action:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
