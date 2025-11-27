# Getting Started with the Approval System Backend

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or use Prisma's local instance)
- (Optional) Kafka/RabbitMQ for message queue

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Start the Database

The Prisma Postgres instance should already be running. If not:

```bash
npx prisma dev
```

This will start a local PostgreSQL instance on ports 51213-51215.

### 3. Verify Database Connection

Check that the database is running and migrations are applied:

```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555` where you can view/edit data.

### 4. Seed the Database (Optional)

Since the seed script has compatibility issues, you have two options:

**Option A: Use Prisma Studio (Recommended)**
1. Open Prisma Studio: `npx prisma studio`
2. Manually create test data through the GUI

**Option B: Use the API to Create Data**
```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager"
  }'

# Create a domain
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Finance",
    "description": "Financial approvals",
    "tags": ["finance"]
  }'
```

### 5. Start the Development Server

```bash
npm run dev
# or
pnpm run dev
```

The application will be available at `http://localhost:3000`

### 6. Test the API

**Check if API is working:**
```bash
curl http://localhost:3000/api/users
curl http://localhost:3000/api/domains
curl http://localhost:3000/api/approvals
```

## Environment Variables

Create or update `.env` file:

```env
# Database (managed by prisma.config.ts)
DATABASE_URL="prisma+postgres://localhost:51213/..."

# Message Queue (optional)
ENABLE_KAFKA=false
KAFKA_BROKERS=localhost:9092

# Application
NODE_ENV=development
```

## Project Structure

```
approval-ui/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── approvals/    # Approval endpoints
│   │   │   ├── domains/      # Domain endpoints
│   │   │   ├── flows/        # Flow endpoints
│   │   │   ├── logs/         # Logging endpoints
│   │   │   ├── stats/        # Analytics endpoints
│   │   │   └── users/        # User endpoints
│   │   ├── (dashboard)/      # Frontend pages
│   │   └── actions/          # Server Actions
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   ├── queue/            # Message queue
│   │   └── dataStore.ts      # Legacy file storage
│   └── types/
│       └── index.ts          # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts              # Seed script
└── docs/
    └── API.md               # API documentation
```

## Common Tasks

### View Database

```bash
npx prisma studio
```

### Create a New Migration

After modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database

⚠️ This will delete all data:

```bash
npx prisma migrate reset
```

### Generate Prisma Client

After schema changes:

```bash
npx prisma generate
```

## Testing the System

### 1. Create a Complete Workflow

**Step 1: Create a User**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Manager",
    "email": "alice@company.com",
    "role": "manager"
  }'
```

**Step 2: Create a Domain**
```bash
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Procurement",
    "description": "Purchase orders and vendor management"
  }'
```

**Step 3: Create a Subdomain**
```bash
curl -X POST http://localhost:3000/api/domains/{DOMAIN_ID}/subdomains \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Purchase Orders",
    "description": "PO approvals"
  }'
```

**Step 4: Create an Approval Flow**
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard PO Approval",
    "version": "1.0.0",
    "description": "Standard purchase order approval flow",
    "subdomainId": "{SUBDOMAIN_ID}",
    "definition": {
      "stages": [
        {
          "id": "stage-1",
          "name": "Manager Review",
          "status": "in_process",
          "actor": "manager",
          "transitions": []
        }
      ]
    }
  }'
```

**Step 5: Create an Approval**
```bash
curl -X POST http://localhost:3000/api/approvals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Purchase Order #1001",
    "domainId": "{DOMAIN_ID}",
    "subdomainId": "{SUBDOMAIN_ID}",
    "flowId": "{FLOW_ID}",
    "requesterId": "{USER_ID}",
    "payload": {
      "amount": 5000,
      "vendor": "ACME Corp",
      "items": ["Laptops", "Monitors"]
    }
  }'
```

**Step 6: Approve the Approval**
```bash
curl -X POST http://localhost:3000/api/approvals/{APPROVAL_ID}/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "userId": "{USER_ID}",
    "userName": "Alice Manager",
    "comment": "Approved - budget available"
  }'
```

### 2. View Statistics

```bash
# Approval statistics by status
curl "http://localhost:3000/api/stats/approvals?groupBy=status"

# Approval statistics by domain
curl "http://localhost:3000/api/stats/approvals?groupBy=domain&period=30d"

# Domain statistics
curl http://localhost:3000/api/stats/domains
```

## Accessing the Frontend

Navigate to:
- Dashboard: `http://localhost:3000/dashboard`
- Approvals: `http://localhost:3000/dashboard/approvals`
- Domains: `http://localhost:3000/dashboard/domains`
- Rules: `http://localhost:3000/dashboard/rules`

## Message Queue Setup (Optional)

### Using Kafka

1. **Start Kafka:**
```bash
# Using Docker
docker run -d --name kafka \
  -p 9092:9092 \
  apache/kafka:latest
```

2. **Enable in `.env`:**
```env
ENABLE_KAFKA=true
KAFKA_BROKERS=localhost:9092
```

3. **Restart the application**

Events will now be published to Kafka topics.

## Troubleshooting

### Database Connection Issues

```bash
# Check if Prisma dev is running
ps aux | grep prisma

# Restart Prisma dev
npx prisma dev
```

### API Not Responding

```bash
# Check if dev server is running
ps aux | grep next

# Restart dev server
npm run dev
```

### Prisma Client Not Found

```bash
# Regenerate Prisma Client
npx prisma generate
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## Next Steps

1. **Explore the API**: Check `docs/API.md` for complete endpoint documentation
2. **Customize Workflows**: Modify approval flows in the Rules section
3. **Add Authentication**: Implement API key or JWT authentication
4. **Set up Monitoring**: Add logging and monitoring tools
5. **Deploy**: Deploy to production (Vercel, AWS, etc.)

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npx prisma studio             # Open database GUI
npx prisma migrate dev        # Run migrations

# Database
npx prisma db push            # Push schema without migration
npx prisma db pull            # Pull schema from database
npx prisma migrate reset      # Reset database

# Production
npm run build                 # Build for production
npm run start                 # Start production server

# Prisma
npx prisma generate           # Generate Prisma Client
npx prisma format             # Format schema file
```

## Support

- API Documentation: `docs/API.md`
- Database Schema: `prisma/schema.prisma`
- Frontend Pages: `src/app/(dashboard)/`
- API Routes: `src/app/api/`

## Quick Reference

**Base URL:** `http://localhost:3000/api`

**Main Endpoints:**
- `GET /api/approvals` - List approvals
- `POST /api/approvals` - Create approval
- `POST /api/approvals/{id}/actions` - Approve/Reject
- `GET /api/domains` - List domains
- `GET /api/flows` - List flows
- `GET /api/stats/approvals` - Statistics

**Database GUI:** `http://localhost:5555` (Prisma Studio)
**Frontend:** `http://localhost:3000/dashboard`
