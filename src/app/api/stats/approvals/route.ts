import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "30d";
        const groupBy = searchParams.get("groupBy") || "status";

        // Calculate date range
        const now = new Date();
        const daysAgo = parseInt(period.replace("d", ""));
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysAgo);

        // Get approvals within period
        const approvals = await prisma.approval.findMany({
            where: {
                submittedAt: {
                    gte: startDate,
                },
            },
            include: {
                domain: true,
            },
        });

        // Group by requested dimension
        let stats: any = {};

        if (groupBy === "status") {
            stats = {
                in_process: approvals.filter(a => a.status === "in_process").length,
                approved: approvals.filter(a => a.status === "approved").length,
                reject: approvals.filter(a => a.status === "reject").length,
                end: approvals.filter(a => a.status === "end").length,
            };
        } else if (groupBy === "domain") {
            const domains = await prisma.domain.findMany();
            stats = domains.reduce((acc, domain) => {
                acc[domain.name] = approvals.filter(a => a.domainId === domain.id).length;
                return acc;
            }, {} as Record<string, number>);
        } else if (groupBy === "date") {
            // Group by date
            const dateMap: Record<string, number> = {};
            approvals.forEach(approval => {
                const date = new Date(approval.submittedAt).toISOString().split("T")[0];
                dateMap[date] = (dateMap[date] || 0) + 1;
            });
            stats = dateMap;
        }

        return NextResponse.json({
            period,
            groupBy,
            total: approvals.length,
            stats,
        });
    } catch (error) {
        console.error("Failed to fetch approval stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
