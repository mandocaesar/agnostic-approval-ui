import { prisma } from "@/lib/prisma";
import { mq } from "@/lib/queue";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const approval = await prisma.approval.findUnique({
            where: { id },
        });

        if (!approval) {
            return NextResponse.json({ error: "Approval not found" }, { status: 404 });
        }

        return NextResponse.json(approval);
    } catch (error) {
        console.error("Failed to fetch approval:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const approval = await prisma.approval.update({
            where: { id },
            data: body,
        });

        // Publish event
        await mq.publish("approval-events", "approval.updated", approval);

        return NextResponse.json(approval);
    } catch (error) {
        console.error("Failed to update approval:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
