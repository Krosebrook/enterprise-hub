import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import PermissionGate from '../components/rbac/PermissionGate';

const frameworkInfo = {
  'SOC2': { name: 'SOC 2 Type II', color: 'blue' },
  'HIPAA': { name: 'HIPAA', color: 'green' },
  'GDPR': { name: 'GDPR', color: 'purple' },
  'PCI-DSS': { name: 'PCI-DSS', color: 'orange' }
};

const severityConfig = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const statusConfig = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
  snoozed: { label: 'Snoozed', color: 'bg-slate-100 text-slate-700' },
  false_positive: { label: 'False Positive', color: 'bg-slate-100 text-slate-500' }
};

export default function Compliance() {
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: frameworks = [], isLoading: frameworksLoading } = useQuery({
    queryKey: ['compliance-frameworks'],
    queryFn: () => base44.entities.ComplianceFramework.list(),
    initialData: []
  });

  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ['compliance-violations'],
    queryFn: () => base44.entities.ComplianceViolation.list('-created_date'),
    initialData: []
  });

  const updateViolationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ComplianceViolation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
    }
  });

  const enabledFrameworks = frameworks.filter(f => f.is_enabled);
  const overallScore = enabledFrameworks.length > 0
    ? Math.round(enabledFrameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / enabledFrameworks.length)
    : 0;

  const filteredViolations = violations.filter(v => {
    const matchesFramework = selectedFramework === 'all' || v.framework_type === selectedFramework;
    const matchesSeverity = severityFilter === 'all' || v.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesFramework && matchesSeverity && matchesStatus;
  });

  const openViolations = violations.filter(v => v.status === 'open').length;
  const criticalViolations = violations.filter(v => v.severity === 'critical' && v.status === 'open').length;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Compliance</h1>
          <p className="text-slate-500 mt-1">Monitor compliance across multiple frameworks</p>
        </div>
        <PermissionGate permission="compliance.edit">
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Audit
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </PermissionGate>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overall Score</p>
                <p className={`text-3xl font-bold mt-1 ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Open Violations</p>
                <p className="text-3xl font-bold mt-1 text-slate-900">{openViolations}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Critical Issues</p>
                <p className="text-3xl font-bold mt-1 text-red-600">{criticalViolations}</p>
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
                <p className="text-sm text-slate-500">Frameworks</p>
                <p className="text-3xl font-bold mt-1 text-slate-900">{enabledFrameworks.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="frameworks" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="violations">Violations ({openViolations})</TabsTrigger>
        </TabsList>

        {/* Frameworks Tab */}
        <TabsContent value="frameworks">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(frameworkInfo).map(([key, info]) => {
              const framework = frameworks.find(f => f.framework_type === key);
              const score = framework?.compliance_score || 0;
              const isEnabled = framework?.is_enabled;
              
              return (
                <Card key={key} className={!isEnabled ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <Badge variant={isEnabled ? 'default' : 'secondary'}>
                        {isEnabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                        {isEnabled && (
                          <div className="text-right text-sm text-slate-500">
                            <div>{framework?.passing_controls || 0} / {framework?.total_controls || 0} controls</div>
                            <div>passing</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${getScoreBarColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      {isEnabled && framework?.last_audit_date && (
                        <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t">
                          <span>Last audit: {format(new Date(framework.last_audit_date), 'MMM d, yyyy')}</span>
                          {framework.certification_status === 'certified' && (
                            <Badge className="bg-green-100 text-green-700">Certified</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                {Object.entries(frameworkInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key}>{info.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Violations Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Violation</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                      </TableCell>
                    </TableRow>
                  ) : filteredViolations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No violations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredViolations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{violation.control_name}</p>
                            <p className="text-sm text-slate-500">{violation.control_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {frameworkInfo[violation.framework_type]?.name || violation.framework_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={severityConfig[violation.severity]?.color}>
                            {severityConfig[violation.severity]?.label || violation.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={violation.status}
                            onValueChange={(value) => updateViolationMutation.mutate({
                              id: violation.id,
                              data: { status: value, resolved_at: value === 'resolved' ? new Date().toISOString() : null }
                            })}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="false_positive">False Positive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {violation.due_date ? (
                            <span className={new Date(violation.due_date) < new Date() ? 'text-red-600' : 'text-slate-600'}>
                              {format(new Date(violation.due_date), 'MMM d, yyyy')}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}