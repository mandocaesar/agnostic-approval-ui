# Go Backend Technical Specification: Agnostic Approval Platform

**Version**: 1.0  
**Stack**: Go 1.21+ | Echo v4 | PostgreSQL 15+ | Redis 7+ | Kafka | sqlc | Elastic APM  
**Last Updated**: 2025-11-25

---

## 1. Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Language | Go | 1.21+ | Runtime |
| Framework | Echo | v4 | HTTP server |
| Database | PostgreSQL | 15+ | Primary datastore |
| Cache | Redis | 7+ | Caching, idempotency, rate limiting |
| Message Broker | Kafka | 3.x | Event streaming |
| SQL Generator | sqlc | 1.25+ | Type-safe SQL queries |
| Migration | Goose | 3.x | Database migrations |
| Logging | Logrus | 1.9+ | Structured logging |
| APM | Elastic APM | Latest | Distributed tracing (50% sampling) |
| Circuit Breaker | sony/gobreaker | Latest | Fault tolerance |
| Rate Limiter | golang.org/x/time/rate | Latest | API throttling |
| Expression Engine | google/cel-go | Latest | Condition evaluation |
| Kafka Client | Shopify/sarama | Latest | Kafka producer/consumer |
| Error Handling | pkg/errors | Latest | Error wrapping |
| Testing | testify | Latest | Test assertions |

---

## 2. Project Structure

```
approval-be/
├── cmd/
│   ├── api/                    # API server entrypoint
│   │   └── main.go
│   ├── worker/                 # Background worker
│   │   └── main.go
│   └── migrator/              # Migration runner
│       └── main.go
├── internal/
│   ├── config/                # Configuration
│   │   └── config.go
│   ├── domain/                # Domain models
│   │   ├── approval.go
│   │   ├── flow.go
│   │   └── errors.go
│   ├── handler/               # HTTP handlers (Echo)
│   │   ├── approval_handler.go
│   │   ├── flow_handler.go
│   │   └── task_handler.go
│   ├── middleware/            # Echo middleware
│   │   ├── idempotency.go
│   │   ├── rate_limiter.go
│   │   ├── circuit_breaker.go
│   │   ├── apm.go
│   │   └── logger.go
│   ├── repository/            # sqlc generated code
│   │   ├── db.go
│   │   ├── models.go
│   │   ├── queries.sql.go
│   │   └── ...
│   ├── service/               # Business logic
│   │   ├── workflow_service.go
│   │   ├── approval_service.go
│   │   ├── condition_evaluator.go
│   │   ├── approver_resolver.go
│   │   └── event_service.go
│   ├── worker/                # Background jobs
│   │   ├── outbox_processor.go
│   │   ├── timeout_monitor.go
│   │   └── webhook_worker.go
│   ├── kafka/                 # Kafka integration
│   │   ├── producer.go
│   │   └── consumer.go
│   └── pkg/                   # Shared utilities
│       ├── redis/
│       ├── logger/
│       └── validator/
├── migrations/                # Goose migrations
│   ├── 00001_initial_schema.sql
│   ├── 00002_add_outbox.sql
│   └── ...
├── sql/                       # sqlc queries
│   ├── schema.sql
│   └── queries.sql
├── sqlc.yaml                  # sqlc configuration
├── docker-compose.yml         # Local development
├── Dockerfile
└── go.mod
```

---

## 3. Database Schema & sqlc Configuration

### 3.1 sqlc.yaml

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "sql/queries.sql"
    schema: "sql/schema.sql"
    gen:
      go:
        package: "repository"
        out: "internal/repository"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_prepared_queries: false
        emit_interface: true
        emit_empty_slices: true
        emit_pointers_for_null_types: true
        query_parameter_limit: 10
```

### 3.2 Core Schema (sql/schema.sql)

```sql
-- Domains
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_domain_id UUID REFERENCES domains(id),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Resource Types
CREATE TABLE resource_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    schema JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(domain_id, name)
);

-- Approval Flows
CREATE TABLE approval_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type_id UUID NOT NULL REFERENCES resource_types(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    version INT NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_draft BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    published_at TIMESTAMPTZ,
    published_by UUID,
    UNIQUE(resource_type_id, version)
);

CREATE INDEX idx_flows_active ON approval_flows(resource_type_id, is_active) 
    WHERE is_active = true;

-- Approval Instances
CREATE TYPE instance_status AS ENUM (
    'draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'error'
);

CREATE TABLE approval_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES approval_flows(id),
    flow_version INT NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(200) NOT NULL,
    resource_data JSONB NOT NULL,
    status instance_status DEFAULT 'draft',
    current_node_id VARCHAR(100),
    requester_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instances_status ON approval_instances(status);
CREATE INDEX idx_instances_requester ON approval_instances(requester_id);
CREATE INDEX idx_instances_resource ON approval_instances(resource_type, resource_id);

-- Node Executions
CREATE TYPE node_status AS ENUM (
    'pending', 'in_progress', 'completed', 'skipped', 'timeout', 'error'
);

CREATE TYPE node_outcome AS ENUM (
    'approved', 'rejected', 'returned', 'escalated', 'skipped'
);

