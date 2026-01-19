import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingDown, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CostAnalysis({ services }) {
  const queryClient = useQueryClient();
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const { data: metrics = [] } = useQuery({
    queryKey: ['serviceMetrics'],
    queryFn: () => base44.entities.ServiceMetrics.list()
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list()
  });

  const aiAnalysisMutation = useMutation({
    mutationFn: () => base44.functions.invoke('analyzeCostsWithAI', {
      services,
      metrics
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costInsights'] });
    }
  });

  const { data: insights } = useQuery({
    queryKey: ['costInsights'],
    queryFn: () => base44.functions.invoke('analyzeCostsWithAI', {
      services,
      metrics
    }).then(res => res.data),
    enabled: false
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowBudgetForm(false);
      setMonthlyBudget('');
    }
  });

  const handleCreateBudget = () => {
    if (!monthlyBudget) return;
    createBudgetMutation.mutate({
      name: 'Monthly Infrastructure Budget',
      budget_type: 'organization',
      period: 'monthly',
      amount_usd: parseFloat(monthlyBudget),
      alert_threshold_50: true,
      alert_threshold_80: true,
      alert_threshold_100: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
  };

  // Calculate current spend
  const currentSpend = services.reduce((sum, service) => {
    const serviceMetrics = metrics.filter(m => m.service_id === service.id);
    const avgCpu = serviceMetrics.reduce((s, m) => s + (m.cpu_percent || 0), 0) / (serviceMetrics.length || 1);
    const avgMemory = serviceMetrics.reduce((s, m) => s + (m.memory_percent || 0), 0) / (serviceMetrics.length || 1);
    // Rough estimate: $50/month per service base + utilization factor
    const estimate = 50 + (avgCpu + avgMemory) / 2;
    return sum + estimate;
  }, 0);

  const activeBudget = budgets.find(b => b.period === 'monthly');
  const budgetUtilization = activeBudget ? (currentSpend / activeBudget.amount_usd) * 100 : 0;

  // Identify underutilized services
  const underutilized = services.filter(service => {
    const serviceMetrics = metrics.filter(m => m.service_id === service.id);
    if (serviceMetrics.length === 0) return false;
    const avgCpu = serviceMetrics.reduce((s, m) => s + (m.cpu_percent || 0), 0) / serviceMetrics.length;
    const avgMemory = serviceMetrics.reduce((s, m) => s + (m.memory_percent || 0), 0) / serviceMetrics.length;
    return avgCpu < 20 && avgMemory < 30;
  });

  return (
    <div className="space-y-4">
      {/* Current Spend Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Current Monthly Spend</p>
                <p className="text-2xl font-bold">${currentSpend.toFixed(0)}</p>
              </div>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {activeBudget && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Budget Remaining</p>
                    <p className="text-2xl font-bold">
                      ${(activeBudget.amount_usd - currentSpend).toFixed(0)}
                    </p>
                  </div>
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className={budgetUtilization > 80 ? 'border-red-300 bg-red-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Budget Utilization</p>
                    <p className="text-2xl font-bold">{budgetUtilization.toFixed(0)}%</p>
                  </div>
                  {budgetUtilization > 80 && <AlertTriangle className="w-5 h-5 text-red-600" />}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Budget Alert */}
      {activeBudget && budgetUtilization > 80 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Budget Alert: {budgetUtilization.toFixed(0)}% Utilized</p>
                <p className="text-sm text-red-700">
                  You've used ${currentSpend.toFixed(0)} of ${activeBudget.amount_usd} monthly budget
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Cost Optimization Insights
            </span>
            <Button
              size="sm"
              onClick={() => aiAnalysisMutation.mutate()}
              disabled={aiAnalysisMutation.isPending}
            >
              {aiAnalysisMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Analyze'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights ? (
            <>
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">💡 Estimated Savings: ${insights.potential_savings}/month</p>
                <p className="text-xs text-blue-700">{insights.summary}</p>
              </div>

              {insights.recommendations?.map((rec, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-100 text-green-700 mt-0.5">Save ${rec.savings}/mo</Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-slate-500">Click "Analyze" to get AI-powered cost optimization insights</p>
          )}
        </CardContent>
      </Card>

      {/* Underutilized Services */}
      {underutilized.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">⚠️ Underutilized Services ({underutilized.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {underutilized.map(service => (
                <div key={service.id} className="p-2 bg-yellow-50 rounded border border-yellow-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{service.name}</span>
                    <Badge variant="outline">Low utilization</Badge>
                  </div>
                  <p className="text-yellow-700 mt-1">
                    Consider downsizing or using serverless for this service
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Management */}
      {!activeBudget && !showBudgetForm && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-slate-600 mb-3">No budget set</p>
            <Button size="sm" onClick={() => setShowBudgetForm(true)}>
              Set Monthly Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {showBudgetForm && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Set Monthly Budget</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="bg-white"
              />
              <Button onClick={handleCreateBudget} disabled={createBudgetMutation.isPending}>
                Set
              </Button>
              <Button variant="outline" onClick={() => setShowBudgetForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}