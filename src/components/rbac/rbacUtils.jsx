// Role-Based Access Control (RBAC) utility

export const ROLES = {
  ADMIN: "admin",
  ARCHITECT: "architect",
  AGENT_OPERATOR: "agent_operator",
  COMPLIANCE_OFFICER: "compliance_officer",
  COST_CONTROLLER: "cost_controller",
  VIEWER: "viewer",
};

export const PERMISSIONS = {
  // Architecture permissions
  "architecture.view": ["admin", "architect", "viewer"],
  "architecture.create": ["admin", "architect"],
  "architecture.edit": ["admin", "architect"],
  "architecture.delete": ["admin", "architect"],
  "architecture.deploy": ["admin", "architect"],
  "architecture.generate_code": ["admin", "architect"],

  // Agent permissions
  "agent.view": ["admin", "agent_operator", "viewer"],
  "agent.create": ["admin", "agent_operator"],
  "agent.edit": ["admin", "agent_operator"],
  "agent.delete": ["admin", "agent_operator"],
  "agent.deploy": ["admin", "agent_operator"],
  "agent.train": ["admin", "agent_operator"],

  // Compliance permissions
  "compliance.view": ["admin", "compliance_officer", "viewer"],
  "compliance.edit": ["admin", "compliance_officer"],
  "compliance.resolve_violations": ["admin", "compliance_officer"],
  "compliance.configure_frameworks": ["admin", "compliance_officer"],

  // Cost permissions
  "cost.view": ["admin", "cost_controller", "viewer"],
  "cost.edit_budgets": ["admin", "cost_controller"],
  "cost.export_reports": ["admin", "cost_controller"],

  // Observability permissions
  "observability.view": ["admin", "architect", "agent_operator", "viewer"],
  "observability.configure_alerts": ["admin", "architect"],

  // Policy permissions
  "policy.view": ["admin", "compliance_officer", "viewer"],
  "policy.create": ["admin", "compliance_officer"],
  "policy.edit": ["admin", "compliance_officer"],
  "policy.delete": ["admin", "compliance_officer"],
  "policy.approve": ["admin"],
  "policy.request_exception": ["admin", "architect", "agent_operator", "cost_controller"],
  "policy.approve_exception": ["admin", "compliance_officer"],

  // User management
  "user.view": ["admin", "viewer"],
  "user.manage": ["admin"],

  // Audit logs
  "audit.view": ["admin", "compliance_officer"],
};

export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
};

export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some((permission) => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every((permission) => hasPermission(userRole, permission));
};

export const getRoleName = (role) => {
  const roleNames = {
    admin: "Administrator",
    architect: "Architect",
    agent_operator: "Agent Operator",
    compliance_officer: "Compliance Officer",
    cost_controller: "Cost Controller",
    viewer: "Viewer",
  };
  return roleNames[role] || role;
};

export const getRoleDescription = (role) => {
  const descriptions = {
    admin: "Full system access with user and policy management",
    architect: "Design and deploy microservices architectures",
    agent_operator: "Create, train, and manage AI agents",
    compliance_officer: "Monitor compliance and manage policies",
    cost_controller: "Manage budgets and cost optimization",
    viewer: "Read-only access to all modules",
  };
  return descriptions[role] || "";
};

export const getRoleColor = (role) => {
  const colors = {
    admin: "bg-red-100 text-red-700 border-red-200",
    architect: "bg-blue-100 text-blue-700 border-blue-200",
    agent_operator: "bg-purple-100 text-purple-700 border-purple-200",
    compliance_officer: "bg-green-100 text-green-700 border-green-200",
    cost_controller: "bg-orange-100 text-orange-700 border-orange-200",
    viewer: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return colors[role] || colors.viewer;
};
