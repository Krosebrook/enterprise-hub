import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Play, Zap, CheckCircle2, XCircle, Clock, Plus, Settings, Loader2 } from 'lucide-react';

const STAGE_DEFINITIONS = [
  { name: 'lint', label: 'Lint', description: 'Code quality and style checks', icon: '🔍' },
  { name: 'test', label: 'Test', description: 'Unit and integration tests', icon: '✓' },
  { name: 'build', label: 'Build', description: 'Build Docker image', icon: '🔨' },
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
    deploy_target: 'docker'
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

        <div className="grid grid-cols-2 gap-6">
          {/* Pipelines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Pipelines</h3>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            <div className="space-y-2">
              {pipelines.length === 0 ? (
                <p className="text-sm text-slate-500">No pipelines. Create one to get started.</p>
              ) : (
                pipelines.map(pipeline => (
                  <Card key={pipeline.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{pipeline.name}</p>
                          <p className="text-xs text-slate-500">
                            {pipeline.stages.length} stages • {pipeline.trigger_event}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pipeline.stages.slice(0, 3).map(stage => (
                              <span key={stage.name} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {stage.name}
                              </span>
                            ))}
                          </div>
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

          {/* Recent Runs */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Recent Runs</h3>
            <div className="space-y-2">
              {runs.length === 0 ? (
                <p className="text-sm text-slate-500">No runs yet.</p>
              ) : (
                runs.slice(0, 5).map(run => (
                  <button
                    key={run.id}
                    onClick={() => {
                      setSelectedRun(run);
                      setShowRunDetails(true);
                    }}
                    className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(run.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{run.commit_message || 'Manual trigger'}</p>
                        <p className="text-xs text-slate-500 truncate">{run.commit_sha?.slice(0, 7)}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {run.total_duration_ms ? `${(run.total_duration_ms / 1000).toFixed(1)}s` : 'Running...'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

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