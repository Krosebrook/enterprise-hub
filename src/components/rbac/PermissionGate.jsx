import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { hasPermission, hasAnyPermission, hasAllPermissions } from './rbacUtils';
import { AlertCircle } from 'lucide-react';

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