import { NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";

export async function GET() {
  const { approvals } = await readData();
  return NextResponse.json(approvals);
}
