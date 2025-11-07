import { NextResponse } from "next/server";
import {
  evaluateFlowPath,
  validateFlowDefinition,
} from "@/lib/ruleEngine";

export async function POST(request: Request) {
  const body = await request.json();
  const { definition, path } = body ?? {};

  if (!validateFlowDefinition(definition)) {
    return NextResponse.json(
      { error: "Invalid flow definition structure" },
      { status: 400 },
    );
  }

  if (!Array.isArray(path)) {
    return NextResponse.json(
      { error: "Path must be an array of statuses" },
      { status: 400 },
    );
  }

  const evaluation = evaluateFlowPath(definition, path);

  return NextResponse.json(evaluation);
}
