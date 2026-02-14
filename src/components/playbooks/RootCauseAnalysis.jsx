import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
  Shield,
  Lightbulb,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const priorityColors = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

const outcomeColors = {
  successful: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

export default function RootCauseAnalysis({ executionId }) {
  const analysisMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('analyzeIncidentRootCause', {
        playbook_execution_id: executionId,
      }),
  });

  const analysis = analysisMutation.data?.data?.analysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            AI Root Cause Analysis
          </h3>
          <p className="text-sm text-slate-500">
            Comprehensive incident analysis with prevention recommendations
          </p>
        </div>
        <Button
          onClick={() => analysisMutation.mutate()}
          disabled={analysisMutation.isPending}
        >
          {analysisMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Generate Analysis
        </Button>
      </div>

      {/* Executive Summary */}
      {analysis && (
        <>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <strong>Executive Summary:</strong> {analysis.executive_summary}
            </AlertDescription>
          </Alert>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-2">Incident Type</p>
                <Badge className="bg-slate-100 text-slate-900 text-sm">
                  {analysis.incident_type}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-2">Resolution Effectiveness</p>
                <div className="flex items-center gap-2">
                  <Progress value={analysis.resolution_effectiveness} className="flex-1" />
                  <span className="text-lg font-bold">{analysis.resolution_effectiveness}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-2">Similar Incidents (30d)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {analysis.similar_incidents.count_in_last_30_days}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Root Cause */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Root Cause
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription className="text-base">{analysis.root_cause}</AlertDescription>
              </Alert>

              {analysis.contributing_factors.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Contributing Factors:</p>
                  {analysis.contributing_factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Badge className={priorityColors[factor.impact]}>{factor.impact} impact</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 mb-1">{factor.factor}</p>
                        <p className="text-sm text-slate-600">{factor.evidence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Incident Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {idx < analysis.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="text-xs text-slate-500">{event.timestamp}</div>
                      <p className="font-medium text-slate-900">{event.event}</p>
                      <p className="text-sm text-slate-600 mt-1">{event.significance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Taken */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Actions Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.actions_taken.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Badge className={outcomeColors[action.outcome]}>{action.outcome}</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 mb-1">{action.action}</p>
                      <p className="text-sm text-slate-600">{action.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prevention Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Prevention Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.prevention_recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={priorityColors[rec.priority]}>{rec.priority}</Badge>
                      <Badge variant="outline">{rec.implementation_effort} effort</Badge>
                    </div>
                    <p className="font-medium text-slate-900 mb-2">{rec.recommendation}</p>
                    <p className="text-sm text-slate-600">{rec.expected_impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lessons Learned */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Lessons Learned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.lessons_learned.map((lesson, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-yellow-600">•</span>
                    {lesson}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Loading State */}
      {analysisMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">
                Analyzing incident data and generating root cause analysis...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}