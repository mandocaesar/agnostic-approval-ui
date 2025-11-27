import { evaluateConditions, evaluateConditionsWithDetails } from "../conditionEngine";
import type { Condition, ConditionGroup, EvaluationContext } from "@/types/conditions";

describe("Condition Engine", () => {
    const mockContext: EvaluationContext = {
        resource: {
            amount: 15000,
            riskLevel: "high",
            category: "payment",
            tags: ["urgent", "international"],
        },
        requester: {
            id: "user123",
            name: "John Doe",
            email: "john@example.com",
            role: "manager",
            department: "finance",
            supervisorId: "user456",
        },
        currentApprover: {
            id: "user456",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "director",
        },
        workflow: {
            currentStageId: "stage2",
            previousStageId: "stage1",
            iterationCount: 1,
        },
    };

    describe("Simple Conditions", () => {
        test("should evaluate numeric comparison (greater than)", () => {
            const condition: Condition = {
                field: "amount",
                operator: ">",
                value: 10000,
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should evaluate string equality", () => {
            const condition: Condition = {
                field: "riskLevel",
                operator: "==",
                value: "high",
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should evaluate CONTAINS for array", () => {
            const condition: Condition = {
                field: "tags",
                operator: "CONTAINS",
                value: "urgent",
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should evaluate IN operator", () => {
            const condition: Condition = {
                field: "category",
                operator: "IN",
                value: ["payment", "refund", "transfer"],
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should evaluate IS_NOT_EMPTY", () => {
            const condition: Condition = {
                field: "riskLevel",
                operator: "IS_NOT_EMPTY",
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });
    });

    describe("Nested Field Access", () => {
        test("should access requester fields", () => {
            const condition: Condition = {
                field: "requester.department",
                operator: "==",
                value: "finance",
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should access currentApprover fields", () => {
            const condition: Condition = {
                field: "currentApprover.role",
                operator: "==",
                value: "director",
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should access workflow fields", () => {
            const condition: Condition = {
                field: "workflow.iterationCount",
                operator: "<=",
                value: 3,
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });
    });

    describe("Condition Groups", () => {
        test("should evaluate AND group (all true)", () => {
            const group: ConditionGroup = {
                operator: "AND",
                conditions: [
                    { field: "amount", operator: ">", value: 10000 },
                    { field: "riskLevel", operator: "==", value: "high" },
                ],
            };

            const result = evaluateConditions(group, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should evaluate AND group (one false)", () => {
            const group: ConditionGroup = {
                operator: "AND",
                conditions: [
                    { field: "amount", operator: ">", value: 10000 },
                    { field: "riskLevel", operator: "==", value: "low" },
                ],
            };

            const result = evaluateConditions(group, mockContext);
            expect(result.passed).toBe(false);
        });

        test("should evaluate OR group", () => {
            const group: ConditionGroup = {
                operator: "OR",
                conditions: [
                    { field: "amount", operator: "<", value: 1000 },
                    { field: "riskLevel", operator: "==", value: "high" },
                ],
            };

            const result = evaluateConditions(group, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should evaluate nested groups", () => {
            const group: ConditionGroup = {
                operator: "AND",
                conditions: [
                    { field: "amount", operator: ">", value: 10000 },
                    {
                        operator: "OR",
                        conditions: [
                            { field: "riskLevel", operator: "==", value: "high" },
                            { field: "requester.department", operator: "==", value: "finance" },
                        ],
                    },
                ],
            };

            const result = evaluateConditions(group, mockContext);
            expect(result.passed).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        test("should handle undefined fields", () => {
            const condition: Condition = {
                field: "nonexistent",
                operator: "IS_EMPTY",
            };

            const result = evaluateConditions(condition, mockContext);
            expect(result.passed).toBe(true);
        });

        test("should handle null values", () => {
            const contextWithNull: EvaluationContext = {
                resource: { value: null },
            };

            const condition: Condition = {
                field: "value",
                operator: "IS_EMPTY",
            };

            const result = evaluateConditions(condition, contextWithNull);
            expect(result.passed).toBe(true);
        });
    });

    describe("Detailed Evaluation", () => {
        test("should provide detailed results", () => {
            const condition: Condition = {
                field: "amount",
                operator: ">",
                value: 10000,
            };

            const result = evaluateConditionsWithDetails(condition, mockContext);
            expect(result.passed).toBe(true);
            expect(result.details).toBeDefined();
            expect(result.details?.[0]).toMatchObject({
                condition: "amount",
                actualValue: 15000,
                expectedValue: 10000,
                operator: ">",
            });
        });
    });
});
