import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const domain = await prisma.domain.findUnique({
            where: { id },
            include: {
                subdomains: {
                    include: {
                        flows: true,
                    },
                },
            },
        });

        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        return NextResponse.json(domain);
    } catch (error) {
        console.error("Failed to fetch domain:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const domain = await prisma.domain.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description,
                connectivity: body.connectivity,
                owner: body.owner,
            },
        });

        return NextResponse.json(domain);
    } catch (error) {
        console.error("Failed to update domain:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.domain.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete domain:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
