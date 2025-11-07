import { NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";
import { buildStageNotification } from "@/lib/notificationEngine";

export async function GET() {
  const data = await readData();

  const notifications = data.domains.flatMap((domain) =>
    domain.subdomains.flatMap((subdomain) =>
      subdomain.flows.flatMap((flow) =>
        flow.definition.stages.map((stage) => {
          const preview = buildStageNotification(stage, {
            flow,
            domain,
            subdomain,
            users: data.users,
          });
          if (!preview) {
            return null;
          }
          return {
            domainId: domain.id,
            domainName: domain.name,
            subdomainId: subdomain.id,
            subdomainName: subdomain.name,
            flowId: flow.id,
            flowName: flow.name,
            stageId: stage.id,
            stageName: stage.name,
            to: preview.to,
            cc: preview.cc,
            subject: preview.subject,
            body: preview.body,
            actor: preview.actor
              ? { id: preview.actor.id, name: preview.actor.name, email: preview.actor.email }
              : null,
            supervisor: preview.supervisor
              ? {
                  id: preview.supervisor.id,
                  name: preview.supervisor.name,
                  email: preview.supervisor.email,
                }
              : null,
          };
        }),
      )
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    ),
  );

  return NextResponse.json(notifications);
}
