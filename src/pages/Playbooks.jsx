import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Zap, TrendingUp, CheckCircle, Edit, Trash2, Sparkles } from 'lucide-react';
import AIPlaybookSuggestions from '@/components/playbooks/AIPlaybookSuggestions';

const ACTION_TYPES = ['restart_service', 'scale_up', 'scale_down', 'rollback', 'clear_cache', 'rate_limit', 'notify'];

export default function PlaybooksPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'alert',
    actions: [],
    approval_required: false
  });

  const { data: playbooks = [] } = useQuery({
    queryKey: ['playbooks'],
    queryFn: () => base44.entities.Playbook.list()
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Playbook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const executeMutation = useMutation({
    mutationFn: (playbook_id) => base44.functions.invoke('executePlaybook', { playbook_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbookExecutions'] });
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: (playbook_id) => base44.functions.invoke('optimizePlaybook', { playbook_id })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Playbook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'alert',
      actions: [],
      approval_required: false
    });
    setEditingPlaybook(null);
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, {
        action_type: 'restart_service',
        target_service_id: services[0]?.id,
        timeout_seconds: 30,
        retry_count: 3,
        continue_on_failure: false
      }]
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Incident Response Playbooks
          </h1>
          <p className="text-slate-600">AI-powered automated incident response</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Playbook
        </Button>
      </div>

      <Tabs defaultValue="suggestions">
        <TabsList>
          <TabsTrigger value="suggestions">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="playbooks">
            Playbooks ({playbooks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="mt-6">
          <AIPlaybookSuggestions
            organizationId={null}
            onPlaybookExecute={() => queryClient.invalidateQueries({ queryKey: ['playbooks'] })}
          />
        </TabsContent>

        <TabsContent value="playbooks" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
        {playbooks.map(playbook => (
          <Card key={playbook.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{playbook.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge>{playbook.trigger_type}</Badge>
                    {playbook.ai_optimized && <Badge className="bg-purple-100 text-purple-700">AI Optimized</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => executeMutation.mutate(playbook.id)}>
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(playbook.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-600">{playbook.description}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-slate-50 rounded">
                  <p className="text-slate-600">Actions</p>
                  <p className="font-semibold">{playbook.actions?.length || 0}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-green-600">Success</p>
                  <p className="font-semibold">{playbook.success_rate?.toFixed(0) || 0}%</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-blue-600">Runs</p>
                  <p className="font-semibold">{playbook.execution_count || 0}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => optimizeMutation.mutate(playbook.id)}
                disabled={optimizeMutation.isPending}
              >
                <TrendingUp className="w-3 h-3 mr-2" />
                AI Optimize
              </Button>
            </CardContent>
          </Card>
        ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., High Latency Response"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Trigger</label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({...formData, trigger_type: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="alert">Alert</option>
                <option value="metric_threshold">Metric Threshold</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Actions</label>
                <Button size="sm" onClick={addAction}>Add Action</Button>
              </div>
              <div className="space-y-2">
                {formData.actions.map((action, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={action.action_type}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[idx].action_type = e.target.value;
                            setFormData({...formData, actions: newActions});
                          }}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          {ACTION_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <select
                          value={action.target_service_id}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[idx].target_service_id = e.target.value;
                            setFormData({...formData, actions: newActions});
                          }}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || formData.actions.length === 0}
              className="w-full"
            >
              Create Playbook
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}