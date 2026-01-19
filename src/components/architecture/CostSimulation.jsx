import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Zap, Loader2, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CostSimulation({ architecture, services, open, onClose }) {
  const [scenarios, setScenarios] = useState([
    { id: 1, name: 'Low Traffic', users: 1000, rps: 100, enabled: true },
    { id: 2, name: 'Medium Traffic', users: 10000, rps: 1000, enabled: true },
    { id: 3, name: 'High Traffic', users: 100000, rps: 10000, enabled: true },
  ]);
  const [cloudProviders, setCloudProviders] = useState(['aws', 'gcp', 'azure']);
  const [results, setResults] = useState(null);

  const simulateMutation = useMutation({
    mutationFn: () => base44.functions.invoke('simulateArchitectureCosts', {
      architecture_id: architecture.id,
      services,
      scenarios: scenarios.filter(s => s.enabled),
      cloud_providers: cloudProviders
    }),
    onSuccess: (response) => {
      setResults(response.data);
    }
  });

  const toggleScenario = (id) => {
    setScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const toggleProvider = (provider) => {
    setCloudProviders(prev =>
      prev.includes(provider) 
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const chartData = results?.comparisons?.map(comp => ({
    scenario: comp.scenario_name,
    AWS: comp.providers.find(p => p.provider === 'aws')?.monthly_cost || 0,
    GCP: comp.providers.find(p => p.provider === 'gcp')?.monthly_cost || 0,
    Azure: comp.providers.find(p => p.provider === 'azure')?.monthly_cost || 0,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Simulation & Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scenario Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Traffic Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {scenarios.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => toggleScenario(scenario.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      scenario.enabled
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm">{scenario.name}</span>
                      {scenario.enabled && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>{scenario.users.toLocaleString()} users</div>
                      <div>{scenario.rps} req/sec</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cloud Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cloud Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {['aws', 'gcp', 'azure'].map(provider => (
                  <button
                    key={provider}
                    onClick={() => toggleProvider(provider)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                      cloudProviders.includes(provider)
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {provider.toUpperCase()}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simulate Button */}
          <Button
            onClick={() => simulateMutation.mutate()}
            disabled={simulateMutation.isPending || scenarios.filter(s => s.enabled).length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {simulateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run Cost Simulation
              </>
            )}
          </Button>

          {/* Results */}
          {results && (
            <>
              {/* Cost Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost Comparison by Scenario</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="scenario" tick={{ fontSize: 12 }} />
                      <YAxis label={{ value: 'Cost (USD/month)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                      <Tooltip />
                      <Bar dataKey="AWS" fill="#FF9900" />
                      <Bar dataKey="GCP" fill="#4285F4" />
                      <Bar dataKey="Azure" fill="#0078D4" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Best Option */}
              {results.best_option && (
                <Card className="border-green-300 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          Best Option: {results.best_option.provider.toUpperCase()} - {results.best_option.scenario}
                        </p>
                        <p className="text-sm text-green-700">
                          ${results.best_option.monthly_cost}/month - {results.best_option.reason}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optimizations */}
              {results.optimizations && results.optimizations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">💡 Cost Optimization Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {results.optimizations.map((opt, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Badge className="bg-blue-600 mt-0.5">Save {opt.savings_percent}%</Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">{opt.title}</p>
                            <p className="text-xs text-blue-700 mt-1">{opt.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detailed Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.comparisons?.map((comp, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3">
                        <p className="font-medium text-sm mb-2">{comp.scenario_name}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {comp.providers.map(prov => (
                            <div key={prov.provider} className="p-2 bg-slate-50 rounded text-xs">
                              <p className="font-medium uppercase">{prov.provider}</p>
                              <p className="text-lg font-bold text-slate-900 mt-1">
                                ${prov.monthly_cost}
                              </p>
                              <p className="text-slate-600">per month</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}