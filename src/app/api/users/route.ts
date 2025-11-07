import { NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";

export async function GET() {
  const { users } = await readData();
  return NextResponse.json(users);
}
