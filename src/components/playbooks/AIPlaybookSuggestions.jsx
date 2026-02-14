import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const priorityColors = {
  immediate: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const severityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-green-500',
};

export default function AIPlaybookSuggestions({ organizationId, onPlaybookExecute }) {
  const suggestionsMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('suggestPlaybooks', {
        organization_id: organizationId,
      }),
  });

  const executeMutation = useMutation({
    mutationFn: (playbookId) =>
      base44.functions.invoke('executePlaybook', {
        playbook_id: playbookId,
        triggered_by: 'manual_ai_suggestion',
      }),
    onSuccess: () => {
      onPlaybookExecute?.();
    },
  });

  const suggestions = suggestionsMutation.data?.data;

  const handleGetSuggestions = () => {
    suggestionsMutation.mutate();
  };

  const handleExecute = (playbookId) => {
    executeMutation.mutate(playbookId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Playbook Suggestions
          </h3>
          <p className="text-sm text-slate-500">
            Real-time analysis and proactive incident response recommendations
          </p>
        </div>
        <Button
          onClick={handleGetSuggestions}
          disabled={suggestionsMutation.isPending}
        >
          {suggestionsMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Analyze System
        </Button>
      </div>

      {/* System Health Overview */}
      {suggestions && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-2">System Health Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress value={suggestions.analysis.system_health_score} className="h-3" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">
                    {suggestions.analysis.system_health_score}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-2">Incident Severity</p>
                <Badge className={`${severityColors[suggestions.analysis.incident_severity]} text-white capitalize`}>
                  {suggestions.analysis.incident_severity}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-2">Suggested Playbooks</p>
                <p className="text-2xl font-bold text-slate-900">
                  {suggestions.analysis.suggested_playbooks.length}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/80 rounded-lg">
              <p className="text-sm text-slate-700">{suggestions.analysis.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Playbooks */}
      {suggestions?.analysis.suggested_playbooks && suggestions.analysis.suggested_playbooks.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700">Recommended Actions</h4>
          {suggestions.analysis.suggested_playbooks.map((suggestion) => (
            <Card
              key={suggestion.playbook_id}
              className={`border-2 ${priorityColors[suggestion.priority]}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={priorityColors[suggestion.priority]}>
                        {suggestion.priority} priority
                      </Badge>
                      {suggestion.auto_execute && (
                        <Badge className="bg-purple-100 text-purple-700">
                          Auto-executable
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">
                      {suggestion.playbook_name}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {suggestion.confidence}% confidence
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {suggestion.estimated_duration}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleExecute(suggestion.playbook_id)}
                    disabled={executeMutation.isPending}
                    variant={suggestion.priority === 'immediate' ? 'destructive' : 'default'}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </Button>
                </div>

                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>
                      <strong>Why:</strong> {suggestion.reasoning}
                    </AlertDescription>
                  </Alert>

                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-2">Trigger Conditions Met:</p>
                    <div className="space-y-1">
                      {suggestion.trigger_conditions_met.map((condition, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {condition}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Expected Impact:</p>
                    <p className="text-sm text-blue-900">{suggestion.expected_impact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preventive Actions */}
      {suggestions?.analysis.preventive_actions && suggestions.analysis.preventive_actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Preventive Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.analysis.preventive_actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1">{action.action}</p>
                    <p className="text-sm text-slate-600">{action.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {suggestionsMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <p className="text-sm text-slate-600">
                Analyzing system health and generating playbook recommendations...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}