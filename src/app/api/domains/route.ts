import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const domains = await prisma.domain.findMany({
      include: {
        subdomains: true,
      },
    });
    return NextResponse.json(domains);
  } catch (error) {
    console.error("Failed to fetch domains:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const domain = await prisma.domain.create({
      data: {
        name: body.name,
        description: body.description,
        tags: body.tags || [],
        owner: body.owner || {},
        connectivity: body.connectivity || {},
      },
    });
    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    console.error("Failed to create domain:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
