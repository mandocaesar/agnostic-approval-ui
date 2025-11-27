import { prisma } from "@/lib/prisma";
import { mq } from "@/lib/queue";
import { NextResponse } from "next/server";
import type { ApprovalStatus, ApprovalFlowDefinition, ApprovalFlowStage, FlowTransition } from "@/types";

interface ApprovalMetadata {
  iterationCount?: number;
  previousStageId?: string;
  comments?: Array<{
    stageId: string;
    userId: string;
    userName: string;
    comment: string;
    action: "approve" | "reject" | "return";
    timestamp: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, comment, userId = "system" } = body;

    // Fetch approval with relations
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        flow: true,
        requester: true,
      },
    });

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    // Check if approval is in a final state (approved or rejected)
    if (approval.status === "approved" || approval.status === "reject") {
      return NextResponse.json(
        { error: "Cannot modify approval in final state (approved/rejected)" },
        { status: 400 }
      );
    }

    if (approval.status !== "in_process") {
      return NextResponse.json(
        { error: "Approval is not in process" },
        { status: 400 }
      );
    }

    const flowDefinition = approval.flow.definition as ApprovalFlowDefinition;
    const currentStage = flowDefinition.stages?.find(
      (s: ApprovalFlowStage) => s.id === approval.currentStageId
    );

    if (!currentStage) {
      return NextResponse.json(
        { error: "Current stage not found" },
        { status: 400 }
      );
    }

    // Find the transition that matches the action
    const transition = currentStage.transitions?.find(
      (t: FlowTransition) => t.targetStageId === action || t.to === action
    );

    if (!transition) {
      return NextResponse.json(
        { error: "Invalid action for current stage" },
        { status: 400 }
      );
    }

    // Determine next stage and status
    const nextStageId: string | null = transition.targetStageId || null;
    const nextStatus: ApprovalStatus = transition.to as ApprovalStatus;

    // Get next stage details if transitioning to another stage
    const nextStage = nextStageId
      ? flowDefinition.stages?.find((s: ApprovalFlowStage) => s.id === nextStageId)
      : null;

    // Get user info (in a real app, this would come from auth)
    const user = await prisma.user.findFirst();
    const userName = user?.name || "System";

    // Update metadata with comment
    const currentMetadata = (approval.metadata || {}) as ApprovalMetadata;
    const comments = currentMetadata.comments || [];
    
    const newComment = {
      stageId: approval.currentStageId,
      userId,
      userName,
      comment: comment || `Moved to ${nextStage?.name || nextStatus}`,
      action: nextStatus === "approved" ? "approve" : nextStatus === "reject" ? "reject" : "return",
      timestamp: new Date().toISOString(),
    };

    const updatedMetadata = {
      ...currentMetadata,
      comments: [...comments, newComment],
      previousStageId: approval.currentStageId,
      iterationCount: (currentMetadata.iterationCount || 0) + 1,
    };

    // Update approval
    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status: nextStatus,
        currentStageId: nextStageId,
        metadata: updatedMetadata,
        completedAt: ["approved", "reject", "end"].includes(nextStatus)
          ? new Date()
          : null,
      },
    });

    // Create log entry for the action
    await prisma.logEntry.create({
      data: {
        level: "info",
        message: `Approval action: ${approval.title} - ${nextStatus}`,
        context: {
          approvalId: id,
          approvalTitle: approval.title,
          action: nextStatus,
          previousStage: currentStage.name,
          nextStage: nextStage?.name || nextStatus,
          userId,
          userName,
          comment: comment || undefined,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Publish event
    await mq.publish("approval-events", "approval.action", {
      approvalId: id,
      action: nextStatus,
      previousStage: approval.currentStageId,
      nextStage: nextStageId,
      comment,
      userId,
      userName,
    });

    return NextResponse.json({
      success: true,
      approval: updatedApproval,
      nextStage: nextStage?.name,
    });
  } catch (error) {
    console.error("Failed to process approval action:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
