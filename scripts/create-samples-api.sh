#!/bin/bash

# Sample approval creation script using API
# This creates realistic approval requests via the HTTP API

BASE_URL="http://localhost:3000"

echo "🚀 Creating sample approval requests via API..."
echo ""

# First, get domains and users to work with
echo "📊 Fetching existing data..."

# Sample approval payloads
declare -a APPROVALS=(
  '{
    "title": "Emergency Server Maintenance",
    "payload": {
      "type": "maintenance",
      "server": "prod-api-01",
      "duration": "2 hours",
      "impact": "high",
      "reason": "Critical security patch deployment"
    }
  }'
  '{
    "title": "Budget Increase Request Q1 2026",
    "payload": {
      "department": "Engineering",
      "currentBudget": 100000,
      "requestedBudget": 150000,
      "increase": 50000,
      "reason": "Additional hiring for Q1 2026"
    }
  }'
  '{
    "title": "New Feature Deployment - Analytics",
    "payload": {
      "feature": "User Analytics Dashboard",
      "environment": "production",
      "estimatedUsers": 5000,
      "riskLevel": "medium",
      "rollbackPlan": true
    }
  }'
  '{
    "title": "Contract Renewal - Cloud Services",
    "payload": {
      "vendor": "Cloud Services Inc",
      "contractValue": 75000,
      "term": "12 months",
      "previousValue": 60000
    }
  }'
  '{
    "title": "Database Schema Migration",
    "payload": {
      "database": "users_db",
      "changeType": "add_column",
      "affectedTables": ["users", "user_profiles"],
      "backupCompleted": true,
      "estimatedDowntime": "5 minutes"
    }
  }'
  '{
    "title": "Marketing Campaign Budget",
    "payload": {
      "campaign": "Q4 Product Launch",
      "budget": 25000,
      "channels": ["social_media", "email", "paid_ads"],
      "expectedROI": "3x",
      "duration": "30 days"
    }
  }'
  '{
    "title": "Security Policy Update - MFA",
    "payload": {
      "policyName": "Remote Access Policy",
      "changes": ["Add MFA requirement", "Update VPN protocols"],
      "affectedUsers": 150,
      "effectiveDate": "2025-12-15"
    }
  }'
  '{
    "title": "Vendor Onboarding - Analytics Pro",
    "payload": {
      "vendorName": "Analytics Pro LLC",
      "service": "Business Intelligence Tools",
      "monthlyFee": 5000,
      "contractLength": "24 months"
    }
  }'
  '{
    "title": "Infrastructure Upgrade - Load Balancer",
    "payload": {
      "component": "Load Balancer",
      "currentCapacity": "10k req/sec",
      "newCapacity": "50k req/sec",
      "cost": 12000
    }
  }'
  '{
    "title": "Employee Equipment Request",
    "payload": {
      "equipment": "MacBook Pro M3",
      "quantity": 1,
      "unitPrice": 3500,
      "justification": "Current laptop is 4 years old"
    }
  }'
)

echo "✨ This script would create ${#APPROVALS[@]} sample approvals"
echo ""
echo "⚠️  Note: To create approvals, you need:"
echo "   1. The app running (pnpm dev)"
echo "   2. Valid domain, subdomain, flow, and user IDs from your database"
echo "   3. POST to ${BASE_URL}/api/approvals with proper request body"
echo ""
echo "📋 Example curl command:"
echo ""
echo 'curl -X POST http://localhost:3000/api/approvals \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "title": "Emergency Server Maintenance",
    "domainId": "YOUR_DOMAIN_ID",
    "subdomainId": "YOUR_SUBDOMAIN_ID", 
    "flowId": "YOUR_FLOW_ID",
    "requesterId": "YOUR_USER_ID",
    "approverIds": ["APPROVER_USER_ID"],
    "status": "in_process",
    "currentStageId": "FIRST_STAGE_ID",
    "payload": {
      "type": "maintenance",
      "server": "prod-api-01"
    }
  }'"'"
echo ""
echo "💡 You can get IDs by querying:"
echo "   - Domains: curl http://localhost:3000/api/domains"
echo "   - Users: curl http://localhost:3000/api/users"
echo "   - Flows: curl http://localhost:3000/api/flows"
