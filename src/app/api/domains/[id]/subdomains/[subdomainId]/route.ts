import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; subdomainId: string }> }
) {
    try {
        const { subdomainId } = await params;
        const subdomain = await prisma.subdomain.findUnique({
            where: { id: subdomainId },
            include: { flows: true },
        });

        if (!subdomain) {
            return NextResponse.json({ error: "Subdomain not found" }, { status: 404 });
        }

        return NextResponse.json(subdomain);
    } catch (error) {
        console.error("Failed to fetch subdomain:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; subdomainId: string }> }
) {
    try {
        const { subdomainId } = await params;
        const body = await request.json();

        const subdomain = await prisma.subdomain.update({
            where: { id: subdomainId },
            data: {
                name: body.name,
                description: body.description,
                connectivity: body.connectivity,
                owner: body.owner,
            },
        });

        return NextResponse.json(subdomain);
    } catch (error) {
        console.error("Failed to update subdomain:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; subdomainId: string }> }
) {
    try {
        const { subdomainId } = await params;
        await prisma.subdomain.delete({ where: { id: subdomainId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete subdomain:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
