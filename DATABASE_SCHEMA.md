# Database Schema Documentation

## Overview

Enterprise Hub uses Base44's entity management system, which provides a flexible NoSQL database with relational capabilities. All entities are managed through the Base44 SDK.

## Entity Schemas

### User Entity

**Purpose**: Represents system users with role-based access control.

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  email: string,                 // User's email (unique)
  full_name: string,             // User's display name
  role: string,                  // RBAC role: 'admin', 'developer', 'viewer', 'auditor'
  created_date: timestamp,       // Account creation timestamp
  last_login: timestamp,         // Last login timestamp (optional)
  avatar_url: string,            // Profile picture URL (optional)
  preferences: object            // User preferences (optional)
}
```

**Indexes**:
- Primary: `id`
- Unique: `email`
- Index: `role`, `created_date`

**Relationships**:
- One-to-many with Agent (created_by)
- One-to-many with Architecture (created_by)
- One-to-many with Policy (created_by)
- One-to-many with Activity (user_id)

**RBAC Roles**:
- `admin`: Full system access
- `developer`: Create/manage agents, architectures, policies
- `viewer`: Read-only access
- `auditor`: Compliance and audit access

---

### Agent Entity

**Purpose**: Represents AI agents managed within the system.

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  name: string,                  // Agent name
  description: string,           // Agent description
  model: string,                 // AI model identifier (e.g., 'gpt-4', 'claude-3')
  status: string,                // 'draft', 'deployed', 'suspended', 'archived'
  cost_per_request: number,      // Cost per API request (USD)
  total_requests: number,        // Total number of requests made
  created_by: string,            // User ID who created the agent
  created_date: timestamp,       // Creation timestamp
  updated_date: timestamp,       // Last update timestamp
  deployment_date: timestamp,    // When agent was deployed (optional)
  configuration: object,         // Agent-specific configuration
  tags: array<string>,           // Tags for organization
  capabilities: array<string>,   // Agent capabilities
  limitations: array<string>,    // Known limitations
  compliance_status: string      // 'compliant', 'non_compliant', 'pending_review'
}
```

**Indexes**:
- Primary: `id`
- Index: `status`, `created_by`, `created_date`, `compliance_status`

**Common Queries**:
```javascript
// List all agents sorted by creation date
base44.entities.Agent.list('-created_date', 50)

// List deployed agents only
base44.entities.Agent.list('-created_date', 50, { status: 'deployed' })

// Get agent by ID
base44.entities.Agent.get(agentId)

// Create new agent
base44.entities.Agent.create({
  name: 'My Agent',
  description: 'Agent description',
  model: 'gpt-4',
  status: 'draft',
  // ... other fields
})

// Update agent
base44.entities.Agent.update(agentId, { status: 'deployed' })

// Delete agent
base44.entities.Agent.delete(agentId)
```

---

### Architecture Entity

**Purpose**: Represents cloud architecture designs.

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  name: string,                  // Architecture name
  description: string,           // Architecture description
  cloud_provider: string,        // 'aws', 'gcp', 'azure', 'multi-cloud'
  region: string,                // Primary region (e.g., 'us-east-1')
  environment: string,           // 'dev', 'staging', 'production'
  status: string,                // 'draft', 'active', 'archived'
  components: object,            // Infrastructure components configuration
  services: array<object>,       // Visual services on canvas
  created_by: string,            // User ID who created the architecture
  created_date: timestamp,       // Creation timestamp
  updated_date: timestamp,       // Last update timestamp
  tags: array<string>,           // Tags for organization
  estimated_cost: number,        // Monthly estimated cost (USD)
  terraform_generated: boolean,  // Whether Terraform has been generated
  last_terraform_gen: timestamp  // Last Terraform generation timestamp
}
```

**Components Object Structure**:
```javascript
{
  vpc: boolean,                  // Include VPC/VNet
  kubernetes: boolean,           // Include Kubernetes cluster
  relational_db: boolean,        // Include relational database
  object_storage: boolean,       // Include object storage
  monitoring: boolean,           // Include monitoring/observability
  load_balancer: boolean,        // Include load balancer
  cache: boolean,                // Include caching layer
  message_queue: boolean         // Include message queue
}
```

**Services Array Structure**:
```javascript
[
  {
    id: string,                  // Service instance ID
    type: string,                // Service type (e.g., 'compute', 'database')
    name: string,                // Service name
    position: { x: number, y: number },  // Canvas position
    properties: object           // Service-specific properties
  }
]
```

**Indexes**:
- Primary: `id`
- Index: `cloud_provider`, `environment`, `status`, `created_by`, `created_date`

---

### Policy Entity

**Purpose**: Represents governance policies for AI agents and architectures.

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  name: string,                  // Policy name
  description: string,           // Policy description
  type: string,                  // 'agent', 'architecture', 'data', 'security'
  category: string,              // Policy category (e.g., 'cost', 'compliance', 'security')
  severity: string,              // 'critical', 'high', 'medium', 'low'
  rules: array<object>,          // Policy rules
  is_active: boolean,            // Whether policy is currently enforced
  applies_to: array<string>,     // Entity IDs this policy applies to
  created_by: string,            // User ID who created the policy
  created_date: timestamp,       // Creation timestamp
  updated_date: timestamp,       // Last update timestamp
  last_evaluated: timestamp,     // Last evaluation timestamp
  violations: number,            // Current number of violations
  enforcement_mode: string       // 'audit', 'warn', 'block'
}
```

