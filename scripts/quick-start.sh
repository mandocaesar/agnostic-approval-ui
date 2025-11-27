#!/bin/bash

# Quick Start Script for Approval System Backend
# This script helps you get started quickly

set -e

echo "🚀 Approval System - Quick Start"
echo "================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000/api/users > /dev/null 2>&1; then
    echo "❌ Dev server is not running on port 3000"
    echo "Please start it with: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Check if Prisma dev is running
if ! curl -s http://localhost:51213 > /dev/null 2>&1; then
    echo "⚠️  Prisma Postgres might not be running"
    echo "Start it with: npx prisma dev"
    echo ""
fi

echo "📊 Current System Status:"
echo "------------------------"

# Check users
USERS=$(curl -s http://localhost:3000/api/users | jq length 2>/dev/null || echo "0")
echo "Users: $USERS"

# Check domains
DOMAINS=$(curl -s http://localhost:3000/api/domains | jq length 2>/dev/null || echo "0")
echo "Domains: $DOMAINS"

# Check approvals
APPROVALS=$(curl -s http://localhost:3000/api/approvals | jq length 2>/dev/null || echo "0")
echo "Approvals: $APPROVALS"

echo ""
echo "🎯 Quick Actions:"
echo "----------------"
echo "1. Open Prisma Studio (Database GUI): npx prisma studio"
echo "2. View API Documentation: cat docs/API.md"
echo "3. View Frontend: open http://localhost:3000/dashboard"
echo ""

if [ "$USERS" -eq 0 ] || [ "$DOMAINS" -eq 0 ]; then
    echo "⚠️  Database appears to be empty"
    echo ""
    echo "Would you like to create sample data? (y/n)"
    read -r response
    
    if [ "$response" = "y" ]; then
        echo ""
        echo "Creating sample data..."
        
        # Create a user
        echo "Creating user..."
        USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users \
          -H "Content-Type: application/json" \
          -d '{
            "name": "John Manager",
            "email": "john@company.com",
            "role": "manager"
          }')
        
        USER_ID=$(echo $USER_RESPONSE | jq -r .id 2>/dev/null || echo "")
        
        if [ -n "$USER_ID" ]; then
            echo "✅ Created user: $USER_ID"
        else
            echo "❌ Failed to create user"
        fi
        
        # Create a domain
        echo "Creating domain..."
        DOMAIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/domains \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Finance",
            "description": "Financial approvals and purchase orders",
            "tags": ["finance", "procurement"]
          }')
        
        DOMAIN_ID=$(echo $DOMAIN_RESPONSE | jq -r .id 2>/dev/null || echo "")
        
        if [ -n "$DOMAIN_ID" ]; then
            echo "✅ Created domain: $DOMAIN_ID"
            
            # Create a subdomain
            echo "Creating subdomain..."
            SUBDOMAIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/domains/$DOMAIN_ID/subdomains" \
              -H "Content-Type: application/json" \
              -d '{
                "name": "Purchase Orders",
                "description": "PO approval workflow"
              }')
            
            SUBDOMAIN_ID=$(echo $SUBDOMAIN_RESPONSE | jq -r .id 2>/dev/null || echo "")
            
            if [ -n "$SUBDOMAIN_ID" ]; then
                echo "✅ Created subdomain: $SUBDOMAIN_ID"
                
                # Create a flow
                echo "Creating approval flow..."
                FLOW_RESPONSE=$(curl -s -X POST http://localhost:3000/api/flows \
                  -H "Content-Type: application/json" \
                  -d "{
                    \"name\": \"Standard PO Approval\",
                    \"version\": \"1.0.0\",
                    \"description\": \"Standard purchase order approval\",
                    \"subdomainId\": \"$SUBDOMAIN_ID\",
                    \"definition\": {
                      \"stages\": [
                        {
                          \"id\": \"stage-1\",
                          \"name\": \"Manager Review\",
                          \"status\": \"in_process\",
                          \"actor\": \"manager\",
                          \"transitions\": []
                        }
                      ]
                    }
                  }")
                
                FLOW_ID=$(echo $FLOW_RESPONSE | jq -r .id 2>/dev/null || echo "")
                
                if [ -n "$FLOW_ID" ] && [ -n "$USER_ID" ]; then
                    echo "✅ Created flow: $FLOW_ID"
                    
                    # Create an approval
                    echo "Creating sample approval..."
                    APPROVAL_RESPONSE=$(curl -s -X POST http://localhost:3000/api/approvals \
                      -H "Content-Type: application/json" \
                      -d "{
                        \"title\": \"Purchase Order #1001\",
                        \"domainId\": \"$DOMAIN_ID\",
                        \"subdomainId\": \"$SUBDOMAIN_ID\",
                        \"flowId\": \"$FLOW_ID\",
                        \"requesterId\": \"$USER_ID\",
                        \"payload\": {
                          \"amount\": 5000,
                          \"vendor\": \"ACME Corp\",
                          \"description\": \"Office supplies\"
                        }
                      }")
                    
                    APPROVAL_ID=$(echo $APPROVAL_RESPONSE | jq -r .id 2>/dev/null || echo "")
                    
                    if [ -n "$APPROVAL_ID" ]; then
                        echo "✅ Created approval: $APPROVAL_ID"
                    fi
                fi
            fi
        fi
        
        echo ""
        echo "✅ Sample data created successfully!"
    fi
fi

echo ""
echo "🌐 Useful URLs:"
echo "--------------"
echo "Frontend Dashboard: http://localhost:3000/dashboard"
echo "Approvals Page: http://localhost:3000/dashboard/approvals"
echo "Domains Page: http://localhost:3000/dashboard/domains"
echo "Prisma Studio: http://localhost:5555 (run: npx prisma studio)"
echo ""
echo "📚 Documentation:"
echo "----------------"
echo "API Docs: docs/API.md"
echo "Getting Started: docs/GETTING_STARTED.md"
echo ""
echo "Happy coding! 🎉"
