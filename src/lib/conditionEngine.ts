import type {
    TransitionCondition,
    ConditionGroup,
    ConditionOperator,
} from "@/types";

/**
 * Evaluation context - data available for condition evaluation
 */
export interface EvaluationContext {
    /** The resource/request being approved */
    resource: Record<string, any>;

    /** The user who created the request */
    requester?: {
        id: string;
        name: string;
        email: string;
        role: string;
        department?: string;
        supervisorId?: string;
    };

    /** Current approver (if applicable) */
    currentApprover?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };

    /** Workflow state */
    workflow?: {
        currentStageId: string;
        previousStageId?: string;
        iterationCount?: number;
    };

    /** Additional metadata */
    metadata?: Record<string, any>;
}

/**
 * Result of condition evaluation
 */
export interface EvaluationResult {
    /** Whether the condition(s) passed */
    passed: boolean;

    /** Details about the evaluation (for debugging) */
    details?: {
        conditionId: string;
        field: string;
        actualValue: any;
        expectedValue: any;
        operator: string;
        passed: boolean;
    }[];
}

/**
 * Get a nested field value from an object using dot notation
 * Example: "requester.department" → context.requester.department
 */
function getFieldValue(obj: any, path: string): any {
    const keys = path.split(".");
    let value = obj;

    for (const key of keys) {
        if (value === null || value === undefined) {
            return undefined;
        }
        value = value[key];
    }

    return value;
}

/**
 * Resolve a field path from the evaluation context
 * Checks resource, requester, currentApprover, workflow, and metadata
 */
function resolveField(context: EvaluationContext, field: string): any {
    // Try direct resource field first
    if (field in context.resource) {
        return context.resource[field];
    }

    // Try nested paths
    if (field.startsWith("requester.") && context.requester) {
        return getFieldValue(context.requester, field.substring(10));
    }

    if (field.startsWith("currentApprover.") && context.currentApprover) {
        return getFieldValue(context.currentApprover, field.substring(16));
    }

    if (field.startsWith("workflow.") && context.workflow) {
        return getFieldValue(context.workflow, field.substring(9));
    }

    if (field.startsWith("metadata.") && context.metadata) {
        return getFieldValue(context.metadata, field.substring(9));
    }

    // Try resource as fallback with nested path
    return getFieldValue(context.resource, field);
}

function compareValues(
    actualValue: any,
    operator: ConditionOperator,
    expectedValue: any
): boolean {
    switch (operator) {
        case "==":
            return actualValue == expectedValue; // eslint-disable-line eqeqeq

        case "!=":
            return actualValue != expectedValue; // eslint-disable-line eqeqeq

        case ">":
            return Number(actualValue) > Number(expectedValue);

        case "<":
            return Number(actualValue) < Number(expectedValue);

        case ">=":
            return Number(actualValue) >= Number(expectedValue);

        case "<=":
            return Number(actualValue) <= Number(expectedValue);

        case "CONTAINS":
            if (typeof actualValue === "string" && typeof expectedValue === "string") {
                return actualValue.includes(expectedValue);
            }
            if (Array.isArray(actualValue)) {
                return actualValue.includes(expectedValue);
            }
            return false;

        case "NOT_CONTAINS":
            if (typeof actualValue === "string" && typeof expectedValue === "string") {
                return !actualValue.includes(expectedValue);
            }
            if (Array.isArray(actualValue)) {
                return !actualValue.includes(expectedValue);
            }
            return true;

        case "IN":
            if (!Array.isArray(expectedValue)) {
                return false;
            }
            return expectedValue.includes(actualValue);

        case "NOT_IN":
            if (!Array.isArray(expectedValue)) {
                return true;
            }
            return !expectedValue.includes(actualValue);

        case "STARTS_WITH":
            if (typeof actualValue === "string" && typeof expectedValue === "string") {
                return actualValue.startsWith(expectedValue);
            }
            return false;

        case "ENDS_WITH":
            if (typeof actualValue === "string" && typeof expectedValue === "string") {
                return actualValue.endsWith(expectedValue);
            }
            return false;

        case "IS_EMPTY":
            return (
                actualValue === null ||
                actualValue === undefined ||
                actualValue === "" ||
                (Array.isArray(actualValue) && actualValue.length === 0)
            );

        case "IS_NOT_EMPTY":
            return !(
                actualValue === null ||
                actualValue === undefined ||
                actualValue === "" ||
                (Array.isArray(actualValue) && actualValue.length === 0)
            );

        default:
            throw new Error(`Unknown operator: ${operator}`);
    }
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
    condition: TransitionCondition,
    context: EvaluationContext
): boolean {
    const actualValue = resolveField(context, condition.field);
    return compareValues(actualValue, condition.operator, condition.value);
}

/**
 * Evaluate a condition group
 */
function evaluateConditionGroup(
    group: ConditionGroup,
    context: EvaluationContext
): boolean {
    const results = group.conditions.map((condition) =>
        evaluateCondition(condition, context)
    );

    return group.operator === "AND"
        ? results.every((r) => r === true)
        : results.some((r) => r === true);
}

/**
 * Evaluate multiple condition groups (all groups must pass)
 */
export function evaluateConditionGroups(
    groups: ConditionGroup[] | undefined,
    context: EvaluationContext
): EvaluationResult {
    if (!groups || groups.length === 0) {
        return { passed: true };
    }

    try {
        // All groups must pass (AND between groups)
        const groupResults = groups.map((group) =>
            evaluateConditionGroup(group, context)
        );

        const passed = groupResults.every((r) => r === true);

        return { passed };
    } catch (error) {
        console.error("Condition evaluation error:", error);
        return { passed: false };
    }
}

/**
 * Evaluate with detailed results (useful for debugging)
 */
export function evaluateConditionGroupsWithDetails(
    groups: ConditionGroup[] | undefined,
    context: EvaluationContext
): EvaluationResult {
    if (!groups || groups.length === 0) {
        return { passed: true, details: [] };
    }

    const details: EvaluationResult["details"] = [];

    try {
        const groupResults = groups.map((group) => {
            const conditionResults = group.conditions.map((condition) => {
                const actualValue = resolveField(context, condition.field);
                const conditionPassed = compareValues(
                    actualValue,
                    condition.operator,
                    condition.value
                );

                details?.push({
                    conditionId: condition.id,
                    field: condition.field,
                    actualValue,
                    expectedValue: condition.value,
                    operator: condition.operator,
                    passed: conditionPassed,
                });

                return conditionPassed;
            });

            return group.operator === "AND"
                ? conditionResults.every((r) => r === true)
                : conditionResults.some((r) => r === true);
        });

        const passed = groupResults.every((r) => r === true);

        return { passed, details };
    } catch (error) {
        console.error("Condition evaluation error:", error);
        return {
            passed: false,
            details: [
                {
                    conditionId: "error",
                    field: "error",
                    actualValue: String(error),
                    expectedValue: null,
                    operator: "ERROR",
                    passed: false,
                },
            ],
        };
    }
}
