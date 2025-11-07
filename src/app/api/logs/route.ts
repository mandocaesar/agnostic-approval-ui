import { NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";

export async function GET() {
  const { logs } = await readData();
  return NextResponse.json(logs);
}
