export type ApprovalStatus = "in_process" | "approved" | "reject" | "end";

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

export type ConditionOperator =
  | '>' | '<' | '>=' | '<=' | '==' | '!='
  | 'CONTAINS' | 'NOT_CONTAINS'
  | 'IN' | 'NOT_IN'
  | 'STARTS_WITH' | 'ENDS_WITH'
  | 'IS_EMPTY' | 'IS_NOT_EMPTY';
export type LogicalOperator = 'AND' | 'OR';

export interface TransitionCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number;
}

export interface ConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: TransitionCondition[];
}

export interface FlowTransition {
  to: ApprovalStatus;
  targetStageId?: string;
  targetStageName?: string;
  targetStageStatus?: ApprovalStatus;
  label?: string;
  conditionGroups?: ConditionGroup[];
  isDefault?: boolean;
}

export interface StageEventConfig {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  topic?: string;
  payloadTemplate?: string;
}

export interface StageEvent {
  id: string;
  type: "webhook" | "kafka";
  enabled: boolean;
  config: StageEventConfig;
}

export interface ApprovalFlowStage {
  id: string;
  status: ApprovalStatus;
  name: string;
  description: string;
  actor: string;
  actorUserId?: string;
  notification?: StageNotificationTemplate;
  events?: StageEvent[];
  transitions: FlowTransition[];
  /** Maximum iterations allowed for this stage (to prevent infinite loops) */
  maxIterations?: number;
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

export interface DomainConnectivity {
  /** Webhook configuration for domain-level events */
  webhook?: {
    enabled: boolean;
    url: string;
    method?: "POST" | "PUT" | "PATCH";
    headers?: Record<string, string>;
    secret?: string; // For HMAC signature
  };

  /** Kafka configuration for domain-level events */
  kafka?: {
    enabled: boolean;
    topic: string;
    brokers?: string[];
  };
}

export interface Subdomain {
  id: string;
  name: string;
  description: string;
  flows: ApprovalFlow[];
  /** Subdomain-specific connectivity overrides domain settings */
  connectivity?: DomainConnectivity;
  /** Tags for categorization */
  tags?: string[];
  /** Owner/maintainer information */
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
  activeApprovalCount?: number;
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  subdomains: Subdomain[];
  /** Domain-level connectivity configuration */
  connectivity?: DomainConnectivity;
  /** Tags for categorization */
  tags?: string[];
  /** Owner/maintainer information */
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
  activeApprovalCount?: number;
}

export interface Approval {
  id: string;
  title: string;
  domainId: string;
  subdomainId: string;
  flowId: string;
  requesterId: string;
  approverIds: string[];
  status: ApprovalStatus;
  currentStageId?: string;
  /** The request payload/data that will be evaluated by workflow conditions */
  payload: Record<string, any>;
  /** Metadata about the approval process */
  metadata?: {
    iterationCount?: number;
    previousStageId?: string;
    comments?: Array<{
      stageId: string;
      userId: string;
      userName: string;
      comment: string;
      action: "approve" | "reject" | "return";
      timestamp: string;
    }>;
  };
  submittedAt: string;
  lastUpdatedAt: string;
  completedAt?: string;
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
