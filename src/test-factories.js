/**
 * Test Data Factories
 * 
 * Factory functions for creating mock data for testing.
 * Each factory corresponds to a Base44 entity in the system.
 */

/**
 * Create a mock User entity
 */
export function createMockUser(overrides = {}) {
  return {
    id: `user-${Date.now()}-${Math.random()}`,
    email: `user-${Math.random().toString(36).substring(7)}@example.com`,
    full_name: 'Test User',
    role: 'developer',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    is_active: true,
    ...overrides,
  }
}

/**
 * Create a mock Agent entity
 */
export function createMockAgent(overrides = {}) {
  return {
    id: `agent-${Date.now()}-${Math.random()}`,
    name: 'Test Agent',
    description: 'A test AI agent for unit testing',
    model: 'gpt-4',
    provider: 'openai',
    status: 'active',
    deployment_status: 'deployed',
    cost_per_request: 0.03,
    compliance_status: 'compliant',
    created_by: 'test-user-id',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock Architecture entity
 */
export function createMockArchitecture(overrides = {}) {
  return {
    id: `architecture-${Date.now()}-${Math.random()}`,
    name: 'Test Architecture',
    description: 'A test cloud architecture',
    cloud_provider: 'aws',
    region: 'us-east-1',
    environment: 'production',
    status: 'active',
    components: {
      vpc: true,
      kubernetes: true,
      relational_db: true,
      object_storage: true,
      monitoring: true,
    },
    services: [],
    created_by: 'test-user-id',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock Policy entity
 */
export function createMockPolicy(overrides = {}) {
  return {
    id: `policy-${Date.now()}-${Math.random()}`,
    name: 'Test Policy',
    description: 'A test governance policy',
    type: 'security',
    category: 'data_protection',
    severity: 'high',
    rules: [
      {
        id: 'rule-1',
        condition: 'data_classification == "sensitive"',
        action: 'require_encryption',
      },
    ],
    is_active: true,
    enforcement_level: 'strict',
    created_by: 'test-user-id',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock ComplianceFramework entity
 */
export function createMockComplianceFramework(overrides = {}) {
  return {
    id: `framework-${Date.now()}-${Math.random()}`,
    name: 'SOC2',
    version: '2017',
    description: 'SOC2 Type II compliance framework',
    requirements: [
      {
        id: 'req-1',
        title: 'Access Control',
        description: 'Implement role-based access control',
        status: 'compliant',
        evidence: [],
      },
    ],
    compliance_score: 85,
    is_enabled: true,
    certification_date: new Date().toISOString(),
    expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock Activity (audit log) entity
 */
export function createMockActivity(overrides = {}) {
  return {
    id: `activity-${Date.now()}-${Math.random()}`,
    user_id: 'test-user-id',
    user_email: 'test@example.com',
    action: 'create',
    entity_type: 'Agent',
    entity_id: 'agent-123',
    entity_name: 'Test Agent',
    description: 'Created a new agent',
    timestamp: new Date().toISOString(),
    metadata: {},
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    ...overrides,
  }
}

/**
 * Create a mock Cost entity
 */
export function createMockCost(overrides = {}) {
  return {
    id: `cost-${Date.now()}-${Math.random()}`,
    agent_id: 'agent-123',
    date: new Date().toISOString().split('T')[0],
    amount: 125.50,
    currency: 'USD',
    cloud_provider: 'aws',
    service: 'OpenAI API',
    usage_type: 'api_calls',
    quantity: 1000,
    unit_price: 0.12,
    created_date: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock Metric entity
 */
export function createMockMetric(overrides = {}) {
  return {
    id: `metric-${Date.now()}-${Math.random()}`,
    name: 'api_response_time',
    value: 245,
    unit: 'ms',
    timestamp: new Date().toISOString(),
    source: 'api_gateway',
    labels: {
      endpoint: '/api/agents',
      method: 'GET',
      status: '200',
    },
    ...overrides,
  }
}

/**
 * Create multiple entities using a factory function
 * 
 * @example
 * const agents = createMany(createMockAgent, 5)
 */
export function createMany(factory, count = 3, overrides = {}) {
  return Array.from({ length: count }, (_, index) =>
    factory({ ...overrides, index })
  )
}

/**
 * Create a list of mock users with different roles
 */
export function createMockUsersWithRoles() {
  return [
    createMockUser({ role: 'admin', email: 'admin@example.com', full_name: 'Admin User' }),
    createMockUser({ role: 'developer', email: 'dev@example.com', full_name: 'Developer User' }),
    createMockUser({ role: 'viewer', email: 'viewer@example.com', full_name: 'Viewer User' }),
    createMockUser({ role: 'auditor', email: 'auditor@example.com', full_name: 'Auditor User' }),
  ]
}
