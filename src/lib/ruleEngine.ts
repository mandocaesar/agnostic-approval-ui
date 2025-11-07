import {
  ApprovalFlowDefinition,
  ApprovalFlowStage,
  ApprovalStatus,
  FlowTransition,
} from "@/types";

export interface FlowPathEvaluation {
  isValid: boolean;
  issues: string[];
}

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return (
    value === "draft" ||
    value === "waiting" ||
    value === "approved" ||
    value === "reject"
  );
}

function isTransition(value: unknown): value is FlowTransition {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return isApprovalStatus(candidate.to);
}

function isStage(value: unknown): value is ApprovalFlowStage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.description !== "string" ||
    typeof candidate.actor !== "string" ||
    !isApprovalStatus(candidate.status)
  ) {
    return false;
  }

  if (!Array.isArray(candidate.transitions)) {
    return false;
  }

  return candidate.transitions.every(isTransition);
}

export function validateFlowDefinition(
  definition: unknown,
): definition is ApprovalFlowDefinition {
  if (!definition || typeof definition !== "object") {
    return false;
  }

  const candidate = definition as Record<string, unknown>;
  if (!Array.isArray(candidate.stages) || candidate.stages.length === 0) {
    return false;
  }

  const stages = candidate.stages;
  if (!stages.every(isStage)) {
    return false;
  }

  const statusSet = new Set<ApprovalStatus>();
  for (const stage of stages as ApprovalFlowStage[]) {
    if (statusSet.has(stage.status)) {
      return false;
    }
    statusSet.add(stage.status);
    for (const transition of stage.transitions) {
      if (!statusSet.has(transition.to)) {
        // allow forward references but ensure target exists somewhere in stages
        if (!(stages as ApprovalFlowStage[]).some((s) => s.status === transition.to)) {
          return false;
        }
      }
    }
  }

  return true;
}

export function evaluateFlowPath(
  definition: ApprovalFlowDefinition,
  path: ApprovalStatus[],
): FlowPathEvaluation {
  const issues: string[] = [];

  if (!Array.isArray(path) || path.length === 0) {
    issues.push("Path must contain at least one status.");
    return { isValid: false, issues };
  }

  const stageByStatus = new Map<ApprovalStatus, ApprovalFlowStage>();
  definition.stages.forEach((stage) => {
    stageByStatus.set(stage.status, stage);
  });

  const [firstStatus] = path;
  if (!stageByStatus.has(firstStatus)) {
    issues.push(`Stage for status "${firstStatus}" does not exist in flow.`);
  }

  for (let index = 1; index < path.length; index += 1) {
    const prevStatus = path[index - 1];
    const nextStatus = path[index];

    if (!stageByStatus.has(nextStatus)) {
      issues.push(`Stage for status "${nextStatus}" does not exist in flow.`);
      continue;
    }

    const prevStage = stageByStatus.get(prevStatus);
    if (!prevStage) {
      issues.push(`Stage for status "${prevStatus}" does not exist in flow.`);
      continue;
    }

    const hasTransition = prevStage.transitions.some(
      (transition) => transition.to === nextStatus,
    );

    if (!hasTransition) {
      issues.push(
        `No transition from "${prevStatus}" to "${nextStatus}" in flow.`,
      );
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