**Rules Array Structure**:
```javascript
[
  {
    id: string,                  // Rule ID
    condition: string,           // Rule condition expression
    action: string,              // Action to take when violated
    message: string,             // Violation message
    enabled: boolean             // Whether rule is enabled
  }
]
```

**Indexes**:
- Primary: `id`
- Index: `type`, `category`, `severity`, `is_active`, `created_date`

---

### ComplianceFramework Entity

**Purpose**: Represents compliance frameworks (SOC2, HIPAA, GDPR, etc.).

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  name: string,                  // Framework name (e.g., 'SOC2', 'HIPAA')
  version: string,               // Framework version
  description: string,           // Framework description
  requirements: array<object>,   // Compliance requirements
  is_enabled: boolean,           // Whether framework is actively tracked
  compliance_score: number,      // Overall compliance score (0-100)
  last_assessed: timestamp,      // Last assessment timestamp
  certification_date: timestamp, // Certification date (optional)
  expiry_date: timestamp,        // Certification expiry (optional)
  auditor: string,               // Auditor name (optional)
  controls: array<object>,       // Compliance controls
  evidence: array<object>        // Evidence documents
}
```

**Requirements Array Structure**:
```javascript
[
  {
    id: string,                  // Requirement ID
    title: string,               // Requirement title
    description: string,         // Detailed description
    status: string,              // 'compliant', 'non_compliant', 'in_progress'
    evidence_required: boolean,  // Whether evidence is required
    responsible_party: string    // User ID responsible for this requirement
  }
]
```

**Indexes**:
- Primary: `id`
- Index: `name`, `is_enabled`, `compliance_score`, `last_assessed`

**Common Frameworks**:
- SOC2 (Service Organization Control 2)
- HIPAA (Health Insurance Portability and Accountability Act)
- GDPR (General Data Protection Regulation)
- ISO 27001 (Information Security Management)
- PCI DSS (Payment Card Industry Data Security Standard)

---

### Activity Entity

**Purpose**: Audit log for all system activities.

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  user_id: string,               // User who performed the action
  user_name: string,             // User's display name (denormalized)
  action: string,                // Action performed (e.g., 'create', 'update', 'delete')
  entity_type: string,           // Entity type affected (e.g., 'Agent', 'Architecture')
  entity_id: string,             // ID of affected entity
  entity_name: string,           // Name of affected entity (denormalized)
  timestamp: timestamp,          // When action occurred
  ip_address: string,            // User's IP address
  user_agent: string,            // Browser/client user agent
  metadata: object,              // Additional action-specific metadata
  changes: object,               // Before/after values for updates
  status: string,                // 'success', 'failure'
  error_message: string          // Error message if status is 'failure'
}
```

**Metadata Object Examples**:
```javascript
// Agent deployment
{
  previous_status: 'draft',
  new_status: 'deployed',
  deployment_config: { ... }
}

// Policy violation
{
  policy_id: 'policy-123',
  policy_name: 'Cost Limit Policy',
  violation_details: { ... }
}
```

**Indexes**:
- Primary: `id`
- Index: `user_id`, `entity_type`, `entity_id`, `timestamp`, `action`

**Retention Policy**: 
- Audit logs are retained for 7 years for compliance purposes
- Immutable - cannot be modified or deleted

---

### Cost Entity

**Purpose**: Tracks costs for agents and infrastructure.

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  agent_id: string,              // Related agent ID (optional)
  architecture_id: string,       // Related architecture ID (optional)
  date: date,                    // Cost date (YYYY-MM-DD)
  amount: number,                // Cost amount (USD)
  cloud_provider: string,        // 'aws', 'gcp', 'azure', 'openai', 'anthropic'
  service: string,               // Service name (e.g., 'EC2', 'RDS', 'GPT-4')
  region: string,                // Region/availability zone
  category: string,              // 'compute', 'storage', 'network', 'ai', 'other'
  quantity: number,              // Usage quantity (e.g., hours, requests, GB)
  unit: string,                  // Unit of measurement
  currency: string,              // Currency code (default: 'USD')
  tags: object,                  // Cost allocation tags
  created_date: timestamp        // When cost was recorded
}
```

**Indexes**:
- Primary: `id`
- Index: `agent_id`, `architecture_id`, `date`, `cloud_provider`, `category`

**Aggregation Queries**:
```javascript
// Total cost by date range
// Total cost by agent
// Total cost by cloud provider
// Cost trend over time
```

---

### Metric Entity

**Purpose**: Stores observability metrics for monitoring and alerting.

**Schema**:
```javascript
{
  id: string,                    // Auto-generated unique identifier
  name: string,                  // Metric name (e.g., 'agent.response_time')
  value: number,                 // Metric value
  timestamp: timestamp,          // When metric was recorded
  source: string,                // Metric source (agent_id, architecture_id, etc.)
  source_type: string,           // 'agent', 'architecture', 'system'
  labels: object,                // Metric labels/dimensions
  unit: string,                  // Unit of measurement (ms, requests, percent)
  aggregation: string            // 'avg', 'sum', 'min', 'max', 'count'
}
```

**Labels Object Example**:
```javascript
{
  environment: 'production',
  region: 'us-east-1',
  model: 'gpt-4',
  status: 'success'
}
```

**Indexes**:
- Primary: `id`
- Index: `name`, `timestamp`, `source`, `source_type`

**Common Metrics**:
- `agent.response_time`: Agent API response time (ms)
- `agent.requests`: Number of agent requests
- `agent.errors`: Number of agent errors
- `agent.cost`: Agent cost per time period
- `architecture.uptime`: Architecture uptime percentage
- `compliance.score`: Compliance score

**Retention Policy**:
- Raw metrics: 30 days
- Aggregated metrics: 1 year
- Compliance metrics: 7 years

---

## Data Access Patterns

### Base44 SDK Usage

```javascript
import { base44 } from '@/api/base44Client';

