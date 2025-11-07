import { NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";

export async function GET() {
  const { domains } = await readData();

  const flows = domains.flatMap((domain) =>
    domain.subdomains.flatMap((subdomain) =>
      subdomain.flows.map((flow) => ({
        domainId: domain.id,
        domainName: domain.name,
        subdomainId: subdomain.id,
        subdomainName: subdomain.name,
        flow,
      })),
    ),
  );

  return NextResponse.json(flows);
}
