import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Plus,
  Search,
  Shield,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Edit,
  History,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PermissionGate from '../components/rbac/PermissionGate';

const categoryConfig = {
  security: { label: 'Security', color: 'bg-red-100 text-red-700', icon: Shield },
  cost: { label: 'Cost', color: 'bg-orange-100 text-orange-700', icon: DollarSign },
  quality: { label: 'Quality', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  compliance: { label: 'Compliance', color: 'bg-green-100 text-green-700', icon: Shield }
};

const severityConfig = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' }
};

const enforcementConfig = {
  block: { label: 'Block', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  warn: { label: 'Warn', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  audit_only: { label: 'Audit Only', color: 'bg-blue-100 text-blue-700', icon: Eye }
};

export default function Policies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => base44.entities.Policy.list('-created_date'),
    initialData: []
  });

  const { data: violations = [] } = useQuery({
    queryKey: ['policy-violations'],
    queryFn: () => base44.entities.PolicyViolation.filter({ status: 'open' }),
    initialData: []
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ['policy-exceptions'],
    queryFn: () => base44.entities.PolicyException.filter({ status: 'pending' }),
    initialData: []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Policy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Policy.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    }
  });

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         policy.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || policy.category === categoryFilter;
    const matchesScope = scopeFilter === 'all' || policy.scope === scopeFilter;
    return matchesSearch && matchesCategory && matchesScope;
  });

  const activePolicies = policies.filter(p => p.is_active).length;
  const criticalViolations = violations.filter(v => v.severity === 'critical').length;

  return (
    <div 
      className="p-6 lg:p-8 max-w-7xl mx-auto"
      data-b44-sync="page-policies"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Policy Manager</h1>
          <p className="text-slate-500 mt-1">Define and enforce organizational policies</p>
        </div>
        <PermissionGate permission="policy.create">
          <Link to={createPageUrl('PolicyCreate')}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              New Policy
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Policies</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{activePolicies}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Open Violations</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{violations.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Critical Issues</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{criticalViolations}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Exceptions</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{exceptions.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <History className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="violations">Violations ({violations.length})</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions ({exceptions.length})</TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="architecture">Architecture</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Policies Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Enforcement</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => {
                    const CategoryIcon = categoryConfig[policy.category]?.icon;
                    const EnforcementIcon = enforcementConfig[policy.enforcement_level]?.icon;
                    
                    return (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{policy.name}</p>
                            <p className="text-sm text-slate-500 line-clamp-1">{policy.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryConfig[policy.category]?.color}>
                            {CategoryIcon && <CategoryIcon className="w-3 h-3 mr-1" />}
                            {categoryConfig[policy.category]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={enforcementConfig[policy.enforcement_level]?.color}>
                            {EnforcementIcon && <EnforcementIcon className="w-3 h-3 mr-1" />}
                            {enforcementConfig[policy.enforcement_level]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">{policy.scope}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                            {policy.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">v{policy.version}</span>
                        </TableCell>
                        <TableCell>
                          <PermissionGate permissions={['policy.edit', 'policy.delete']} requireAll={false}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <PermissionGate permission="policy.edit">
                                  <DropdownMenuItem asChild>
                                    <Link to={createPageUrl(`PolicyCreate?id=${policy.id}`)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleActiveMutation.mutate({ id: policy.id, is_active: !policy.is_active })}>
                                    {policy.is_active ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                </PermissionGate>
                                <DropdownMenuItem>
                                  <History className="w-4 h-4 mr-2" />
                                  View History
                                </DropdownMenuItem>
                                <PermissionGate permission="policy.delete">
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => deleteMutation.mutate(policy.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </PermissionGate>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </PermissionGate>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-slate-500 py-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>Violation management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exceptions Tab */}
        <TabsContent value="exceptions">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-slate-500 py-8">
                <History className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>Exception workflow coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}