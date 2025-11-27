import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const domains = await prisma.domain.findMany({
            include: {
                subdomains: true,
                approvals: {
                    where: {
                        status: "in_process",
                    },
                },
            },
        });

        const stats = domains.map(domain => ({
            id: domain.id,
            name: domain.name,
            totalSubdomains: domain.subdomains.length,
            activeApprovals: domain.approvals.length,
            approvalsByStatus: {
                in_process: domain.approvals.filter(a => a.status === "in_process").length,
                approved: domain.approvals.filter(a => a.status === "approved").length,
                reject: domain.approvals.filter(a => a.status === "reject").length,
                end: domain.approvals.filter(a => a.status === "end").length,
            },
        }));

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Failed to fetch domain stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
