import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Plus,
  Search,
  Bot,
  MoreVertical,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Trash2,
  BarChart3,
  Loader2,
  Sparkles,
  Rocket
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PermissionGate from '../components/rbac/PermissionGate';
import DeploymentWorkflow from '../components/agent/DeploymentWorkflow';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: null },
  training: { label: 'Training', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  testing: { label: 'Testing', color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
  deployed: { label: 'Deployed', color: 'bg-green-100 text-green-700', icon: Play },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-500', icon: null }
};

const templateConfig = {
  custom: { label: 'Custom', color: 'bg-slate-100 text-slate-600' },
  customer_support: { label: 'Customer Support', color: 'bg-blue-100 text-blue-700' },
  data_analysis: { label: 'Data Analysis', color: 'bg-purple-100 text-purple-700' },
  workflow_automation: { label: 'Workflow', color: 'bg-green-100 text-green-700' },
  code_assistant: { label: 'Code Assistant', color: 'bg-orange-100 text-orange-700' }
};

const providerColors = {
  openai: 'bg-green-50 text-green-700 border-green-200',
  anthropic: 'bg-orange-50 text-orange-700 border-orange-200',
  google: 'bg-blue-50 text-blue-700 border-blue-200',
  meta: 'bg-indigo-50 text-indigo-700 border-indigo-200'
};

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [agentToDeploy, setAgentToDeploy] = useState(null);

  const queryClient = useQueryClient();

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list('-created_date'),
    initialData: []
  });

  const { data: trainingJobs = [] } = useQuery({
    queryKey: ['training-jobs'],
    queryFn: () => base44.entities.AgentTrainingJob.filter({ status: 'queued' }),
    initialData: []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Agent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Agent.update(id, { 
      status,
      deployed_at: status === 'deployed' ? new Date().toISOString() : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (agent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (agentToDelete) {
      deleteMutation.mutate(agentToDelete.id);
    }
  };

  return (
    <div 
      className="p-6 lg:p-8 max-w-7xl mx-auto"
      data-b44-sync="page-agents"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">AI Agents</h1>
          <p className="text-slate-500 mt-1">Create, train, and deploy intelligent AI agents</p>
        </div>
        <PermissionGate permission="agent.create">
          <Link to={createPageUrl('AgentCreate')}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
            <SelectItem value="deployed">Deployed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Training Queue */}
      {trainingJobs.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Training Queue ({trainingJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trainingJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{job.agent_id}</span>
                  <div className="flex items-center gap-4">
                    <Progress value={job.progress_percent || 0} className="w-32 h-2" />
                    <span className="text-slate-500 w-16">
                      {job.queue_position ? `#${job.queue_position}` : `${job.progress_percent || 0}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No agents found</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Create your first AI agent to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link to={createPageUrl('AgentCreate')}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAgents.map((agent) => {
            const StatusIcon = statusConfig[agent.status]?.icon;
            return (
              <Card key={agent.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Bot className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={statusConfig[agent.status]?.color || statusConfig.draft.color}>
                            {StatusIcon && <StatusIcon className="w-3 h-3 mr-1 animate-spin" />}
                            {statusConfig[agent.status]?.label || agent.status}
                          </Badge>
                          {agent.template_type && (
                            <Badge variant="outline" className={templateConfig[agent.template_type]?.color}>
                              {templateConfig[agent.template_type]?.label || agent.template_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`AgentDetails?id=${agent.id}`)}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                        <PermissionGate permission="agent.edit">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`AgentPlayground?id=${agent.id}`)}>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Test in Playground
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setAgentToDeploy(agent);
                              setDeployDialogOpen(true);
                            }}
                          >
                            <Rocket className="w-4 h-4 mr-2" />
                            Deploy
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`AgentCreate?id=${agent.id}`)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Configure
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate permission="agent.deploy">
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              id: agent.id, 
                              status: agent.status === 'deployed' ? 'testing' : 'deployed' 
                            })}
                          >
                            {agent.status === 'deployed' ? (
                              <><Pause className="w-4 h-4 mr-2" /> Pause</>
                            ) : (
                              <><Play className="w-4 h-4 mr-2" /> Deploy</>
                            )}
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate permission="agent.delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(agent)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {agent.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{agent.description}</p>
                  )}

                  {/* Model Info */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className={providerColors[agent.model_provider] || providerColors.openai}>
                      {agent.model_provider?.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-slate-500">{agent.model_name}</span>
                  </div>

                  {/* Performance Metrics */}
                  {agent.status === 'deployed' && (
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">
                          {agent.accuracy ? `${agent.accuracy}%` : '—'}
                        </div>
                        <div className="text-xs text-slate-500">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">
                          {agent.avg_latency_ms ? `${(agent.avg_latency_ms / 1000).toFixed(1)}s` : '—'}
                        </div>
                        <div className="text-xs text-slate-500">Latency</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">
                          {agent.total_conversations?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-slate-500">Conversations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">
                          {agent.cost_per_request ? `$${agent.cost_per_request.toFixed(3)}` : '—'}
                        </div>
                        <div className="text-xs text-slate-500">Cost/Req</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deployment Dialog */}
      {agentToDeploy && (
        <DeploymentWorkflow
          agent={agentToDeploy}
          open={deployDialogOpen}
          onClose={() => {
            setDeployDialogOpen(false);
            setAgentToDeploy(null);
          }}
        />
      )}
    </div>
  );
}