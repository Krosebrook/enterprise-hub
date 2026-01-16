import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Rocket, 
  GitBranch, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight,
  Loader2,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const environmentConfig = {
  development: { label: 'Development', color: 'bg-slate-100 text-slate-700', icon: '🔧' },
  staging: { label: 'Staging', color: 'bg-yellow-100 text-yellow-700', icon: '🧪' },
  production: { label: 'Production', color: 'bg-green-100 text-green-700', icon: '🚀' }
};

const statusConfig = {
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  deploying: { label: 'Deploying', color: 'bg-purple-100 text-purple-700', icon: Loader2 },
  deployed: { label: 'Deployed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  rolled_back: { label: 'Rolled Back', color: 'bg-slate-100 text-slate-700', icon: RotateCcw }
};

export default function DeploymentWorkflow({ agent, open, onClose }) {
  const queryClient = useQueryClient();
  const [selectedEnvironment, setSelectedEnvironment] = useState('staging');
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch current deployments
  const { data: deployments = [] } = useQuery({
    queryKey: ['agent-deployments', agent?.id],
    queryFn: () => base44.entities.AgentDeployment.filter({ agent_id: agent.id }),
    enabled: !!agent?.id,
    select: (data) => data.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )
  });

  // Fetch versions
  const { data: versions = [] } = useQuery({
    queryKey: ['agent-versions', agent?.id],
    queryFn: () => base44.entities.AgentVersion.filter({ agent_id: agent.id }),
    enabled: !!agent?.id,
    select: (data) => data.sort((a, b) => b.version_number - a.version_number)
  });

  const latestVersion = versions[0];

  // Get current deployment per environment
  const currentDeployments = {
    development: deployments.find(d => d.environment === 'development' && d.status === 'deployed'),
    staging: deployments.find(d => d.environment === 'staging' && d.status === 'deployed'),
    production: deployments.find(d => d.environment === 'production' && d.status === 'deployed')
  };

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: async () => {
      const versionNumber = (latestVersion?.version_number || 0) + 1;
      return base44.entities.AgentVersion.create({
        agent_id: agent.id,
        version_number: versionNumber,
        configuration: agent,
        change_summary: notes || 'Configuration update',
        created_by: user.email,
        is_latest: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-versions'] });
    }
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async () => {
      // Create version if needed
      let version = latestVersion;
      if (!version) {
        version = await createVersionMutation.mutateAsync();
      }

      // Create deployment record
      const deployment = await base44.entities.AgentDeployment.create({
        agent_id: agent.id,
        version_id: version.id,
        version_number: version.version_number,
        environment: selectedEnvironment,
        status: selectedEnvironment === 'production' ? 'pending_approval' : 'deployed',
        deployed_by: user.email,
        deployed_at: selectedEnvironment !== 'production' ? new Date().toISOString() : null,
        notes: notes || 'Deployment'
      });

      // Auto-approve non-production
      if (selectedEnvironment !== 'production') {
        await base44.entities.AgentDeployment.update(deployment.id, {
          status: 'deployed',
          approved_by: user.email,
          approved_at: new Date().toISOString()
        });
      }

      return deployment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-deployments'] });
      setNotes('');
      if (selectedEnvironment !== 'production') {
        onClose();
      }
    }
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (deploymentId) => {
      await base44.entities.AgentDeployment.update(deploymentId, {
        status: 'deployed',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        deployed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-deployments'] });
      onClose();
    }
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (environment) => {
      const currentDep = currentDeployments[environment];
      if (!currentDep) return;

      // Mark current as rolled back
      await base44.entities.AgentDeployment.update(currentDep.id, {
        status: 'rolled_back'
      });

      // Find previous version
      const previousVersion = versions.find(v => 
        v.version_number < currentDep.version_number
      );

      if (previousVersion) {
        // Deploy previous version
        await base44.entities.AgentDeployment.create({
          agent_id: agent.id,
          version_id: previousVersion.id,
          version_number: previousVersion.version_number,
          environment,
          status: 'deployed',
          deployed_by: user.email,
          approved_by: user.email,
          approved_at: new Date().toISOString(),
          deployed_at: new Date().toISOString(),
          rollback_from_version: currentDep.version_number,
          notes: `Rollback from v${currentDep.version_number}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-deployments'] });
    }
  });

  const pendingApproval = deployments.find(d => d.status === 'pending_approval');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Deploy Agent: {agent?.name}
          </DialogTitle>
          <DialogDescription>
            Manage deployments across environments with version control
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pending Approvals */}
          {pendingApproval && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-900">Pending Approval</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      Version {pendingApproval.version_number} to{' '}
                      <span className="font-medium">{environmentConfig[pendingApproval.environment].label}</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      Requested by {pendingApproval.deployed_by} •{' '}
                      {format(new Date(pendingApproval.created_date), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(pendingApproval.id)}
                  disabled={approveMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Approve'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Current Deployments */}
          <div>
            <h3 className="text-sm font-medium mb-3">Current Deployments</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(environmentConfig).map(([env, config]) => {
                const deployment = currentDeployments[env];
                return (
                  <div key={env} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{config.icon}</span>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                    {deployment ? (
                      <>
                        <div className="text-sm font-medium mb-1">
                          Version {deployment.version_number}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(deployment.deployed_at), 'MMM d, h:mm a')}
                        </div>
                        {env !== 'development' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => rollbackMutation.mutate(env)}
                            disabled={rollbackMutation.isPending}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Rollback
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 mt-2">Not deployed</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Deployment */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-3">New Deployment</h3>
            <div className="space-y-4">
              <div>
                <Label>Environment</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(environmentConfig).map(([env, config]) => (
                    <button
                      key={env}
                      onClick={() => setSelectedEnvironment(env)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedEnvironment === env
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.icon}</div>
                      <div className="text-xs font-medium">{config.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Version</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    <span className="font-medium">
                      Version {(latestVersion?.version_number || 0) + 1}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Deployment Notes</Label>
                <Textarea
                  placeholder="What's changing in this deployment?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              {selectedEnvironment === 'production' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Production deployments require approval
                </div>
              )}

              <Button
                onClick={() => deployMutation.mutate()}
                disabled={deployMutation.isPending}
                className="w-full bg-slate-900 hover:bg-slate-800"
              >
                {deployMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                {selectedEnvironment === 'production' ? 'Request Deployment' : 'Deploy Now'}
              </Button>
            </div>
          </div>

          {/* Deployment History */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-3">Recent Deployments</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {deployments.slice(0, 5).map((dep) => {
                const StatusIcon = statusConfig[dep.status].icon;
                return (
                  <div key={dep.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <Badge className={environmentConfig[dep.environment].color}>
                        {environmentConfig[dep.environment].label}
                      </Badge>
                      <span className="font-medium">v{dep.version_number}</span>
                      <Badge className={statusConfig[dep.status].color}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${dep.status === 'deploying' ? 'animate-spin' : ''}`} />
                        {statusConfig[dep.status].label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(dep.created_date), 'MMM d, h:mm a')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}