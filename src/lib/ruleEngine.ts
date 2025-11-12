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
    value === "in_process" ||
    value === "approved" ||
    value === "reject" ||
    value === "end"
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

  const stageList = stages as ApprovalFlowStage[];
  const stagesById = new Map<string, ApprovalFlowStage>();
  const existingStatuses = new Set<ApprovalStatus>();
  stageList.forEach((stage) => {
    stagesById.set(stage.id, stage);
    existingStatuses.add(stage.status);
  });

  for (const stage of stageList) {
    for (const transition of stage.transitions) {
      if (transition.targetStageId) {
        if (!stagesById.has(transition.targetStageId)) {
          return false;
        }
        continue;
      }
      if (!existingStatuses.has(transition.to)) {
        return false;
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

  const stageById = new Map<string, ApprovalFlowStage>();
  const statusGraph = new Map<ApprovalStatus, Set<ApprovalStatus>>();
  const knownStatuses = new Set<ApprovalStatus>();

  definition.stages.forEach((stage) => {
    stageById.set(stage.id, stage);
    knownStatuses.add(stage.status);
  });

  definition.stages.forEach((stage) => {
    const adjacency =
      statusGraph.get(stage.status) ?? new Set<ApprovalStatus>();
    stage.transitions.forEach((transition) => {
      if (transition.targetStageId) {
        const targetStage = stageById.get(transition.targetStageId);
        if (targetStage) {
          adjacency.add(targetStage.status);
          return;
        }
      }
      adjacency.add(transition.to);
    });
    statusGraph.set(stage.status, adjacency);
  });

  const [firstStatus] = path;
  if (!knownStatuses.has(firstStatus)) {
    issues.push(`Stage for status "${firstStatus}" does not exist in flow.`);
  }

  for (let index = 1; index < path.length; index += 1) {
    const prevStatus = path[index - 1];
    const nextStatus = path[index];

    if (!knownStatuses.has(nextStatus)) {
      issues.push(`Stage for status "${nextStatus}" does not exist in flow.`);
      continue;
    }

    const adjacency = statusGraph.get(prevStatus);
    if (!adjacency || !adjacency.has(nextStatus)) {
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
