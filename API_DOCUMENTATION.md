# API Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base44 Entity APIs](#base44-entity-apis)
- [Serverless Functions](#serverless-functions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## Overview

Enterprise Hub provides APIs through two main mechanisms:

1. **Base44 Entity APIs**: RESTful APIs for CRUD operations on entities
2. **Serverless Functions**: Custom backend logic via Deno functions

All APIs use JSON for request and response payloads and require authentication unless specified otherwise.

**Base URL**: Configured via `VITE_BASE44_APP_BASE_URL` environment variable

---

## Authentication

### Token-Based Authentication

All API requests require a valid authentication token in the request headers.

**Headers**:
```
Authorization: Bearer <token>
X-App-Id: <app_id>
```

### Getting Authenticated

```javascript
import { base44 } from '@/api/base44Client';

// Login (if using Base44 auth)
const user = await base44.auth.login(email, password);

// Get current user
const user = await base44.auth.me();

// Logout
await base44.auth.logout();
```

### User Object

```javascript
{
  id: "user-123",
  email: "user@example.com",
  full_name: "John Doe",
  role: "admin",
  created_date: "2024-12-01T00:00:00Z"
}
```

---

## Base44 Entity APIs

All entity APIs follow a consistent RESTful pattern through the Base44 SDK.

### Common Endpoints

#### List Entities

**Method**: `GET`  
**SDK Method**: `base44.entities.<EntityName>.list(sort, limit, filters)`

**Parameters**:
- `sort` (string): Sort field with direction prefix (`+` ascending, `-` descending)
  - Example: `-created_date` (newest first), `+name` (alphabetical)
- `limit` (number): Maximum number of results (default: 50, max: 1000)
- `filters` (object): Query filters (optional)

**Response**:
```javascript
[
  {
    id: "entity-123",
    // ... entity fields
  }
]
```

**Example**:
```javascript
// Get 50 newest agents
const agents = await base44.entities.Agent.list('-created_date', 50);

// Get deployed agents only
const deployed = await base44.entities.Agent.list('-created_date', 50, {
  status: 'deployed'
});
```

#### Get Single Entity

**Method**: `GET`  
**SDK Method**: `base44.entities.<EntityName>.get(id)`

**Parameters**:
- `id` (string): Entity ID

**Response**:
```javascript
{
  id: "entity-123",
  // ... entity fields
}
```

**Example**:
```javascript
const agent = await base44.entities.Agent.get('agent-123');
```

#### Create Entity

**Method**: `POST`  
**SDK Method**: `base44.entities.<EntityName>.create(data)`

**Request Body**:
```javascript
{
  // Entity fields
}
```

**Response**:
```javascript
{
  id: "entity-123",  // Auto-generated ID
  // ... entity fields
  created_date: "2025-01-07T00:00:00Z"
}
```

**Example**:
```javascript
const newAgent = await base44.entities.Agent.create({
  name: 'Customer Support Agent',
  description: 'Handles customer inquiries',
  model: 'gpt-4',
  status: 'draft',
  cost_per_request: 0.03
});
```

#### Update Entity

**Method**: `PATCH`  
**SDK Method**: `base44.entities.<EntityName>.update(id, data)`

**Parameters**:
- `id` (string): Entity ID
- `data` (object): Fields to update

**Response**:
```javascript
{
  id: "entity-123",
  // ... updated entity fields
  updated_date: "2025-01-07T00:00:00Z"
}
```

**Example**:
```javascript
const updated = await base44.entities.Agent.update('agent-123', {
  status: 'deployed',
  deployment_date: new Date().toISOString()
});
```

#### Delete Entity

**Method**: `DELETE`  
**SDK Method**: `base44.entities.<EntityName>.delete(id)`

**Parameters**:
- `id` (string): Entity ID

**Response**:
```javascript
{
  success: true,
  id: "entity-123"
}
```

**Example**:
```javascript
await base44.entities.Agent.delete('agent-123');
```

---

## Entity-Specific APIs

### Agent API

**Entity**: `base44.entities.Agent`

#### Create Agent

```javascript
POST /entities/Agent

{
  "name": "Customer Support Agent",
  "description": "Handles customer support inquiries",
  "model": "gpt-4",
  "status": "draft",
  "cost_per_request": 0.03,
  "configuration": {
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "capabilities": ["text_generation", "conversation"],
  "tags": ["customer_support", "production"]
}
```

#### List Agents

```javascript
GET /entities/Agent?sort=-created_date&limit=50

// With filters
GET /entities/Agent?sort=-created_date&limit=50&status=deployed
```

#### Update Agent Status

```javascript
PATCH /entities/Agent/{id}

{
  "status": "deployed",
  "deployment_date": "2025-01-07T00:00:00Z"
}
```

---

### Architecture API

**Entity**: `base44.entities.Architecture`

#### Create Architecture

```javascript
POST /entities/Architecture

{
  "name": "Production E-Commerce Platform",
  "description": "Scalable e-commerce architecture",
  "cloud_provider": "aws",
  "region": "us-east-1",
  "environment": "production",
  "components": {
    "vpc": true,
    "kubernetes": true,
    "relational_db": true,
    "object_storage": true,
    "monitoring": true
  },
  "services": [
    {
      "id": "service-1",
      "type": "compute",
      "name": "API Server",
      "position": { "x": 100, "y": 100 },
      "properties": {
        "instance_type": "t3.large",
        "replicas": 3
      }
    }
  ]
}
```

#### Generate Terraform Code

See [Serverless Functions](#generate-terraform-function) section.

---

### Policy API

**Entity**: `base44.entities.Policy`

#### Create Policy

```javascript
POST /entities/Policy

{
  "name": "Agent Cost Limit Policy",
  "description": "Limits agent cost per request",
  "type": "agent",
  "category": "cost",
  "severity": "high",
  "rules": [
    {
      "id": "rule-1",
      "condition": "cost_per_request > 0.10",
      "action": "warn",
      "message": "Agent cost exceeds $0.10 per request",
      "enabled": true
    }
  ],
  "is_active": true,
  "enforcement_mode": "warn"
}
```

---

### ComplianceFramework API

**Entity**: `base44.entities.ComplianceFramework`

#### Create Compliance Framework

```javascript
POST /entities/ComplianceFramework

{
  "name": "SOC2",
  "version": "2017",
  "description": "SOC 2 Type II compliance framework",
  "requirements": [
    {
      "id": "req-1",
      "title": "Access Control",
      "description": "Implement role-based access control",
      "status": "compliant",
      "evidence_required": true
    }
  ],
  "is_enabled": true,
  "compliance_score": 85
}
```

---

### Activity API (Audit Log)

**Entity**: `base44.entities.Activity`

#### Create Activity Log

```javascript
POST /entities/Activity

{
  "user_id": "user-123",
  "user_name": "John Doe",
  "action": "create",
  "entity_type": "Agent",
  "entity_id": "agent-456",
  "entity_name": "Customer Support Agent",
  "timestamp": "2025-01-07T12:00:00Z",
  "ip_address": "192.168.1.1",
  "metadata": {
    "previous_status": "draft",
    "new_status": "deployed"
  },
  "status": "success"
}
```

#### Query Audit Logs

```javascript
// Recent activities
const activities = await base44.entities.Activity.list('-timestamp', 100);

// Activities by user
const userActivities = await base44.entities.Activity.list('-timestamp', 100, {
  user_id: 'user-123'
});

// Activities by entity
const agentActivities = await base44.entities.Activity.list('-timestamp', 100, {
  entity_type: 'Agent',
  entity_id: 'agent-456'
});
```

---

### Cost API

**Entity**: `base44.entities.Cost`

#### Record Cost

```javascript
POST /entities/Cost

{
  "agent_id": "agent-123",
  "date": "2025-01-07",
  "amount": 125.50,
  "cloud_provider": "openai",
  "service": "GPT-4",
  "category": "ai",
  "quantity": 5000,
  "unit": "requests"
}
```

#### Query Costs

```javascript
// Costs for date range
const costs = await base44.entities.Cost.list('-date', 100, {
  date_gte: '2025-01-01',
  date_lte: '2025-01-31'
});

// Costs by agent
const agentCosts = await base44.entities.Cost.list('-date', 100, {
  agent_id: 'agent-123'
});

// Costs by cloud provider
const awsCosts = await base44.entities.Cost.list('-date', 100, {
  cloud_provider: 'aws'
});
```

---

### Metric API

**Entity**: `base44.entities.Metric`

#### Record Metric

```javascript
POST /entities/Metric

{
  "name": "agent.response_time",
  "value": 234,
  "timestamp": "2025-01-07T12:00:00Z",
  "source": "agent-123",
  "source_type": "agent",
  "labels": {
    "environment": "production",
    "model": "gpt-4",
    "status": "success"
  },
  "unit": "ms",
  "aggregation": "avg"
}
```

---

## Serverless Functions

### Generate Terraform Function

**Endpoint**: `POST /functions/generateTerraform`

**Description**: Generates Terraform Infrastructure-as-Code from architecture designs.

**Request**:
```javascript
{
  "architecture_id": "arch-123",
  "architecture_name": "Production E-Commerce",
  "cloud_provider": "aws",
  "region": "us-east-1",
  "environment": "production",
  "components": {
    "vpc": true,
    "kubernetes": true,
    "relational_db": true,
    "object_storage": true,
    "monitoring": true
  },
  "services": [
    {
      "id": "service-1",
      "type": "compute",
      "name": "API Server",
      "properties": {
        "instance_type": "t3.large",
        "replicas": 3
      }
    }
  ]
}
```

**Response**:
```javascript
{
  "files": {
    "main.tf": "terraform {\n  required_version = \">= 1.0\"...",
    "variables.tf": "variable \"environment\" {\n  type = string...",
    "outputs.tf": "output \"vpc_id\" {\n  value = aws_vpc.main.id...",
    "aws-resources.tf": "resource \"aws_vpc\" \"main\" {...",
    "README.md": "# Production E-Commerce Infrastructure..."
  },
  "provider": "aws",
  "region": "us-east-1",
  "environment": "production"
}
```

**Supported Cloud Providers**:
- AWS (Amazon Web Services)
- GCP (Google Cloud Platform)
- Azure (Microsoft Azure)

**Generated Files**:
- `main.tf`: Main Terraform configuration with provider setup
- `variables.tf`: Input variables for customization
- `outputs.tf`: Output values for reference
- `{provider}-resources.tf`: Provider-specific resource definitions
- `README.md`: Setup and deployment instructions

**Example Usage**:
```javascript
import { base44 } from '@/api/base44Client';

const result = await base44.functions.generateTerraform({
  architecture_id: 'arch-123',
  architecture_name: 'My Architecture',
  cloud_provider: 'aws',
  region: 'us-east-1',
  environment: 'production',
  components: {
    vpc: true,
    kubernetes: true,
    relational_db: true
  },
  services: []
});

// Download files
Object.entries(result.files).forEach(([filename, content]) => {
  // Save file or create zip
});
```

**Error Responses**:
```javascript
// Unauthorized
{
  "error": "Unauthorized",
  "status": 401
}

// Invalid request
{
  "error": "Missing required field: cloud_provider",
  "status": 400
}

// Server error
{
  "error": "Failed to generate Terraform configuration",
  "status": 500
}
```

---

## Error Handling

### Error Response Format

```javascript
{
  "error": "Error message",
  "status": 400|401|403|404|500,
  "details": {
    // Additional error details
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Entity created successfully |
| 400 | Bad Request | Invalid request payload |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Entity not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Handling Pattern

```javascript
try {
  const agent = await base44.entities.Agent.create(data);
  // Success
} catch (error) {
  if (error.status === 401) {
    // Redirect to login
  } else if (error.status === 400) {
    // Show validation errors
  } else {
    // Show generic error
    console.error('Error creating agent:', error);
  }
}
```

---

## Rate Limiting

### Limits

- **Entity APIs**: 100 requests per minute per user
- **Serverless Functions**: 10 requests per minute per user
- **Authentication**: 20 requests per minute per IP

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704639600
```

### Handling Rate Limits

```javascript
try {
  const agents = await base44.entities.Agent.list('-created_date', 50);
} catch (error) {
  if (error.status === 429) {
    const resetTime = error.headers['X-RateLimit-Reset'];
    // Wait until reset time or show error to user
  }
}
```

---

## Examples

### Complete Agent Workflow

```javascript
// 1. Create agent
const agent = await base44.entities.Agent.create({
  name: 'Customer Support Agent',
  description: 'AI-powered customer support',
  model: 'gpt-4',
  status: 'draft',
  cost_per_request: 0.03,
  configuration: {
    temperature: 0.7,
    max_tokens: 2000
  },
  capabilities: ['text_generation', 'conversation'],
  tags: ['customer_support']
});

// 2. Test agent (hypothetical)
// ... testing logic ...

// 3. Deploy agent
const deployed = await base44.entities.Agent.update(agent.id, {
  status: 'deployed',
  deployment_date: new Date().toISOString()
});

// 4. Log activity
await base44.entities.Activity.create({
  user_id: currentUser.id,
  user_name: currentUser.full_name,
  action: 'deploy',
  entity_type: 'Agent',
  entity_id: agent.id,
  entity_name: agent.name,
  timestamp: new Date().toISOString(),
  status: 'success'
});

// 5. Track costs
await base44.entities.Cost.create({
  agent_id: agent.id,
  date: new Date().toISOString().split('T')[0],
  amount: 15.50,
  cloud_provider: 'openai',
  service: 'GPT-4',
  category: 'ai',
  quantity: 500,
  unit: 'requests'
});

// 6. Monitor metrics
await base44.entities.Metric.create({
  name: 'agent.response_time',
  value: 234,
  timestamp: new Date().toISOString(),
  source: agent.id,
  source_type: 'agent',
  labels: {
    environment: 'production',
    model: 'gpt-4'
  },
  unit: 'ms',
  aggregation: 'avg'
});
```

### Complete Architecture Workflow

```javascript
// 1. Create architecture
const architecture = await base44.entities.Architecture.create({
  name: 'Production Platform',
  description: 'Scalable production architecture',
  cloud_provider: 'aws',
  region: 'us-east-1',
  environment: 'production',
  components: {
    vpc: true,
    kubernetes: true,
    relational_db: true,
    object_storage: true,
    monitoring: true
  },
  services: [
    {
      id: 'service-1',
      type: 'compute',
      name: 'API Server',
      position: { x: 100, y: 100 },
      properties: {
        instance_type: 't3.large',
        replicas: 3
      }
    }
  ],
  estimated_cost: 1250.00
});

// 2. Generate Terraform code
const terraform = await base44.functions.generateTerraform({
  architecture_id: architecture.id,
  architecture_name: architecture.name,
  cloud_provider: architecture.cloud_provider,
  region: architecture.region,
  environment: architecture.environment,
  components: architecture.components,
  services: architecture.services
});

// 3. Update architecture
await base44.entities.Architecture.update(architecture.id, {
  terraform_generated: true,
  last_terraform_gen: new Date().toISOString()
});

// 4. Log activity
await base44.entities.Activity.create({
  user_id: currentUser.id,
  user_name: currentUser.full_name,
  action: 'generate_terraform',
  entity_type: 'Architecture',
  entity_id: architecture.id,
  entity_name: architecture.name,
  timestamp: new Date().toISOString(),
  metadata: {
    provider: architecture.cloud_provider,
    file_count: Object.keys(terraform.files).length
  },
  status: 'success'
});
```

### React Query Integration

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function AgentList() {
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list('-created_date', 50),
    initialData: []
  });

  // Create agent mutation
  const createMutation = useMutation({
    mutationFn: (newAgent) => base44.entities.Agent.create(newAgent),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
    }
  });

  // Update agent mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
    }
  });

  // Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Agent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
    }
  });

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {agents.map(agent => (
        <div key={agent.id}>
          {agent.name}
          <button onClick={() => updateMutation.mutate({
            id: agent.id,
            data: { status: 'deployed' }
          })}>
            Deploy
          </button>
          <button onClick={() => deleteMutation.mutate(agent.id)}>
            Delete
          </button>
        </div>
      ))}
      <button onClick={() => createMutation.mutate({
        name: 'New Agent',
        model: 'gpt-4',
        status: 'draft'
      })}>
        Create Agent
      </button>
    </div>
  );
}
```

---

## Resources

- [Base44 SDK Documentation](https://docs.base44.com/sdk)
- [Base44 Entity API Reference](https://docs.base44.com/entities)
- [Base44 Functions Documentation](https://docs.base44.com/functions)
- [React Query Documentation](https://tanstack.com/query)

---

**Last Updated**: 2025-01-07  
**Version**: 1.0  
**Maintained by**: Enterprise Hub Team