CREATE TABLE node_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    node_name VARCHAR(200) NOT NULL,
    status node_status DEFAULT 'pending',
    outcome node_outcome,
    assigned_to UUID[],
    approved_by UUID[],
    rejected_by UUID[],
    required_approvals INT DEFAULT 1,
    received_approvals INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_node_exec_instance ON node_executions(instance_id);
CREATE INDEX idx_node_exec_assigned ON node_executions USING GIN(assigned_to);
CREATE INDEX idx_node_exec_status ON node_executions(status);

-- Audit Logs (Partitioned by month)
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
    node_execution_id UUID REFERENCES node_executions(id),
    event_type VARCHAR(100) NOT NULL,
    actor JSONB NOT NULL,
    action VARCHAR(200) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE INDEX idx_audit_instance ON audit_logs(instance_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);

-- Create initial partition
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Event Outbox (for reliable event delivery)
CREATE TYPE event_status AS ENUM ('pending', 'processing', 'sent', 'failed');

CREATE TABLE event_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status event_status DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending ON event_outbox(status, next_retry_at) 
    WHERE status IN ('pending', 'processing');

-- Idempotency Keys
CREATE TABLE idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    request_hash VARCHAR(64) NOT NULL,
    response_status INT NOT NULL,
    response_body JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
    node_execution_id UUID REFERENCES node_executions(id),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_instance ON comments(instance_id);
```

### 3.3 Sample sqlc Queries (sql/queries.sql)

See full specification document for comprehensive query examples.

---

## 4. Middleware Implementation

### 4.1 Idempotency Middleware (24h TTL)

**Purpose**: Prevent duplicate requests for POST/PUT/DELETE operations  
**Implementation**: Request fingerprinting with Redis/DB storage  
**Configuration**: Global middleware with per-endpoint override capability

```go
// Apply globally but can be configured per endpoint
idempotencyMW := middleware.Idempotency(middleware.Idempotency Config{
    Enabled: true,
    TTL:     24 * time.Hour,
    Repo:    queries,
})

// Use on specific endpoints
api.POST("/approvals", handler.CreateApproval, idempotencyMW)
```

### 4.2 Rate Limiter (Global + Per-Endpoint)

**Global**: 100 req/sec with burst of 200  
**Per-Endpoint**: Configurable for critical endpoints

```go
// Global rate limiter
e.Use(middleware.RateLimiter(middleware.RateLimiterConfig{
    RequestsPerSecond: 100,
    Burst:             200,
    SkipPaths:         []string{"/health", "/ready"},
}))

// Per-endpoint critical rate limiter (10 req/sec)
criticalRL := middleware.NewEndpointRateLimiter(10, 20)
api.POST("/approvals/:id/action", handler.Process, criticalRL.Middleware())
```

### 4.3 Circuit Breaker

**Configuration**: 50% failure rate over 10 requests triggers open state  
**Use Cases**: External HR/Identity lookups, webhook calls

### 4.4 Elastic APM

**Sampling Rate**: 50%  
**Custom Spans**: Condition evaluation, approver resolution, workflow transitions, webhook delivery

```go
// Custom span example
func (s *Service) ProcessApproval(c echo.Context, id string) error {
    span := middleware.StartSpan(c, "ProcessApproval")
    if span != nil {
        defer span.End()
        span.Context.SetLabel("instance_id", id)
    }
    // Business logic
}
```

---

## 5. Background Workers with Goroutines

### 5.1 Goroutine Usage

**Outbox Processor**: Parallel event publishing with semaphore-based concurrency control  
**Webhook Worker**: Worker pool pattern with circuit breaker  
**Timeout Monitor**: Periodic checks with context-aware cancellation

### 5.2 Context Propagation Pattern

```go
func (s *Service) ProcessWithGoroutines(ctx context.Context) error {
    workerCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()
    
    errCh := make(chan error, 3)
    
    go s.worker1(workerCtx, errCh)
    go s.worker2(workerCtx, errCh)
    go s.worker3(workerCtx, errCh)
    
    // Wait for all or first error
    for i := 0; i < 3; i++ {
        if err := <-errCh; err != nil {
            cancel() // Cancel all workers
            return err
        }
    }
    
    return nil
}
```

### 5.3 Semaphore-Based Concurrency Control

```go
// Limit concurrent goroutines to 10
sem := make(chan struct{}, 10)

for _, event := range events {
    sem <- struct{}{} // Acquire
    
    go func(evt Event) {
        defer func() { <-sem }() // Release
        processEvent(ctx, evt)
    }(event)
}