// List entities (with sorting and limit)
const entities = await base44.entities.EntityName.list(
  '-created_date',  // Sort by created_date descending (use '+' for ascending)
  50                // Limit to 50 results
);

// Get single entity by ID
const entity = await base44.entities.EntityName.get(id);

// Create entity
const newEntity = await base44.entities.EntityName.create({
  name: 'Example',
  // ... other fields
});

// Update entity
const updated = await base44.entities.EntityName.update(id, {
  status: 'active'
});

// Delete entity
await base44.entities.EntityName.delete(id);

// Query with filters (if supported)
const filtered = await base44.entities.EntityName.list(
  '-created_date',
  50,
  { status: 'active', cloud_provider: 'aws' }
);
```

### React Query Integration

```javascript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['agents'],
  queryFn: () => base44.entities.Agent.list('-created_date', 50),
  initialData: []
});

// Mutate data
const mutation = useMutation({
  mutationFn: (newAgent) => base44.entities.Agent.create(newAgent),
  onSuccess: () => {
    queryClient.invalidateQueries(['agents']);
  }
});
```

---

## Data Relationships

### One-to-Many Relationships

- User → Agents (created_by)
- User → Architectures (created_by)
- User → Policies (created_by)
- User → Activities (user_id)
- Agent → Costs (agent_id)
- Architecture → Costs (architecture_id)

### Many-to-Many Relationships

Implemented through junction patterns:
- Policies ↔ Agents (via applies_to array)
- Policies ↔ Architectures (via applies_to array)

---

## Data Validation

### Client-Side Validation

Using Zod schemas:

```javascript
import { z } from 'zod';

const agentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
  status: z.enum(['draft', 'deployed', 'suspended', 'archived']),
  cost_per_request: z.number().positive()
});
```

### Server-Side Validation

Base44 SDK handles server-side validation automatically.

---

## Data Migration

### Schema Evolution

1. Add new fields as optional
2. Migrate existing records in batches
3. Make fields required once all records updated
4. Remove deprecated fields after migration complete

### Backward Compatibility

- Always add fields as optional initially
- Provide default values for missing fields
- Use feature flags for breaking changes

---

## Performance Considerations

### Indexing Strategy

- Index all foreign keys (user_id, agent_id, etc.)
- Index frequently queried fields (status, date, type)
- Composite indexes for common query patterns

### Caching Strategy

- React Query caches all entity lists for 5 minutes
- Invalidate cache on mutations
- Use optimistic updates for better UX

### Pagination

- Cursor-based pagination for large result sets
- Default page size: 50 items
- Maximum page size: 100 items

---

## Backup and Recovery

### Base44 Managed Backups

- Automated daily backups
- Point-in-time recovery
- Geographic redundancy
- 30-day retention

### Data Export

```javascript
// Export all data for an entity type
const allData = await base44.entities.EntityName.list('-created_date', 1000);
const json = JSON.stringify(allData, null, 2);
// Save to file or send to backup service
```

---

## Security

### Data Encryption

- Encryption at rest: Managed by Base44
- Encryption in transit: HTTPS/TLS 1.3
- Field-level encryption: For sensitive fields (planned)

### Access Control

- Row-level security via Base44
- RBAC enforced on all queries
- Audit logging for all data access

### Data Privacy

- PII handling per GDPR requirements
- Data retention policies
- Right to deletion support
- Data portability support

---

## Monitoring

### Entity Statistics

- Record counts per entity type
- Growth rate tracking
- Storage utilization
- Query performance metrics

### Health Checks

```javascript
// Check entity availability
try {
  await base44.entities.Agent.list('-created_date', 1);
  // Entity is healthy
} catch (error) {
  // Entity is unavailable
}
```

---

## Resources

- [Base44 Documentation](https://docs.base44.com)
- [Entity Management Guide](https://docs.base44.com/entities)
- [Authentication Guide](https://docs.base44.com/auth)

---

**Last Updated**: 2025-01-07  
**Version**: 1.0  
**Maintained by**: Enterprise Hub Team
