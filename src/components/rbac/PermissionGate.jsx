import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';

// RBAC permission checking functions
const PERMISSIONS = {
  'architecture.view': ['admin', 'architect', 'viewer'],
  'architecture.create': ['admin', 'architect'],
  'architecture.edit': ['admin', 'architect'],
  'architecture.delete': ['admin', 'architect'],
  'architecture.deploy': ['admin', 'architect'],
  'architecture.generate_code': ['admin', 'architect'],
  'agent.view': ['admin', 'agent_operator', 'viewer'],
  'agent.create': ['admin', 'agent_operator'],
  'agent.edit': ['admin', 'agent_operator'],
  'agent.delete': ['admin', 'agent_operator'],
  'agent.deploy': ['admin', 'agent_operator'],
  'agent.train': ['admin', 'agent_operator'],
  'compliance.view': ['admin', 'compliance_officer', 'viewer'],
  'compliance.edit': ['admin', 'compliance_officer'],
  'compliance.resolve_violations': ['admin', 'compliance_officer'],
  'compliance.configure_frameworks': ['admin', 'compliance_officer'],
  'cost.view': ['admin', 'cost_controller', 'viewer'],
  'cost.edit_budgets': ['admin', 'cost_controller'],
  'cost.export_reports': ['admin', 'cost_controller'],
  'observability.view': ['admin', 'architect', 'agent_operator', 'viewer'],
  'observability.configure_alerts': ['admin', 'architect'],
  'policy.view': ['admin', 'compliance_officer', 'viewer'],
  'policy.create': ['admin', 'compliance_officer'],
  'policy.edit': ['admin', 'compliance_officer'],
  'policy.delete': ['admin', 'compliance_officer'],
  'policy.approve': ['admin'],
  'policy.request_exception': ['admin', 'architect', 'agent_operator', 'cost_controller'],
  'policy.approve_exception': ['admin', 'compliance_officer'],
  'user.view': ['admin', 'viewer'],
  'user.manage': ['admin'],
  'audit.view': ['admin', 'compliance_officer']
};

const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
};

const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

export default function PermissionGate({ 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null,
  showError = false,
  children 
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.error('Failed to load user:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    if (showError) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>Authentication required</span>
        </div>
      );
    }
    return fallback;
  }

  // Check single permission
  if (permission && !hasPermission(user.role, permission)) {
    if (showError) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>Insufficient permissions</span>
        </div>
      );
    }
    return fallback;
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll 
      ? hasAllPermissions(user.role, permissions)
      : hasAnyPermission(user.role, permissions);

    if (!hasAccess) {
      if (showError) {
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>Insufficient permissions</span>
          </div>
        );
      }
      return fallback;
    }
  }

  return <>{children}</>;
}