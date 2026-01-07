# Enterprise Hub Architecture

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Architecture](#data-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Design Patterns](#design-patterns)
- [Future Considerations](#future-considerations)

---

## Overview

Enterprise Hub is a comprehensive AI governance, compliance, and architecture management platform designed for enterprise organizations. The platform enables teams to manage AI agents, design cloud architectures, enforce policies, track compliance, monitor costs, and maintain comprehensive audit trails.

### Key Features

- **Agent Management**: AI agent lifecycle management with deployment tracking
- **Architecture Designer**: Visual cloud architecture design with Infrastructure-as-Code generation
- **Policy Management**: Policy creation, enforcement, and compliance tracking
- **Compliance Framework**: Multi-framework compliance (SOC2, HIPAA, GDPR, ISO 27001, PCI DSS)
- **Cost Management**: Multi-cloud cost tracking and optimization
- **Observability**: Real-time monitoring, metrics, and alerting
- **Audit Logging**: Comprehensive audit trail for governance and compliance
- **RBAC**: Role-based access control with four user roles

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│   React 18 + Vite 6 + Tailwind CSS + Radix UI Components      │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │Dashboard │ │  Agents  │ │Architect.│ │ Policies │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │Compliance│ │   Costs  │ │Observab. │ │AuditLog  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Base44 SDK (HTTP/REST)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Base44 Platform Layer                      │
│                                                                 │
│  ┌───────────────────────┐    ┌──────────────────────────┐   │
│  │   Authentication      │    │   Entity Management      │   │
│  │   - Token-based auth  │    │   - Agent                │   │
│  │   - Session mgmt      │    │   - Architecture         │   │
│  └───────────────────────┘    │   - Policy               │   │
│                                │   - ComplianceFramework  │   │
│  ┌───────────────────────┐    │   - Activity             │   │
│  │  Serverless Functions │    │   - User                 │   │
│  │  - generateTerraform  │    │   - Cost                 │   │
│  │  - (Future functions) │    │   - Metric               │   │
│  └───────────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Data Storage
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       Database Layer                            │
│                    Base44 Entity Store                          │
│         (Managed NoSQL with relational capabilities)            │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Serverless-First**: Leverage serverless functions for backend logic
2. **API-Driven**: All operations via REST APIs through Base44 SDK
3. **Component-Based**: Reusable React components with clear boundaries
4. **Security-First**: Authentication, authorization, and audit on all operations
5. **Responsive Design**: Mobile-first approach with Tailwind CSS
6. **Real-Time Updates**: React Query for optimistic updates and cache management

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **Vite** | 6.1.0 | Build tool and dev server |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **Radix UI** | Various | Accessible UI component primitives |
| **React Query** | 5.84.1 | Server state management |
| **React Router** | 6.26.0 | Client-side routing |
| **Lucide React** | 0.475.0 | Icon library |
| **React Hook Form** | 7.54.2 | Form state management |
| **Zod** | 3.24.2 | Schema validation |
| **Recharts** | 2.15.4 | Data visualization |
| **Framer Motion** | 11.16.4 | Animations |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Base44 SDK** | 0.8.3 | Backend platform integration |
| **Deno** | Latest | Serverless function runtime |
| **TypeScript** | 5.8.2 | Type safety for functions |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting (via ESLint) |
| **TypeScript** | Type checking |
| **npm** | Package management |

---

## Data Architecture

### Entity Relationship Model

```
┌──────────────┐
│     User     │
│──────────────│
│ id           │
│ email        │───────┐
│ full_name    │       │
│ role         │       │ Creates
│ created_date │       │
└──────────────┘       │
                       ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    Agent     │   │Architecture  │   │    Policy    │
│──────────────│   │──────────────│   │──────────────│
│ id           │   │ id           │   │ id           │
│ name         │   │ name         │   │ name         │
│ description  │   │ description  │   │ type         │
│ model        │   │ cloud_provider│  │ rules        │
│ status       │   │ components   │   │ severity     │
│ cost_per_req │   │ services     │   │ is_active    │
│ created_by   │   │ created_by   │   │ created_by   │
└──────────────┘   └──────────────┘   └──────────────┘
       │                  │                   │
       │                  │                   │
       └──────────────────┴───────────────────┘
                          │
                          │ Generates
                          ▼
                  ┌──────────────┐
                  │   Activity   │
                  │──────────────│
                  │ id           │
                  │ user_id      │
                  │ action       │
                  │ entity_type  │
                  │ entity_id    │
                  │ timestamp    │
                  │ metadata     │
                  └──────────────┘

┌────────────────────┐     ┌──────────────┐
│ComplianceFramework │     │     Cost     │
│────────────────────│     │──────────────│
│ id                 │     │ id           │
│ name               │     │ agent_id     │
│ version            │     │ date         │
│ requirements       │     │ amount       │
│ compliance_score   │     │ cloud_prov.  │
│ is_enabled         │     │ service      │
└────────────────────┘     └──────────────┘

┌──────────────┐
│    Metric    │
│──────────────│
│ id           │
│ name         │
│ value        │
│ timestamp    │
│ source       │
│ labels       │
└──────────────┘
```

### Base44 Entity Definitions

All entities are stored and managed through the Base44 platform. Key entities include:

1. **User**: System users with RBAC roles
2. **Agent**: AI agents with lifecycle tracking
3. **Architecture**: Cloud architecture designs
4. **Policy**: Governance policies
5. **ComplianceFramework**: Compliance framework configurations
6. **Activity**: Audit log entries
7. **Cost**: Cost tracking records
8. **Metric**: Observability metrics

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed entity schemas.

---

## Frontend Architecture

### Directory Structure

```
src/
├── api/
│   └── base44Client.js          # Base44 SDK configuration
├── components/
│   ├── architecture/            # Architecture-specific components
│   │   ├── CodeGenerationDialog.jsx
│   │   ├── ServiceCard.jsx
│   │   └── ServicePropertiesPanel.jsx
│   ├── dashboard/               # Dashboard components
│   │   ├── ActivityFeed.jsx
│   │   ├── MetricCard.jsx
│   │   └── QuickActionCard.jsx
│   ├── policy/                  # Policy components
│   ├── rbac/                    # RBAC components
│   │   ├── PermissionGate.jsx
│   │   └── rbacUtils.js
│   └── ui/                      # Radix UI wrappers (40+ components)
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       └── ...
├── hooks/                       # Custom React hooks
├── lib/
│   ├── AuthContext.jsx          # Authentication context
│   ├── NavigationTracker.jsx   # Navigation tracking
│   ├── app-params.js           # App configuration
│   ├── query-client.js         # React Query setup
│   └── utils.js                # Utility functions
├── pages/                       # Application pages (12 total)
│   ├── Dashboard.jsx
│   ├── Agents.jsx
│   ├── AgentCreate.jsx
│   ├── Architectures.jsx
│   ├── ArchitectureDesigner.jsx
│   ├── Policies.jsx
│   ├── PolicyCreate.jsx
│   ├── Compliance.jsx
│   ├── Users.jsx
│   ├── Costs.jsx
│   ├── Observability.jsx
│   └── AuditLog.jsx
├── utils/                       # Utility functions
├── App.jsx                      # Root component
├── Layout.jsx                   # Layout wrapper
├── main.jsx                     # Entry point
└── pages.config.js             # Page routing config
```

### Component Architecture

#### UI Components (Radix UI Wrappers)

All UI components are built on Radix UI primitives with Tailwind CSS styling:

- **Atomic Components**: Button, Input, Label, Badge, etc.
- **Composite Components**: Card, Dialog, Dropdown, Select, etc.
- **Layout Components**: Sidebar, Tabs, Accordion, etc.
- **Feedback Components**: Toast, Alert, Progress, etc.

#### Domain Components

- **Architecture**: Visual service cards, property panels, code generation
- **Dashboard**: Metric cards, activity feeds, quick actions
- **Policy**: Policy editors, rule builders
- **RBAC**: Permission gates, role utilities

### State Management

#### Local State
- **React useState**: Component-local state
- **React useReducer**: Complex local state logic

#### Global State
- **AuthContext**: User authentication state
- **React Query**: Server state with caching

#### Form State
- **React Hook Form**: Form state management
- **Zod**: Schema validation

### Routing

React Router v6 with configuration-based routing:

```javascript
// pages.config.js
export const PAGES = {
  Dashboard: Dashboard,
  Agents: Agents,
  // ... other pages
};

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
  Layout: Layout,
};
```

### Data Fetching Pattern

```javascript
// Using React Query
const { data: agents = [], isLoading, error } = useQuery({
  queryKey: ['agents'],
  queryFn: () => base44.entities.Agent.list('-created_date', 50),
  initialData: []
});

// Mutations
const createMutation = useMutation({
  mutationFn: (newAgent) => base44.entities.Agent.create(newAgent),
  onSuccess: () => {
    queryClient.invalidateQueries(['agents']);
  }
});
```

---

## Backend Architecture

### Base44 Platform Integration

The backend is primarily powered by Base44, a serverless platform that provides:

1. **Entity Management**: NoSQL database with relational capabilities
2. **Authentication**: Token-based auth with session management
3. **Serverless Functions**: Deno runtime for custom logic
4. **API Gateway**: Managed REST APIs

### Serverless Functions

#### generateTerraform Function

**Location**: `functions/generateTerraform.ts`

**Purpose**: Generate Infrastructure-as-Code (Terraform) from architecture designs

**Flow**:
1. Authenticate user via Base44 SDK
2. Parse architecture configuration
3. Generate provider-specific Terraform files
4. Return complete Terraform project structure

**Supported Providers**:
- AWS (VPC, EKS, RDS, S3, CloudWatch)
- GCP (VPC, GKE, Cloud SQL, GCS, Cloud Monitoring)
- Azure (VNet, AKS, Azure SQL, Blob Storage, Monitor)

**Input**:
```json
{
  "architecture_id": "string",
  "architecture_name": "string",
  "cloud_provider": "aws|gcp|azure",
  "region": "string",
  "environment": "dev|staging|production",
  "components": {
    "vpc": true,
    "kubernetes": true,
    "relational_db": true,
    "object_storage": true,
    "monitoring": true
  },
  "services": [...]
}
```

**Output**:
```json
{
  "files": {
    "main.tf": "...",
    "variables.tf": "...",
    "outputs.tf": "...",
    "aws-resources.tf": "...",
    "README.md": "..."
  },
  "provider": "aws",
  "region": "us-east-1",
  "environment": "production"
}
```

### Future Functions (Planned)

- **validatePolicy**: Policy rule validation
- **calculateCompliance**: Compliance score calculation
- **aggregateCosts**: Cost aggregation and forecasting
- **generateReport**: Automated report generation

---

## Security Architecture

### Authentication Flow

```
┌──────────┐                  ┌──────────┐                  ┌──────────┐
│  Client  │                  │  Base44  │                  │ Database │
└──────────┘                  └──────────┘                  └──────────┘
     │                              │                              │
     │  1. Login Request            │                              │
     │─────────────────────────────>│                              │
     │                              │                              │
     │                              │  2. Validate Credentials     │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │  3. User Data                │
     │                              │<─────────────────────────────│
     │                              │                              │
     │  4. Token + User Data        │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
     │  5. API Request + Token      │                              │
     │─────────────────────────────>│                              │
     │                              │                              │
     │                              │  6. Validate Token & RBAC    │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │  7. Authorized Response      │
     │<─────────────────────────────│                              │
```

### RBAC System

**Roles**:

1. **Admin**: Full system access
   - Manage users
   - Configure compliance frameworks
   - Access all features

2. **Developer**: Development and deployment
   - Create/manage agents
   - Design architectures
   - Deploy changes

3. **Viewer**: Read-only access
   - View dashboards
   - View agents and architectures
   - No modifications

4. **Auditor**: Compliance and audit focus
   - View compliance status
   - Access audit logs
   - View policies

**Implementation**:

```javascript
// PermissionGate component
<PermissionGate permission="admin">
  <Button>Admin Only Action</Button>
</PermissionGate>

// useAuth hook
const { user, isAuthenticated } = useAuth();
```

### Security Controls

1. **Input Validation**: Zod schemas, React Hook Form validation
2. **Output Encoding**: React's built-in XSS protection
3. **Authentication**: Token-based with automatic refresh
4. **Authorization**: Server-side RBAC checks
5. **Audit Logging**: All actions logged to Activity entity
6. **HTTPS Only**: All communications encrypted
7. **No Secrets in Code**: Environment variables for all sensitive data

---

## Deployment Architecture

### Development Environment

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with Base44 credentials

# Start dev server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

**Required**:
- `VITE_BASE44_APP_ID`: Base44 application ID
- `VITE_BASE44_APP_BASE_URL`: Base44 backend URL

**Optional**:
- Development/debugging flags (TBD)

### Base44 Deployment

Backend functions are deployed to Base44 platform:

1. Functions are automatically deployed when pushed to repository
2. Base44 handles scaling, monitoring, and infrastructure
3. No manual deployment steps required

---

## Design Patterns

### Component Patterns

1. **Container/Presenter Pattern**: Separate data fetching from presentation
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Render Props**: Flexible component composition
4. **Custom Hooks**: Reusable stateful logic

### Data Patterns

1. **Optimistic Updates**: Update UI before server confirmation
2. **Cache Invalidation**: React Query automatic cache management
3. **Polling**: Real-time data updates via query refetch
4. **Pagination**: Cursor-based pagination for large lists

### Error Handling

1. **Error Boundaries**: Catch React component errors
2. **Try/Catch**: Async operation error handling
3. **Toast Notifications**: User-friendly error messages
4. **Fallback UI**: Graceful degradation

### Loading States

1. **Skeleton Screens**: Content placeholders during load
2. **Spinners**: Action feedback
3. **Progress Indicators**: Long-running operations
4. **Optimistic UI**: Instant feedback before server response

---

## Future Considerations

### Scalability

1. **Code Splitting**: Lazy load routes and heavy components
2. **Virtualization**: Virtual scrolling for large lists
3. **Service Workers**: Offline support and caching
4. **CDN**: Static asset distribution

### Testing

1. **Unit Tests**: Vitest for component and utility testing
2. **Integration Tests**: React Testing Library
3. **E2E Tests**: Playwright or Cypress
4. **Visual Regression**: Storybook + Chromatic

### Monitoring & Observability

1. **Error Tracking**: Sentry or similar
2. **Performance Monitoring**: Web Vitals tracking
3. **User Analytics**: User behavior insights
4. **Real-time Dashboards**: Operational metrics

### Features

1. **Real-time Collaboration**: Multi-user architecture editing
2. **AI-Powered Insights**: Automated recommendations
3. **Advanced Reporting**: Custom report builder
4. **Integrations**: CI/CD, cloud providers, monitoring tools
5. **Mobile App**: Native mobile experience

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Base44 SDK Documentation](https://docs.base44.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Query Documentation](https://tanstack.com/query)

---

**Last Updated**: 2025-01-07  
**Version**: 1.0  
**Maintained by**: Enterprise Hub Team
