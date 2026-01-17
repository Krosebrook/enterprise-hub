import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Zap, Activity, TrendingDown, Play, Plus, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function SimulationPanel({ architectureId, open, onClose }) {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [newConfig, setNewConfig] = useState({
    name: 'Default Simulation',
    expected_rps: 1000,
    peak_traffic_multiplier: 2,
    concurrent_users: 10000,
    data_volume_gb: 100,
    cpu_per_service: 2,
    memory_per_service_gb: 4,
    latency_tolerance_ms: 500
  });

  const { data: simConfigs = [] } = useQuery({
    queryKey: ['simulationConfigs', architectureId],
    queryFn: () => base44.entities.SimulationConfig.filter({ architecture_id: architectureId }),
    enabled: !!architectureId && open
  });

  const { data: simResults = [] } = useQuery({
    queryKey: ['simulationResults', architectureId],
    queryFn: () => base44.entities.SimulationResult.filter({ architecture_id: architectureId }),
    enabled: !!architectureId && open
  });

  const createConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.SimulationConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulationConfigs', architectureId] });
      setShowCreateDialog(false);
      setNewConfig({
        name: 'Default Simulation',
        expected_rps: 1000,
        peak_traffic_multiplier: 2,
        concurrent_users: 10000,
        data_volume_gb: 100,
        cpu_per_service: 2,
        memory_per_service_gb: 4,
        latency_tolerance_ms: 500
      });
    }
  });

  const runSimulationMutation = useMutation({
    mutationFn: (configId) => 
      base44.functions.invoke('runArchitectureSimulation', {
        architecture_id: architectureId,
        simulation_config_id: configId
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['simulationResults', architectureId] });
      setSelectedResult(response.data);
    }
  });

  const handleCreateConfig = () => {
    if (!newConfig.name.trim()) return;
    createConfigMutation.mutate({
      ...newConfig,
      architecture_id: architectureId
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Architecture Simulation</DialogTitle>
          <DialogDescription>Predict performance, identify bottlenecks, and optimize your architecture</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Simulation Configs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Simulation Scenarios</h3>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Scenario
              </Button>
            </div>

            <div className="space-y-2">
              {simConfigs.length === 0 ? (
                <p className="text-sm text-slate-500">No scenarios created. Create one to get started.</p>
              ) : (
                simConfigs.map(config => (
                  <div key={config.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-medium text-sm">{config.name}</p>
                      <p className="text-xs text-slate-500">{config.expected_rps} RPS • {config.concurrent_users} users</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => runSimulationMutation.mutate(config.id)}
                      disabled={runSimulationMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Simulation Results */}
          {selectedResult && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Simulation Results: {selectedResult.data?.simulation_name}</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedResult(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-slate-600">Overall Latency</div>
                    <div className="text-xl font-bold">{selectedResult.data?.overall_latency_ms}ms</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-slate-600">Est. Monthly Cost</div>
                    <div className="text-xl font-bold">${selectedResult.data?.total_estimated_cost_per_month}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-slate-600">CPU Utilization</div>
                    <div className="text-xl font-bold">{selectedResult.data?.cpu_utilization_percent}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-slate-600">Memory Utilization</div>
                    <div className="text-xl font-bold">{selectedResult.data?.memory_utilization_percent}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottlenecks */}
              {selectedResult.data?.bottlenecks?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Bottlenecks Detected
                  </h4>
                  <div className="space-y-2">
                    {selectedResult.data.bottlenecks.map((bottleneck, idx) => (
                      <div key={idx} className={`p-2 rounded border ${getSeverityColor(bottleneck.severity)}`}>
                        <p className="text-sm font-medium">{bottleneck.service_name} - {bottleneck.type.toUpperCase()}</p>
                        <p className="text-xs">{bottleneck.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedResult.data?.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {selectedResult.data.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Service Metrics */}
              {selectedResult.data?.service_metrics?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Per-Service Metrics
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedResult.data.service_metrics.map((metric, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-xs">
                        <p className="font-medium">{metric.service_name}</p>
                        <div className="grid grid-cols-3 gap-2 mt-1 text-slate-600">
                          <div>Response: {metric.response_time_ms}ms</div>
                          <div>CPU: {metric.cpu_percent}%</div>
                          <div>Instances: {metric.required_instances}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Config Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Simulation Scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Scenario Name</label>
                <Input
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                  placeholder="e.g., Peak Hour Load Test"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Requests Per Second (RPS): {newConfig.expected_rps}</label>
                <Slider
                  value={[newConfig.expected_rps]}
                  onValueChange={(val) => setNewConfig({...newConfig, expected_rps: val[0]})}
                  min={100}
                  max={10000}
                  step={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Peak Traffic Multiplier: {newConfig.peak_traffic_multiplier}x</label>
                <Slider
                  value={[newConfig.peak_traffic_multiplier]}
                  onValueChange={(val) => setNewConfig({...newConfig, peak_traffic_multiplier: val[0]})}
                  min={1}
                  max={5}
                  step={0.5}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Concurrent Users: {newConfig.concurrent_users}</label>
                <Slider
                  value={[newConfig.concurrent_users]}
                  onValueChange={(val) => setNewConfig({...newConfig, concurrent_users: val[0]})}
                  min={1000}
                  max={100000}
                  step={1000}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Data Volume (GB): {newConfig.data_volume_gb}</label>
                <Slider
                  value={[newConfig.data_volume_gb]}
                  onValueChange={(val) => setNewConfig({...newConfig, data_volume_gb: val[0]})}
                  min={10}
                  max={1000}
                  step={10}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Latency Tolerance (ms): {newConfig.latency_tolerance_ms}</label>
                <Slider
                  value={[newConfig.latency_tolerance_ms]}
                  onValueChange={(val) => setNewConfig({...newConfig, latency_tolerance_ms: val[0]})}
                  min={100}
                  max={2000}
                  step={100}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleCreateConfig} disabled={createConfigMutation.isPending} className="flex-1">
                  Create Scenario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}