// Wait for all
for i := 0; i < cap(sem); i++ {
    sem <- struct{}{}
}
```

---

## 6. Advanced Features (Surprises 🎁)

### Surprise #1: Distributed Tracing Across Kafka

Automatic trace context propagation in Kafka message headers:

```go
func (ap *AsyncProducer) PublishWithTrace(ctx context.Context, topic, key string, event interface{}) error {
    tx := apm.TransactionFromContext(ctx)
    if tx != nil {
        traceContext := tx.TraceContext()
        headers := []sarama.RecordHeader{
            {Key: []byte("elastic-apm-traceparent"), Value: []byte(traceContext.String())},
        }
        // Attach headers to Kafka message
    }
}
```

### Surprise #2: Webhook Worker Pool with Circuit Breaker

Goroutine-based worker pool with fault tolerance:
- Configurable worker count
- Circuit breaker for external calls
- Exponential backoff retry

### Surprise #3: Automatic Partition Management

Cron job to auto-create monthly audit log partitions:

```go
func createNextMonthPartition(db *sql.DB) error {
    nextMonth := time.Now().AddDate(0, 1, 0)
    tableName := fmt.Sprintf("audit_logs_%s", nextMonth.Format("2006_01"))
    // Create partition automatically
}
```

### Surprise #4: Redis Distributed Lock for Race Conditions

Prevent concurrent approval on same node:

```go
lockKey := fmt.Sprintf("lock:approval:%s", nodeID)
acquired, _ := redis.SetNXtime.Second).Result ()
if !acquired {
    return errors.New("resource locked - concurrent modification")
}
defer redis.Del(ctx, lockKey)
```

---

## 7. Health & Readiness Checks

```go
// Liveness: /health - Is app running?
// Readiness: /ready - Can app serve traffic?

func (h *HealthHandler) Readiness(c echo.Context) error {
    checks := map[string]string{
        "database": h.checkDatabase(ctx),
        "redis":    h.checkRedis(ctx),
    }
    
    allHealthy := true
    for _, status := range checks {
        if status != "healthy" {
            allHealthy = false
        }
    }
    
    statusCode := http.StatusOK
    if !allHealthy {
        statusCode = http.StatusServiceUnavailable
    }
    
    return c.JSON(statusCode, checks)
}
```

---

## 8. Condition Evaluation with CEL

**Engine**: Google CEL (Common Expression Language)  
**Capabilities**: Type-safe expression evaluation  
**Use Cases**: Workflow transition conditions

```go
// Example condition: "amount > 10000 && risk == 'high'"
evaluator := NewConditionEvaluator()
result, err := evaluator.Evaluate(conditions, resourceData)
```

---

## 9. Event-Driven Architecture

### 9.1 Async Kafka Producer

**Pattern**: Fire-and-forget with background result handling  
**Guarantees**: At-least-once delivery  
**Monitoring**: Success/failure tracking in separate goroutines

### 9.2 Outbox Pattern

**Reliability**: Transactional outbox for guaranteed event delivery  
**Processing**: Background worker polls pending events  
**Retry**: Exponential backoff with max retries

---

## 10. Testing Strategy

**Framework**: testify with table-driven tests  
**Mocking**: Mock repositories and external dependencies  
**Coverage**: Unit, integration, and end-to-end tests

```go
func TestApprovalService_CreateInstance(t *testing.T) {
    tests := []struct {
        name    string
        input   CreateInstanceInput
        want    *ApprovalInstance
        wantErr bool
    }{
        // Test cases
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test implementation
        })
    }
}
```

---

## 11. Error Handling

**Library**: pkg/errors for error wrapping  
**Pattern**: Wrap errors with context at each layer  
**Response Format**: RFC 7807 Problem Details

```go
import "github.com/pkg/errors"

func (s *Service) Process(id string) error {
    instance, err := s.repo.Get(id)
    if err != nil {
        return errors.Wrap(err, "failed to get instance")
    }
    // Process
}
```

---

## 12. Configuration

```yaml
# config.yaml
server:
  port: 8080

database:
  url: postgresql://user:pass@localhost:5432/approval_db
  max_open_conns: 25
  max_idle_conns: 10
  conn_max_lifetime: 30

redis:
  addr: localhost:6379
  password: ""
  db: 0

kafka:
  brokers:
    - localhost:9092

apm:
  service_name: approval-api
  server_url: http://localhost:8200
  sample_rate: 0.5

log:
  level: info
```

---

## 13. Deployment

### Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /approval-api cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /approval-api .
EXPOSE 8080
CMD ["./approval-api"]
```

---

## 14. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SQL Layer | sqlc | Type-safe queries, compile-time verification |
| Rate Limiting | golang.org/x/time/rate | Native, performant, configurable |
| Circuit Breaker | sony/gobreaker | Battle-tested, simple API |
| Expression Engine | google/cel-go | Industry standard, type-safe |
| Kafka Client | Shopify/sarama | Pure Go, widely adopted |
| Error Handling | pkg/errors | Context-rich error wrapping |
| APM | Elastic APM | Company standard, robust tracing |

---

## 15. Performance Targets

| Metric | Target |
|--------|--------|
| GET /approvals/:id | P95 < 100ms |
| POST /approvals | P95 < 200ms |
| POST /approvals/:id/action | P95 < 300ms |
| Database connections | Max 25 |
| Goroutine pool size | 10 (webhooks), 50 (outbox) |
| idempotency TTL | 24 hours |
| Rate limit (global) | 100 req/sec, burst 200 |
| APM sampling | 50% |

---

**END OF GO TECHNICAL SPECIFICATION**
