import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Zap, CheckCircle2, XCircle, Clock, Plus, Settings, Loader2, Shield, Badge } from 'lucide-react';

const STAGE_DEFINITIONS = [
  { name: 'lint', label: 'Lint', description: 'Code quality and style checks', icon: '🔍' },
  { name: 'test', label: 'Test', description: 'Unit and integration tests', icon: '✓' },
  { name: 'build', label: 'Build', description: 'Build Docker image', icon: '🔨' },
  { name: 'security_scan', label: 'Security Scan', description: 'OWASP & vulnerability scanning', icon: '🔒' },
  { name: 'deploy_staging', label: 'Deploy to Staging', description: 'Deploy to staging environment', icon: '🚀' },
  { name: 'deploy_prod', label: 'Deploy to Production', description: 'Deploy to production', icon: '⭐' }
];

export default function PipelineManager({ architectureId, services, open, onClose }) {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRunDetails, setShowRunDetails] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [newPipeline, setNewPipeline] = useState({
    name: 'Deploy Service',
    trigger_event: 'push',
    trigger_branch: 'main',
    stages: [],
    deploy_target: 'docker',
    deployment_strategy: 'rolling',
    blue_green_config: {
      health_check_path: '/health',
      traffic_shift_percentage: 10,
      wait_minutes: 5
    },
    canary_config: {
      initial_traffic_percent: 10,
      increment_percent: 10,
      interval_minutes: 10,
      success_criteria: {
        error_rate_threshold: 1,
        latency_threshold_ms: 500
      }
    }
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines', architectureId],
    queryFn: () => base44.entities.Pipeline.filter({ architecture_id: architectureId }),
    enabled: !!architectureId && open
  });

  const { data: runs = [] } = useQuery({
    queryKey: ['pipelineRuns', architectureId],
    queryFn: () => base44.entities.PipelineRun.filter({ architecture_id: architectureId }).then(data =>
      data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    ),
    enabled: !!architectureId && open
  });

  const { data: securityScans = [] } = useQuery({
    queryKey: ['securityScans'],
    queryFn: () => base44.entities.SecurityScan.list(),
    enabled: !!architectureId && open
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['deploymentApprovals'],
    queryFn: () => base44.entities.DeploymentApproval.list(),
    enabled: !!architectureId && open
  });

  const createPipelineMutation = useMutation({
    mutationFn: (data) => base44.entities.Pipeline.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', architectureId] });
      setShowCreateDialog(false);
      setNewPipeline({
        name: 'Deploy Service',
        trigger_event: 'push',
        trigger_branch: 'main',
        stages: [],
        deploy_target: 'docker'
      });
    }
  });

  const executePipelineMutation = useMutation({
    mutationFn: (pipelineId) =>
      base44.functions.invoke('executePipeline', {
        pipeline_id: pipelineId,
        trigger_type: 'manual'
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['pipelineRuns', architectureId] });
      setSelectedRun(response.data);
      setShowRunDetails(true);
    }
  });

  const runSecurityScanMutation = useMutation({
    mutationFn: (runId) =>
      base44.functions.invoke('runSecurityScan', {
        pipeline_run_id: runId,
        scan_types: ['sast', 'dependency']
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityScans'] });
    }
  });

  const remediateMutation = useMutation({
    mutationFn: (scanId) =>
      base44.functions.invoke('remediateSecurityIssues', {
        scan_id: scanId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityScans'] });
    }
  });

  const approveDeploymentMutation = useMutation({
    mutationFn: ({ approvalId, status }) =>
      base44.functions.invoke('approveDeployment', {
        approval_id: approvalId,
        status,
        rejection_reason: status === 'rejected' ? 'Manual rejection' : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deploymentApprovals'] });
    }
  });

  const handleCreatePipeline = () => {
    if (!newPipeline.name.trim() || newPipeline.stages.length === 0) {
      alert('Pipeline name and at least one stage required');
      return;
    }
    createPipelineMutation.mutate({
      ...newPipeline,
      architecture_id: architectureId,
      created_by: 'current_user'
    });
  };

  const toggleStage = (stageName) => {
    setNewPipeline(prev => ({
      ...prev,
      stages: prev.stages.find(s => s.name === stageName)
        ? prev.stages.filter(s => s.name !== stageName)
        : [...prev.stages, { name: stageName, enabled: true, timeout_minutes: 30 }]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-slate-400" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            CI/CD Pipeline Manager
          </DialogTitle>
          <DialogDescription>
            Define and manage automated build, test, and deployment workflows
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pipelines" className="w-full">
          <TabsList>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
            <TabsTrigger value="security">Security Scans</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="pipelines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">CI/CD Pipelines</h3>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-slate-600 mb-2">Pipelines</h4>
                <div className="space-y-2">
                  {pipelines.length === 0 ? (
                    <p className="text-sm text-slate-500">No pipelines. Create one to get started.</p>
                  ) : (
                    pipelines.map(pipeline => (
                      <Card key={pipeline.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{pipeline.name}</p>
                              <p className="text-xs text-slate-500">{pipeline.stages.length} stages</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => executePipelineMutation.mutate(pipeline.id)}
                              disabled={executePipelineMutation.isPending}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-600 mb-2">Recent Runs</h4>
                <div className="space-y-2">
                  {runs.length === 0 ? (
                    <p className="text-sm text-slate-500">No runs yet.</p>
                  ) : (
                    runs.slice(0, 5).map(run => (
                      <button
                        key={run.id}
                        onClick={() => { setSelectedRun(run); setShowRunDetails(true); }}
                        className="w-full text-left p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{run.commit_message || 'Manual'}</p>
                            <p className="text-slate-500">{run.total_duration_ms ? `${(run.total_duration_ms / 1000).toFixed(1)}s` : 'Running'}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Scans (SAST/DAST)
            </h3>
            <div className="space-y-2">
              {securityScans.length === 0 ? (
                <p className="text-sm text-slate-500">No security scans yet</p>
              ) : (
                securityScans.slice(0, 5).map(scan => (
                  <Card key={scan.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm uppercase">{scan.scan_type}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {scan.vulnerabilities_found} vulnerabilities ({scan.critical_count} critical, {scan.high_count} high)
                          </p>
                          {(scan.medium_count > 0 || scan.low_count > 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => remediateMutation.mutate(scan.id)}
                              disabled={remediateMutation.isPending}
                            >
                              🤖 Auto-Fix ({scan.medium_count + scan.low_count})
                            </Button>
                          )}
                        </div>
                        <BadgeUI variant={scan.critical_count > 0 ? 'destructive' : 'default'}>
                          {scan.status}
                        </BadgeUI>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <h3 className="text-sm font-semibold">Production Deployment Approvals</h3>
            <div className="space-y-3">
              {approvals.filter(a => a.status === 'pending').length === 0 ? (
                <p className="text-sm text-slate-500">No pending approvals</p>
              ) : (
                approvals.filter(a => a.status === 'pending').map(approval => (
                  <Card key={approval.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm capitalize">{approval.environment} Deployment</p>
                          <p className="text-xs text-slate-600">Requested by {approval.requested_by}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveDeploymentMutation.mutate({
                            approvalId: approval.id,
                            status: 'approved'
                          })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => approveDeploymentMutation.mutate({
                            approvalId: approval.id,
                            status: 'rejected'
                          })}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Pipeline Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Pipeline Name</label>
                <Input
                  value={newPipeline.name}
                  onChange={(e) => setNewPipeline({...newPipeline, name: e.target.value})}
                  placeholder="e.g., Deploy API Service"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Select Stages</label>
                <div className="space-y-2">
                  {STAGE_DEFINITIONS.map(stage => (
                    <label key={stage.name} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <Checkbox
                        checked={newPipeline.stages.some(s => s.name === stage.name)}
                        onCheckedChange={() => toggleStage(stage.name)}
                      />
                      <div>
                        <p className="text-sm font-medium">{stage.label}</p>
                        <p className="text-xs text-slate-500">{stage.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Trigger Event</label>
                <select
                  value={newPipeline.trigger_event}
                  onChange={(e) => setNewPipeline({...newPipeline, trigger_event: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="push">Push to branch</option>
                  <option value="pull_request">Pull request</option>
                  <option value="manual">Manual trigger only</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Deployment Strategy</label>
                <select
                  value={newPipeline.deployment_strategy}
                  onChange={(e) => setNewPipeline({...newPipeline, deployment_strategy: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="rolling">Rolling Update</option>
                  <option value="blue_green">Blue-Green Deployment</option>
                  <option value="canary">Canary Release</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {newPipeline.deployment_strategy === 'rolling' && 'Gradually replace old instances'}
                  {newPipeline.deployment_strategy === 'blue_green' && 'Switch traffic from blue to green environment'}
                  {newPipeline.deployment_strategy === 'canary' && 'Gradually shift traffic with health monitoring'}
                </p>
              </div>

              {newPipeline.deployment_strategy === 'blue_green' && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
                  <p className="text-xs font-medium text-blue-900">Blue-Green Configuration</p>
                  <Input
                    placeholder="Health check path (e.g., /health)"
                    value={newPipeline.blue_green_config.health_check_path}
                    onChange={(e) => setNewPipeline({
                      ...newPipeline,
                      blue_green_config: {...newPipeline.blue_green_config, health_check_path: e.target.value}
                    })}
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Wait time (minutes)"
                    value={newPipeline.blue_green_config.wait_minutes}
                    onChange={(e) => setNewPipeline({
                      ...newPipeline,
                      blue_green_config: {...newPipeline.blue_green_config, wait_minutes: parseInt(e.target.value)}
                    })}
                    className="text-xs"
                  />
                </div>
              )}

              {newPipeline.deployment_strategy === 'canary' && (
                <div className="p-3 bg-yellow-50 rounded border border-yellow-200 space-y-2">
                  <p className="text-xs font-medium text-yellow-900">Canary Configuration</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Initial %"
                      value={newPipeline.canary_config.initial_traffic_percent}
                      onChange={(e) => setNewPipeline({
                        ...newPipeline,
                        canary_config: {...newPipeline.canary_config, initial_traffic_percent: parseInt(e.target.value)}
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Increment %"
                      value={newPipeline.canary_config.increment_percent}
                      onChange={(e) => setNewPipeline({
                        ...newPipeline,
                        canary_config: {...newPipeline.canary_config, increment_percent: parseInt(e.target.value)}
                      })}
                      className="text-xs"
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Interval (minutes)"
                    value={newPipeline.canary_config.interval_minutes}
                    onChange={(e) => setNewPipeline({
                      ...newPipeline,
                      canary_config: {...newPipeline.canary_config, interval_minutes: parseInt(e.target.value)}
                    })}
                    className="text-xs"
                  />
                  <p className="text-xs text-yellow-700">Rollback if error rate {'>'}1% or latency {'>'} 500ms</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreatePipeline} disabled={createPipelineMutation.isPending} className="flex-1">
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Run Details Dialog */}
        {selectedRun && (
          <Dialog open={showRunDetails} onOpenChange={setShowRunDetails}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pipeline Execution Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{selectedRun.commit_message}</p>
                    <p className="text-xs text-slate-500">{selectedRun.commit_sha}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedRun.status)}
                    <span className="text-sm font-medium capitalize">{selectedRun.status}</span>
                  </div>
                </div>

                {selectedRun.stages?.map((stage, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStatusIcon(stage.status)}
                          {stage.name}
                        </CardTitle>
                        <span className="text-xs text-slate-500">
                          {stage.duration_ms ? `${(stage.duration_ms / 1000).toFixed(1)}s` : '-'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                        {stage.logs || stage.error_message || 'No logs'}
                      </pre>
                    </CardContent>
                  </Card>
                ))}

                <div className="text-xs text-slate-500 pt-4 border-t">
                  Total Duration: {selectedRun.total_duration_ms ? `${(selectedRun.total_duration_ms / 1000).toFixed(1)}s` : 'Running...'}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}