import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Activity, DollarSign, Zap, CheckCircle } from 'lucide-react';

export default function ScalingRecommendations({ service }) {
  const queryClient = useQueryClient();
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('analyzeAndScaleServices', { service_id: service.id }),
    onSuccess: (response) => {
      setAnalysis(response.data);
      if (response.data.auto_applied) {
        queryClient.invalidateQueries({ queryKey: ['services'] });
      }
    }
  });

  const applyMutation = useMutation({
    mutationFn: () => base44.entities.Service.update(service.id, {
      min_instances: analysis.recommendation.min_instances,
      max_instances: analysis.recommendation.max_instances
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setAnalysis(null);
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'underutilized': return 'text-yellow-600';
      case 'optimal': return 'text-green-600';
      case 'overloaded': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'scale_up': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'scale_down': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'optimize_config': return <Zap className="w-4 h-4 text-blue-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            AI Scaling Analysis
          </span>
          <Button
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis ? (
          <>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <div className="flex items-center gap-2">
                {getActionIcon(analysis.action)}
                <span className="text-sm font-medium capitalize">{analysis.action.replace('_', ' ')}</span>
              </div>
              <Badge className={analysis.current_status === 'optimal' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                {analysis.current_status}
              </Badge>
            </div>

            {analysis.auto_applied && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                ✅ Auto-applied: Instances updated to {analysis.recommendation.min_instances}-{analysis.recommendation.max_instances}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium text-slate-700">Current:</span>
                <span className="ml-2">{service.min_instances}-{service.max_instances} instances</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Recommended:</span>
                <span className="ml-2">{analysis.recommendation.min_instances}-{analysis.recommendation.max_instances} instances</span>
              </div>
              <p className="text-slate-600">{analysis.recommendation.reasoning}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-600 mb-1">Next Hour</p>
                <Badge className="text-xs">{analysis.predicted_load.next_hour}</Badge>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <p className="text-xs text-purple-600 mb-1">Next Day</p>
                <Badge className="text-xs">{analysis.predicted_load.next_day}</Badge>
              </div>
            </div>

            <div className="p-2 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-900">Cost Impact</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-600">Current:</span>
                  <span className="ml-1 font-medium">${analysis.cost_impact.current_monthly}/mo</span>
                </div>
                <div>
                  <span className="text-slate-600">Optimized:</span>
                  <span className="ml-1 font-medium">${analysis.cost_impact.optimized_monthly}/mo</span>
                </div>
              </div>
              <p className="text-green-700 font-medium mt-1">
                Save {analysis.cost_impact.savings_percent.toFixed(1)}%
              </p>
            </div>

            {analysis.insights?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Key Insights:</p>
                {analysis.insights.map((insight, idx) => (
                  <p key={idx} className="text-xs text-slate-600">• {insight}</p>
                ))}
              </div>
            )}

            {!analysis.auto_applied && (
              <Button
                className="w-full"
                size="sm"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
              >
                Apply Recommendation
              </Button>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">
            Click "Analyze" to get AI-powered scaling recommendations
          </p>
        )}
      </CardContent>
    </Card>
  );
}