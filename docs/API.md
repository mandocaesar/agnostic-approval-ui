# API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
Currently, no authentication is required. For production, implement API key or JWT authentication.

---

## Approvals

### List Approvals
```http
GET /api/approvals?domainId={id}&status={status}
```

**Query Parameters:**
- `domainId` (optional): Filter by domain ID
- `status` (optional): Filter by status (in_process, approved, reject, end)

**Response:**
```json
[
  {
    "id": "string",
    "title": "string",
    "status": "in_process",
    "domainId": "string",
    "subdomainId": "string",
    "flowId": "string",
    "requesterId": "string",
    "payload": {},
    "submittedAt": "2024-01-01T00:00:00.000Z",
    "lastUpdatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Approval
```http
POST /api/approvals
Content-Type: application/json

{
  "title": "string",
  "domainId": "string",
  "subdomainId": "string",
  "flowId": "string",
  "requesterId": "string",
  "payload": {}
}
```

### Get Approval
```http
GET /api/approvals/{id}
```

### Update Approval
```http
PATCH /api/approvals/{id}
Content-Type: application/json

{
  "status": "approved",
  "currentStageId": "string"
}
```

### Perform Approval Action
```http
POST /api/approvals/{id}/actions
Content-Type: application/json

{
  "action": "approve" | "reject" | "return",
  "userId": "string",
  "userName": "string",
  "comment": "string (optional)"
}
```

**Response:**
```json
{
  "id": "string",
  "status": "approved",
  "metadata": {
    "comments": [
      {
        "userId": "string",
        "userName": "string",
        "action": "approve",
        "comment": "string",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## Domains

### List Domains
```http
GET /api/domains
```

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "subdomains": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Domain
```http
POST /api/domains
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "tags": ["string"],
  "owner": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

### Get Domain
```http
GET /api/domains/{id}
```

**Response includes subdomains and flows:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "subdomains": [
    {
      "id": "string",
      "name": "string",
      "flows": []
    }
  ]
}
```

### Update Domain
```http
PUT /api/domains/{id}
Content-Type: application/json

{
  "name": "string",
  "description": "string"
}
```

### Delete Domain
```http
DELETE /api/domains/{id}
```

---

## Subdomains

### List Subdomains for Domain
```http
GET /api/domains/{domainId}/subdomains
```

### Create Subdomain
```http
POST /api/domains/{domainId}/subdomains
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "tags": ["string"]
}
```

### Get Subdomain
```http
GET /api/domains/{domainId}/subdomains/{subdomainId}
```

### Update Subdomain
```http
PUT /api/domains/{domainId}/subdomains/{subdomainId}
Content-Type: application/json

{
  "name": "string",
  "description": "string"
}
```

### Delete Subdomain
```http
DELETE /api/domains/{domainId}/subdomains/{subdomainId}
```

---

## Approval Flows

### List Flows
```http
GET /api/flows?subdomainId={id}&domainId={id}
```

**Query Parameters:**
- `subdomainId` (optional): Filter by subdomain
- `domainId` (optional): Filter by domain (all subdomains)

### Create Flow
```http
POST /api/flows
Content-Type: application/json

{
  "name": "string",
  "version": "1.0.0",
  "description": "string",
  "subdomainId": "string",
  "definition": {
    "stages": []
  }
}
```

### Get Flow
```http
GET /api/flows/{id}
```

### Update Flow
```http
PUT /api/flows/{id}
Content-Type: application/json

{
  "name": "string",
  "version": "string",
  "definition": {}
}
```

### Delete Flow
```http
DELETE /api/flows/{id}
```

**Note:** Cannot delete flow if approvals are using it.

---

## Users

### List Users
```http
GET /api/users
```

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
]
```

---

## Logs

### List Logs
```http
GET /api/logs?level={level}&limit={number}&offset={number}
```

**Query Parameters:**
- `level` (optional): Filter by level (info, warning, error)
- `limit` (optional): Number of logs to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "logs": [],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### Create Log
```http
POST /api/logs
Content-Type: application/json

{
  "level": "info" | "warning" | "error",
  "message": "string",
  "context": {}
}
```

---

## Statistics

### Approval Statistics
```http
GET /api/stats/approvals?period={days}&groupBy={dimension}
```

**Query Parameters:**
- `period` (optional): Time period (e.g., "30d", default: "30d")
- `groupBy` (optional): Group dimension (status, domain, date, default: "status")

**Response:**
```json
{
  "period": "30d",
  "groupBy": "status",
  "total": 150,
  "stats": {
    "in_process": 45,
    "approved": 80,
    "reject": 20,
    "end": 5
  }
}
```

### Domain Statistics
```http
GET /api/stats/domains
```

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "totalSubdomains": 5,
    "activeApprovals": 12,
    "approvalsByStatus": {
      "in_process": 8,
      "approved": 3,
      "reject": 1,
      "end": 0
    }
  }
]
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Missing required fields: name, description"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error"
}
```

---

## Message Queue Events

The following events are published to the message queue:

- `approval.created` - When an approval is created
- `approval.updated` - When an approval is updated
- `approval.approve` - When an approval is approved
- `approval.reject` - When an approval is rejected
- `approval.return` - When an approval is returned

**Event Payload:**
```json
{
  "event": "approval.approve",
  "data": {
    "approvalId": "string",
    "action": "approve",
    "userId": "string",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Testing Examples

### Create an Approval
```bash
curl -X POST http://localhost:3000/api/approvals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Purchase Order #1234",
    "domainId": "billpayment",
    "subdomainId": "sub-billpayment-1",
    "flowId": "flow-billpayment-1",
    "requesterId": "user-1",
    "payload": {
      "amount": 5000,
      "vendor": "ACME Corp"
    }
  }'
```

### Approve an Approval
```bash
curl -X POST http://localhost:3000/api/approvals/{id}/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "userId": "user-2",
    "userName": "John Doe",
    "comment": "Approved - looks good"
  }'
```

### Get Approval Statistics
```bash
curl "http://localhost:3000/api/stats/approvals?period=30d&groupBy=domain"
```
