# Creating Sample Approval Data

## Quick Method: Using the API Endpoint

### 1. Make sure your dev server is running:
```bash
pnpm dev
```

### 2. Create sample approvals by calling the API:

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/approvals/create-samples
```

**Using your browser:**
Simply open your browser console and run:
```javascript
fetch('http://localhost:3000/api/approvals/create-samples', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

### 3. Check the results:
Visit `http://localhost:3000/dashboard/approvals/all` to see your new sample approvals!

## What Gets Created

The API will create 10 sample approval requests with realistic scenarios:

- ✅ Emergency Server Maintenance
- ✅ Budget Increase Requests
- ✅ Feature Deployments
- ✅ Contract Renewals
- ✅ Database Schema Changes
- ✅ Marketing Campaigns
- ✅ Security Policy Updates
- ✅ Vendor Onboarding
- ✅ Infrastructure Upgrades
- ✅ Equipment Requests

Each approval will have:
- Random status (mostly in_process, some approved/rejected)
- Realistic payload data
- Assigned approvers
- Submission timestamps from the past week
- Current stage based on workflow

## Prerequisites

Before creating samples, ensure you have:
1. ✅ Database seeded with users, domains, and flows
2. ✅ At least one complete workflow defined
3. ✅ Dev server running

If you haven't seeded your database yet:
```bash
pnpm db:seed
```

## Example Response

```json
{
  "success": true,
  "count": 10,
  "approvals": [
    {
      "id": "uuid-here",
      "title": "Emergency Server Maintenance #1",
      "status": "in_process",
      "domain": "Platform Engineering",
      "subdomain": "Infrastructure"
    }
    // ... more approvals
  ],
  "summary": {
    "inProcess": 6,
    "approved": 2,
    "rejected": 2
  }
}
```

## Testing the Full Workflow

After creating samples, you can:

1. **View all approvals**: `/dashboard/approvals/all`
2. **View approval details**: Click on any approval to see the detail page
3. **Take actions**: Use the action form to approve/reject/revise pending approvals
4. **Check timeline**: See the history of actions taken on each approval
