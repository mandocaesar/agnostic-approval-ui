import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: domainId } = await params;
        const body = await request.json();

        // Verify domain exists
        const domain = await prisma.domain.findUnique({ where: { id: domainId } });
        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        const subdomain = await prisma.subdomain.create({
            data: {
                name: body.name,
                description: body.description,
                domainId,
                owner: body.owner || {},
                connectivity: body.connectivity || {},
            },
        });

        return NextResponse.json(subdomain, { status: 201 });
    } catch (error) {
        console.error("Failed to create subdomain:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: domainId } = await params;
        const subdomains = await prisma.subdomain.findMany({
            where: { domainId },
            include: { flows: true },
        });

        return NextResponse.json(subdomains);
    } catch (error) {
        console.error("Failed to fetch subdomains:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
