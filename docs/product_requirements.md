# Product Requirements Document (PRD): Agnostic Approval System

## 1. Introduction
**Product Name**: Agnostic Approval Platform (AAP)
**Status**: Draft
**Version**: 1.0

## 2. Problem Statement
Enterprises manage multiple domains (Payment, HR, Inventory), each requiring unique approval workflows. Currently, approval logic is hardcoded within each domain, leading to:
*   Duplicated effort building workflow engines.
*   Inconsistent audit trails.
*   Lack of a unified view for managers who approve items across multiple domains.
*   Difficulty in changing workflows (requires code deployment).

## 3. Goals & Objectives
*   **Centralize**: Provide a single platform for defining and executing approval workflows.
*   **Flexibility**: Support complex, cyclic, and conditional flows.
*   **Visibility**: Unified dashboard for all approvals and comprehensive audit logging.
*   **Integration**: Seamlessly integrate with domains via events (Webhooks/Kafka).

## 4. Functional Requirements

### 4.1. Domain & Workflow Management
*   **FR-01**: System MUST support hierarchical organization: Domain -> Subdomain -> Resource Type.
*   **FR-02**: System MUST allow defining workflows as directed graphs (supporting cycles).
*   **FR-03**: Workflows MUST support versioning. Old approvals stay on old versions; new ones use the new version.

### 4.2. Approval Execution
*   **FR-04**: System MUST support "States" (e.g., Draft, Pending, Approved, Rejected, Returned).
*   **FR-05**: Transitions MUST support "Conditions" (e.g., `amount > 5000`).
*   **FR-06**: Transitions MUST support "Actions" (e.g., Webhook, Kafka Event).
*   **FR-07**: System MUST support dynamic approver resolution (Users, Roles, or External Lookups).

### 4.3. Dashboard & Analytics
*   **FR-08**: **My Approvals**: A view for users to see pending items requiring their attention.
*   **FR-09**: **My Requests**: A view for requesters to track their submissions.
*   **FR-10**: **Metrics**: Dashboard showing "Average Approval Time", "Bottlenecks", "Rejection Rates".

### 4.4. Audit & Notifications
*   **FR-11**: Every state change MUST be immutably logged with Timestamp, Actor, Previous State, New State, and Metadata.
*   **FR-12**: System MUST send notifications (Email/In-App) on state changes.

## 5. Non-Functional Requirements
*   **NFR-01 (Reliability)**: 99.9% Uptime.
*   **NFR-02 (Consistency)**: Event delivery must be "At Least Once".
*   **NFR-03 (Security)**: Role-Based Access Control (RBAC) for workflow editing vs. approving.

## 6. Data Model (Draft)
*   **ApprovalFlow**: Defines the graph.
*   **ApprovalInstance**: A running instance of a flow.
*   **AuditLog**: Immutable history.
