import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const versions = await prisma.flowVersion.findMany({
            where: { flowId: id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(versions);
    } catch (error) {
        console.error("Failed to fetch flow versions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
