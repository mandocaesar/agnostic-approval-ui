import {
  ApprovalFlow,
  ApprovalFlowStage,
  Domain,
  User,
} from "@/types";

export interface StageNotificationPreview {
  stageId: string;
  actor?: User;
  supervisor?: User;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
}

export interface StageNotificationContext {
  flow: ApprovalFlow;
  domain: Domain;
  subdomain: Domain["subdomains"][number];
  users: User[];
}

function applyTemplate(
  template: string,
  replacements: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = replacements[key];
    return value ?? `{{${key}}}`;
  });
}

function defaultSubject(flowName: string, stageName: string) {
  return `${flowName} · ${stageName}`;
}

function defaultBody(
  flowName: string,
  stageName: string,
  domainName: string,
  subdomainName: string,
  actorName: string,
  supervisorName: string,
) {
  return [
    `Hello ${supervisorName},`,
    "",
    `${actorName} progressed "${flowName}" for ${domainName} (${subdomainName}) into the "${stageName}" stage.`,
    "Please review the update and provide support as needed.",
    "",
    "Thanks,",
    "Agnostic Approval Platform",
  ].join("\n");
}

export function buildStageNotification(
  stage: ApprovalFlowStage,
  context: StageNotificationContext,
): StageNotificationPreview | null {
  if (!stage.actorUserId && !stage.notification) {
    return null;
  }

  const actor = context.users.find((user) => user.id === stage.actorUserId);
  const supervisor = actor?.supervisorId
    ? context.users.find((user) => user.id === actor.supervisorId)
    : undefined;

  if (!actor && !supervisor) {
    return null;
  }

  const replacements = {
    actorName: actor?.name ?? "Actor",
    supervisorName: supervisor?.name ?? actor?.name ?? "Supervisor",
    stageName: stage.name,
    flowName: context.flow.name,
    domainName: context.domain.name,
    subdomainName: context.subdomain.name,
  };

  const templateSubject =
    stage.notification?.subject ??
    defaultSubject(context.flow.name, stage.name);
  const templateBody =
    stage.notification?.body ??
    defaultBody(
      context.flow.name,
      stage.name,
      context.domain.name,
      context.subdomain.name,
      replacements.actorName,
      replacements.supervisorName,
    );

  const subject = applyTemplate(templateSubject, replacements);
  const body = applyTemplate(templateBody, replacements);

  const to: string[] = [];
  const cc: string[] = [];

  const shouldNotifySupervisor =
    stage.notification?.sendToActorSupervisor ?? true;

  if (shouldNotifySupervisor && supervisor?.email) {
    to.push(supervisor.email);
  }

  if (to.length === 0 && actor?.email) {
    to.push(actor.email);
  }

  if (stage.notification?.ccActor && actor?.email) {
    const alreadyInTo = to.includes(actor.email);
    if (!alreadyInTo) {
      cc.push(actor.email);
    }
  }

  if (to.length === 0) {
    return null;
  }

  return {
    stageId: stage.id,
    actor,
    supervisor,
    to,
    cc,
    subject,
    body,
  };
}

export function buildFlowNotifications(
  flow: ApprovalFlow,
  context: Pick<StageNotificationContext, "domain" | "subdomain" | "users">,
): StageNotificationPreview[] {
  return flow.definition.stages
    .map((stage) =>
      buildStageNotification(stage, {
        flow,
        domain: context.domain,
        subdomain: context.subdomain,
        users: context.users,
      }),
    )
    .filter(
      (preview): preview is StageNotificationPreview => preview !== null,
    );
}
