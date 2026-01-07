import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PermissionGate from '../components/rbac/PermissionGate';
import { format } from 'date-fns';

const actionColors = {
  create: 'bg-green-100 text-green-700',
  read: 'bg-blue-100 text-blue-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-slate-100 text-slate-700',
  deploy: 'bg-indigo-100 text-indigo-700',
  generate: 'bg-cyan-100 text-cyan-700',
  train: 'bg-pink-100 text-pink-700',
  export: 'bg-orange-100 text-orange-700'
};

const statusColors = {
  success: 'bg-green-100 text-green-700',
  failure: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700'
};

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100),
    initialData: []
  });

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.resource_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesAction && matchesResource && matchesStatus;
  });

  return (
    <PermissionGate permission="audit.view" showError>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Audit Log</h1>
            <p className="text-slate-500 mt-1">Track all user actions and system events</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="deploy">Deploy</SelectItem>
              <SelectItem value="login">Login</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="architecture">Architecture</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="policy">Policy</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit Log Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.created_date 
                          ? format(new Date(log.created_date), 'MMM d, yyyy HH:mm:ss')
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{log.user_name || 'System'}</p>
                          <p className="text-xs text-slate-500">{log.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || 'bg-slate-100 text-slate-700'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.resource_name || '—'}</p>
                          <p className="text-xs text-slate-500 capitalize">{log.resource_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[log.status] || statusColors.success}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-slate-600">
                          {log.ip_address || '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}