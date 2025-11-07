export type ApprovalStatus = "draft" | "waiting" | "reject" | "approved";

export type UserRole = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supervisorId?: string | null;
}

export interface StageNotificationTemplate {
  subject: string;
  body: string;
  sendToActorSupervisor?: boolean;
  ccActor?: boolean;
}

export interface FlowTransition {
  to: ApprovalStatus;
  label?: string;
  conditions?: string[];
}

export interface ApprovalFlowStage {
  id: string;
  status: ApprovalStatus;
  name: string;
  description: string;
  actor: string;
  actorUserId?: string;
  notification?: StageNotificationTemplate;
  transitions: FlowTransition[];
}

export interface ApprovalFlowDefinition {
  stages: ApprovalFlowStage[];
}

export interface ApprovalFlow {
  id: string;
  name: string;
  version: string;
  description: string;
  definition: ApprovalFlowDefinition;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface Subdomain {
  id: string;
  name: string;
  description: string;
  flows: ApprovalFlow[];
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  subdomains: Subdomain[];
}

export interface Approval {
  id: string;
  title: string;
  domainId: string;
  subdomainId: string;
  requesterId: string;
  approverIds: string[];
  status: ApprovalStatus;
  submittedAt: string;
  lastUpdatedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
  context: Record<string, unknown>;
}

export interface MockData {
  users: User[];
  domains: Domain[];
  approvals: Approval[];
  logs: LogEntry[];
}
