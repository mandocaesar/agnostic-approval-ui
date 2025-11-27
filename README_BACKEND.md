# Approval System Backend - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Ensure Services are Running

You should already have these running:
- ✅ Dev server: `pnpm run dev` (port 3000)
- ✅ Prisma Postgres: `npx prisma dev` (ports 51213-51215)

### 2. Run the Quick Start Script

```bash
./scripts/quick-start.sh
```

This script will:
- Check if services are running
- Show current system status
- Optionally create sample data for testing

### 3. Access the Application

**Frontend:**
- Dashboard: http://localhost:3000/dashboard
- Approvals: http://localhost:3000/dashboard/approvals
- Domains: http://localhost:3000/dashboard/domains

**Database GUI:**
```bash
npx prisma studio
```
Opens at http://localhost:5555

## 📚 Documentation

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Detailed setup instructions
- **[API Documentation](docs/API.md)** - Complete API reference with examples
- **[Walkthrough](../.gemini/antigravity/brain/*/walkthrough.md)** - Implementation details

## 🔧 Quick Commands

```bash
# View database
npx prisma studio

# Test API
curl http://localhost:3000/api/users
curl http://localhost:3000/api/domains
curl http://localhost:3000/api/approvals

# Create sample data
./scripts/quick-start.sh
```

## 📊 API Endpoints

**Base URL:** `http://localhost:3000/api`

### Core Resources
- `GET /api/approvals` - List approvals
- `POST /api/approvals` - Create approval
- `GET /api/domains` - List domains
- `GET /api/flows` - List approval flows
- `GET /api/users` - List users

### Actions
- `POST /api/approvals/{id}/actions` - Approve/Reject/Return

### Statistics
- `GET /api/stats/approvals` - Approval statistics
- `GET /api/stats/domains` - Domain statistics

See [API.md](docs/API.md) for complete documentation.

## 🎯 Example: Create Your First Approval

```bash
# 1. Create a user (if needed)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager"
  }'

# 2. Create a domain (if needed)
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Finance",
    "description": "Financial approvals"
  }'

# 3. Create an approval
curl -X POST http://localhost:3000/api/approvals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invoice #1234",
    "domainId": "YOUR_DOMAIN_ID",
    "subdomainId": "YOUR_SUBDOMAIN_ID",
    "flowId": "YOUR_FLOW_ID",
    "requesterId": "YOUR_USER_ID",
    "payload": {"amount": 5000}
  }'
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (via Prisma)
- **ORM:** Prisma 7
- **Message Queue:** Kafka/RabbitMQ (optional)
- **API:** REST (24 endpoints)

## 📁 Project Structure

```
approval-ui/
├── src/app/api/          # API Routes (24 endpoints)
├── src/lib/              # Utilities (Prisma, Queue)
├── prisma/               # Database schema & migrations
├── docs/                 # Documentation
└── scripts/              # Helper scripts
```

## 🔍 Troubleshooting

**API not responding?**
```bash
# Check if dev server is running
curl http://localhost:3000/api/users
```

**Database empty?**
```bash
# Run quick start script to create sample data
./scripts/quick-start.sh
```

**Need to reset database?**
```bash
npx prisma migrate reset
```

## 📖 Next Steps

1. ✅ Run `./scripts/quick-start.sh` to create sample data
2. ✅ Open http://localhost:3000/dashboard to view the frontend
3. ✅ Open Prisma Studio to explore the database
4. ✅ Read [API.md](docs/API.md) for complete API documentation
5. ✅ Test API endpoints with curl or Postman

## 🎉 You're Ready!

The backend is fully functional with:
- ✅ 24 REST API endpoints
- ✅ PostgreSQL database
- ✅ Message queue integration
- ✅ Complete documentation

Happy coding! 🚀
