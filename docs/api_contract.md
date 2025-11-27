# API Contract for Approval UI

This document defines the API endpoints and data structures required by the Approval UI frontend. The backend service should be implemented in Go and expose these endpoints over HTTP/JSON.

## Base URL
`http://localhost:8080/api/v1` (Configurable via environment variable)

## Data Models

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "supervisorId": "string | null"
}
```

### Domain
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "subdomains": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ]
}
```

### ApprovalFlow
```json
{
  "id": "string",
  "name": "string",
  "version": "string",
  "description": "string",
  "domainId": "string",
  "subdomainId": "string",
  "definition": {
    "stages": [
      {
        "id": "string",
        "name": "string",
        "status": "in_process | approved | reject | end",
        "description": "string",
        "actorUserId": "string",
        "notifySupervisor": "boolean",
        "ccActor": "boolean",
        "isFinal": "boolean",
        "transitions": [
          {
            "to": "string (status)",
            "targetStageId": "string",
            "targetStageName": "string",
            "label": "string",
            "conditions": ["string"]
          }
        ]
      }
    ]
  },
  "createdAt": "string (ISO8601)",
  "updatedAt": "string (ISO8601)"
}
```

## Endpoints

### 1. Users
**GET /users**
- Returns a list of all users.
- **Response**: `User[]`

### 2. Domains
**GET /domains**
- Returns a list of all domains with their subdomains.
- **Response**: `Domain[]`

### 3. Flows
**GET /flows**
- Returns a list of approval flows.
- **Query Params**:
    - `domainId` (optional)
    - `subdomainId` (optional)
- **Response**: `ApprovalFlow[]`

**GET /flows/:id**
- Returns a specific approval flow.
- **Response**: `ApprovalFlow`

**POST /flows**
- Creates a new approval flow.
- **Body**:
  ```json
  {
    "name": "string",
    "version": "string",
    "description": "string",
    "domainId": "string",
    "subdomainId": "string",
    "definition": { ... }
  }
  ```
- **Response**: `ApprovalFlow`

**PUT /flows/:id**
- Updates an existing approval flow.
- **Body**: Same as POST (partial updates allowed).
- **Response**: `ApprovalFlow`

**DELETE /flows/:id**
- Deletes a flow.
- **Response**: `204 No Content`

## Error Handling
All error responses should follow this format:
```json
{
  "code": "string (e.g., NOT_FOUND, VALIDATION_ERROR)",
  "message": "string",
  "details": {}
}
```

### StageEvent
```json
{
  "type": "webhook | kafka",
  "enabled": true,
  "config": {
    "url": "https://api.example.com/callback",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer token"
    },
    "topic": "approval-events",
    "payloadTemplate": "{ \"id\": \"{{approvalId}}\", \"status\": \"{{status}}\" }"
  }
}
```

### ApprovalFlowStage
```json
{
  "id": "stage-1",
  "status": "in_process",
  "name": "Business Case",
  "description": "Initial review",
  "actor": "user-1",
  "actorUserId": "user-1",
  "notification": {
    "subject": "New Approval",
    "body": "Please review...",
    "sendToActorSupervisor": true,
    "ccActor": true
  },
  "events": [
    {
      "type": "webhook",
      "enabled": true,
      "config": {
        "url": "https://api.example.com/webhook",
        "method": "POST"
      }
    }
  ],
  "transitions": [
    {
      "to": "approved",
      "targetStageId": "stage-2",
      "label": "Approve"
    }
  ]
}
```
