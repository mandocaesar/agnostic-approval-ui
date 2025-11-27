# User Stories & Acceptance Criteria

## Persona: Workflow Admin (The "Configurator")

### US-01: Visual Workflow Designer
**As an** Admin,
**I want** to visually design an approval workflow with drag-and-drop stages,
**So that** I can easily visualize the process and relationships between steps.

**Acceptance Criteria:**
*   [x] **Canvas Interaction**: Admin can drag "Stage" nodes from a sidebar onto a canvas.
*   [x] **Connecting Nodes**: Admin can draw a line (edge) from one node to another to define the flow direction.
*   [x] **Node Configuration**: Clicking a node opens a side panel to edit its Name, Description, and Approver Role.
*   [x] **Validation**: System prevents saving if the graph has no "Start" node or if nodes are completely disconnected (orphans).
*   [x] **Persistence**: Clicking "Save" persists the graph layout (x,y coordinates) and logic to the database.

### US-02: Conditional Transitions
**As an** Admin,
**I want** to define conditional logic (e.g., "If Amount > 10k") for transitions,
**So that** simple requests are fast-tracked and risky ones get extra scrutiny.

**Acceptance Criteria:**
*   [x] **Condition Editor**: Clicking a transition line opens a "Condition Editor".
*   [x] **Rule Definition**: Admin can define rules using: `Field` (from resource payload), `Operator` (>, <, ==, !=, CONTAINS), and `Value`.
*   [x] **Complex Logic**: Support AND/OR grouping (e.g., `Amount > 10k AND Risk == 'High'`).
*   [x] **Fallback**: Admin must define a "Default" path if no conditions are met (or system enforces coverage).
*   [x] **Validation**: System validates that the `Field` exists in the Resource Type definition.

### US-03: "Return to Sender" Loop
**As an** Admin,
**I want** to configure a "Return to Sender" loop,
**So that** requesters can fix mistakes without restarting the whole process.

**Acceptance Criteria:**
*   [x] **Backward Transition**: Admin can draw a transition line from a later stage (e.g., "Manager Approval") back to an earlier stage (e.g., "Draft" or "Requester Fix").
*   [x] **Loop Limit**: Admin can optionally set a `MaxIterations` count to prevent infinite loops (e.g., max 3 returns).
*   [x] **State Reset**: When returning, the system correctly resets the status of the target node to `Pending` so it can be acted upon again.

### US-04: Webhook Configuration
**As an** Admin,
**I want** to configure Webhooks for specific stages,
**So that** the external domain system is notified immediately upon approval.

**Acceptance Criteria:**
*   [ ] **Event Trigger**: Admin can select "On Entry", "On Exit", or "On Status Change" for a node to trigger the webhook.
*   [ ] **Endpoint Config**: Admin can input the Target URL, HTTP Method (POST/PUT), and custom Headers (e.g., `Authorization`).
*   [ ] **Payload Template**: Admin can customize the JSON payload using placeholders (e.g., `{{approval.id}}`, `{{actor.email}}`).
*   [ ] **Test Button**: Admin can click "Test Webhook" to send a dummy payload and verify connectivity.

---

## Persona: Approver (The "Manager")

### US-05: Unified Approval Inbox
**As an** Approver,
**I want** a single "Inbox" showing approvals from Payment, HR, and IT,
**So that** I don't have to log into 3 different systems.

**Acceptance Criteria:**
*   [ ] **Consolidated List**: Inbox displays a paginated list of all items where `CurrentNode.Approver == Me` OR `CurrentNode.Role IN (MyRoles)`.
*   [ ] **Filtering**: User can filter by Domain (HR, Finance), Status (Pending, Urgent), and Date.
*   [ ] **Quick Actions**: List view has "Quick Approve" and "Quick Reject" buttons for bulk actions.
*   [ ] **Context Preview**: Each item shows a summary (Title, Requester, Key Fields) without needing to open the full details.

### US-06: Approval History & Context
**As an** Approver,
**I want** to see the full history of a request (who else approved it),
**So that** I have context before making my decision.

**Acceptance Criteria:**
*   [ ] **Timeline View**: Detail page shows a vertical timeline of all past steps.
*   [ ] **Step Details**: Each timeline entry shows: Node Name, Actor Name, Action Taken (Approve/Reject), Timestamp, and Comments.
*   [ ] **Current Status**: Clearly highlights the current active stage and who is assigned.

### US-07: Rejection with Comments
**As an** Approver,
**I want** to add a comment when rejecting a request,
**So that** the requester knows what to fix.

**Acceptance Criteria:**
*   [ ] **Mandatory Comment**: If User clicks "Reject", a modal appears requiring a text input (Reason).
*   [ ] **Optional Comment**: If User clicks "Approve", the comment modal is optional.
*   [ ] **Visibility**: Comments are saved and visible to the Requester in the timeline.

---

## Persona: Requester

### US-08: Request Status Tracker
**As an** Requester,
**I want** to see exactly which stage my request is currently in (e.g., "Waiting for VP"),
**So that** I can estimate when it will be done.

**Acceptance Criteria:**
*   [ ] **Visual Progress Bar**: UI shows a linear or graph view of the workflow, highlighting completed steps in Green, current step in Blue, and future steps in Grey.
*   [ ] **ETA Display**: (Optional) System estimates completion time based on historical average for the current stage.
*   [ ] **Blocker Info**: Clearly displays "Waiting for: [Name/Role]" for the current stage.

### US-09: Instant Notifications
**As an** Requester,
**I want** to receive a notification immediately when my request is approved or rejected,
**So that** I can take next steps.

**Acceptance Criteria:**
*   [ ] **Channel Support**: Notifications are sent via Email and In-App Bell.
*   [ ] **Content**: Notification includes Request Title, New Status, and Link to the details page.
*   [ ] **Rejection Details**: If rejected, the notification body includes the Approver's rejection reason.

---

## Persona: System (The "Integration")

### US-10: Secure Webhook Delivery
**As a** Domain Service (e.g., Payment Gateway),
**I want** to receive a signed webhook payload when a transaction is approved,
**So that** I can release the funds securely.

**Acceptance Criteria:**
*   [ ] **Signature Header**: All webhook requests include an `X-Signature` header (HMAC-SHA256) generated using a shared secret.
*   [ ] **Retry Logic**: If the Domain Service returns 5xx or times out, the system retries with exponential backoff (e.g., 1m, 5m, 15m).
*   [ ] **Idempotency**: The payload includes a unique `EventID` so the Domain Service can handle duplicate deliveries safely.

### US-11: Condition Evaluation Engine
**As a** System,
**I want** to evaluate complex nested conditions defined in a JSON DSL against a transaction payload,
**So that** I can determine the correct workflow path dynamically based on data.

**Acceptance Criteria:**
*   [x] **DSL Support**: Engine parses and evaluates the JSON structure defined in `condition-evaluation-guide.md`.
*   [x] **Operator Coverage**: Supports all standard operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `CONTAINS`, `NOT_CONTAINS`, `IN`, `NOT_IN`, `STARTS_WITH`, `ENDS_WITH`, `IS_EMPTY`, `IS_NOT_EMPTY`.
*   [x] **Nesting Logic**: Correctly evaluates recursive `AND` / `OR` groups with arbitrary depth.
*   [x] **Field Resolution**: Can resolve values from nested paths in the payload (e.g., `requester.department`, `workflow.iterationCount`).
*   [x] **Type Safety**: Handles type mismatches gracefully (e.g., comparing string to number returns false or throws specific error).

