# Condition Evaluation Guide

## Overview

This guide explains how to use the custom DSL (Domain-Specific Language) for defining conditions in approval workflows.

## Basic Structure

### Single Condition

```typescript
{
  field: "amount",
  operator: ">",
  value: 10000
}
```

### Condition Group

```typescript
{
  operator: "AND",
  conditions: [
    { field: "amount", operator: ">", value: 10000 },
    { field: "riskLevel", operator: "==", value: "high" }
  ]
}
```

---

## Available Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equal | `{ field: "status", operator: "==", value: "active" }` |
| `!=` | Not equal | `{ field: "status", operator: "!=", value: "cancelled" }` |
| `>` | Greater than | `{ field: "amount", operator: ">", value: 1000 }` |
| `<` | Less than | `{ field: "amount", operator: "<", value: 5000 }` |
| `>=` | Greater or equal | `{ field: "score", operator: ">=", value: 80 }` |
| `<=` | Less or equal | `{ field: "attempts", operator: "<=", value: 3 }` |
| `CONTAINS` | String/Array contains | `{ field: "tags", operator: "CONTAINS", value: "urgent" }` |
| `NOT_CONTAINS` | Does not contain | `{ field: "description", operator: "NOT_CONTAINS", value: "test" }` |
| `IN` | Value in array | `{ field: "category", operator: "IN", value: ["payment", "refund"] }` |
| `NOT_IN` | Value not in array | `{ field: "status", operator: "NOT_IN", value: ["cancelled", "rejected"] }` |
| `STARTS_WITH` | String starts with | `{ field: "email", operator: "STARTS_WITH", value: "admin@" }` |
| `ENDS_WITH` | String ends with | `{ field: "email", operator: "ENDS_WITH", value: "@company.com" }` |
| `IS_EMPTY` | Null, empty, or undefined | `{ field: "notes", operator: "IS_EMPTY" }` |
| `IS_NOT_EMPTY` | Has a value | `{ field: "approverComment", operator: "IS_NOT_EMPTY" }` |

---

## Available Fields

### Resource Fields
Direct access to the approval request data:
```typescript
{ field: "amount", operator: ">", value: 10000 }
{ field: "category", operator: "==", value: "urgent" }
```

### Requester Fields
Access requester information with `requester.` prefix:
```typescript
{ field: "requester.department", operator: "==", value: "finance" }
{ field: "requester.role", operator: "IN", value: ["manager", "director"] }
{ field: "requester.supervisorId", operator: "IS_NOT_EMPTY" }
```

### Current Approver Fields
Access current approver with `currentApprover.` prefix:
```typescript
{ field: "currentApprover.id", operator: "==", value: "user123" }
{ field: "currentApprover.role", operator: "==", value: "director" }
```

### Workflow Fields
Access workflow state with `workflow.` prefix:
```typescript
{ field: "workflow.iterationCount", operator: "<", value: 3 }
{ field: "workflow.previousStageId", operator: "==", value: "manager-review" }
```

---

## Real-World Examples

### Example 1: Amount-Based Routing
```typescript
// Small amounts go to Manager
{
  operator: "AND",
  conditions: [
    { field: "amount", operator: "<=", value: 5000 },
    { field: "category", operator: "==", value: "expense" }
  ]
}

// Large amounts go to Director
{
  operator: "AND",
  conditions: [
    { field: "amount", operator: ">", value: 5000 },
    { field: "category", operator: "==", value: "expense" }
  ]
}
```

### Example 2: Department-Based Approval
```typescript
// Finance department always needs VP approval
{
  operator: "OR",
  conditions: [
    { field: "requester.department", operator: "==", value: "finance" },
    { field: "amount", operator: ">", value: 100000 }
  ]
}
```

### Example 3: Loop Prevention
```typescript
// Only allow 2 returns to requester
{
  operator: "AND",
  conditions: [
    { field: "workflow.iterationCount", operator: "<", value: 3 },
    { field: "status", operator: "==", value: "needs_revision" }
  ]
}
```

### Example 4: Complex Nested Logic
```typescript
// High-value OR high-risk items need extra approval
{
  operator: "AND",
  conditions: [
    {
      operator: "OR",
      conditions: [
        { field: "amount", operator: ">", value: 50000 },
        { field: "riskLevel", operator: "==", value: "high" }
      ]
    },
    { field: "requester.department", operator: "IN", value: ["sales", "marketing"] }
  ]
}
```

### Example 5: Auto-Approve Safe Requests
```typescript
// Low-value, low-risk from trusted department
{
  operator: "AND",
  conditions: [
    { field: "amount", operator: "<=", value: 1000 },
    { field: "riskLevel", operator: "==", value: "low" },
    { field: "requester.department", operator: "==", value: "operations" },
    { field: "requester.role", operator: "IN", value: ["manager", "director"] }
  ]
}
```

---

## Common Patterns

### Pattern: Supervisor Check
```typescript
// Current approver must be requester's supervisor
{
  field: "currentApprover.id",
  operator: "==",
  value: "$requester.supervisorId"  // Note: This requires special handling
}
```

### Pattern: Escalation After Multiple Rejections
```typescript
{
  operator: "AND",
  conditions: [
    { field: "workflow.iterationCount", operator: ">=", value: 2 },
    { field: "status", operator: "==", value: "rejected" }
  ]
}
```

### Pattern: Urgent Items Fast-Track
```typescript
{
  operator: "OR",
  conditions: [
    { field: "tags", operator: "CONTAINS", value: "urgent" },
    { field: "priority", operator: "==", value: "critical" },
    { field: "dueDate", operator: "<", value: "TODAY+1D" }  // Note: Requires date handling
  ]
}
```

---

## Best Practices

1. **Keep It Simple**: Start with simple conditions and add complexity only when needed
2. **Document Complex Logic**: Add comments explaining why certain thresholds exist
3. **Test Edge Cases**: Always test with null values, empty strings, and missing fields
4. **Use IS_NOT_EMPTY**: Instead of checking for specific values when you just need "has data"
5. **Group Logically**: Use AND/OR groups to make the logic readable
6. **Avoid Deep Nesting**: More than 2-3 levels of nesting becomes hard to maintain

---

## Implementation Notes

See:
- [conditions.ts](file:///Users/a025287/Personal/approval-ui/src/types/conditions.ts) for type definitions
- [conditionEngine.ts](file:///Users/a025287/Personal/approval-ui/src/lib/conditionEngine.ts) for the evaluation engine
- [conditionEngine.test.ts](file:///Users/a025287/Personal/approval-ui/src/lib/__tests__/conditionEngine.test.ts) for usage examples
