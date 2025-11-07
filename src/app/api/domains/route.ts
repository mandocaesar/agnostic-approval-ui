import { NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";

export async function GET() {
  const { domains } = await readData();
  return NextResponse.json(domains);
}
