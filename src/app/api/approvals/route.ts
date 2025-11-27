import { prisma } from "@/lib/prisma";
import { mq } from "@/lib/queue";
import { generateId } from "@/lib/dataStore"; // Reusing ID generator or can use UUID from DB
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");
    const status = searchParams.get("status");

    const where: any = {};
    if (domainId) where.domainId = domainId;
    if (status) where.status = status;

    const approvals = await prisma.approval.findMany({
      where,
      orderBy: { lastUpdatedAt: "desc" },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Failed to fetch approvals:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.title || !body.domainId || !body.requesterId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const approval = await prisma.approval.create({
      data: {
        title: body.title,
        domainId: body.domainId,
        subdomainId: body.subdomainId,
        flowId: body.flowId,
        requesterId: body.requesterId,
        approverIds: body.approverIds || [],
        status: "in_process",
        payload: body.payload || {},
        metadata: body.metadata || {},
      },
    });

    // Create log entry for approval creation
    await prisma.logEntry.create({
      data: {
        level: "info",
        message: `New approval created: ${approval.title}`,
        context: {
          approvalId: approval.id,
          approvalTitle: approval.title,
          requesterId: approval.requesterId,
          domainId: approval.domainId,
          subdomainId: approval.subdomainId,
          flowId: approval.flowId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Publish event
    await mq.publish("approval-events", "approval.created", approval);

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Failed to create approval:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
