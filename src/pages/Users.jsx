import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Search, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PermissionGate from "../components/rbac/PermissionGate";
import { getRoleName, getRoleDescription, getRoleColor } from "../components/rbac/rbacUtils";
import { format } from "date-fns";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("-created_date"),
    initialData: [],
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("viewer");
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInvite = () => {
    if (inviteEmail) {
      inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
    }
  };

  const roleStats = {
    admin: users.filter((u) => u.role === "admin").length,
    architect: users.filter((u) => u.role === "architect").length,
    agent_operator: users.filter((u) => u.role === "agent_operator").length,
    compliance_officer: users.filter((u) => u.role === "compliance_officer").length,
    cost_controller: users.filter((u) => u.role === "cost_controller").length,
    viewer: users.filter((u) => u.role === "viewer").length,
  };

  return (
    <PermissionGate permission="user.view" showError>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Users & Access</h1>
            <p className="text-slate-500 mt-1">Manage user roles and permissions</p>
          </div>
          <PermissionGate permission="user.manage">
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </PermissionGate>
        </div>

        {/* Role Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(roleStats).map(([role, count]) => (
            <Card key={role}>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500 mt-1">{getRoleName(role)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="architect">Architect</SelectItem>
              <SelectItem value="agent_operator">Agent Operator</SelectItem>
              <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
              <SelectItem value="cost_controller">Cost Controller</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-slate-200 text-slate-700">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{user.full_name || "User"}</p>
                        {!user.is_active && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      {user.last_login && (
                        <p className="text-xs text-slate-400 mt-1">
                          Last login: {format(new Date(user.last_login), "MMM d, yyyy HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <PermissionGate permission="user.manage">
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          updateRoleMutation.mutate({ id: user.id, role: value })
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="architect">Architect</SelectItem>
                          <SelectItem value="agent_operator">Agent Operator</SelectItem>
                          <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                          <SelectItem value="cost_controller">Cost Controller</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </PermissionGate>

                    <PermissionGate
                      permission="user.manage"
                      fallback={
                        <Badge className={getRoleColor(user.role)}>{getRoleName(user.role)}</Badge>
                      }
                    >
                      <Badge className={getRoleColor(user.role)}>{getRoleName(user.role)}</Badge>
                    </PermissionGate>
                  </div>
                </div>

                {/* Role Description */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">{getRoleDescription(user.role)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Send an invitation email to a new user</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="architect">Architect</SelectItem>
                    <SelectItem value="agent_operator">Agent Operator</SelectItem>
                    <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                    <SelectItem value="cost_controller">Cost Controller</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">{getRoleDescription(inviteRole)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail || inviteUserMutation.isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800"
              >
                {inviteUserMutation.isPending ? (
                  <>
                    <Mail className="w-4 h-4 mr-2 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
