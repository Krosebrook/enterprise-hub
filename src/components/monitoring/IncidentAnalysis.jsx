import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Activity, AlertTriangle, Play, FileText } from 'lucide-react';

export default function IncidentAnalysis({ alert, open, onClose }) {
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('analyzeIncident', { alert_event_id: alert.id }),
    onSuccess: (response) => {
      setAnalysis(response.data);
    }
  });

  React.useEffect(() => {
    if (open && alert) {
      analyzeMutation.mutate();
    }
  }, [open, alert]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getIncidentIcon = (type) => {
    switch (type) {
      case 'performance': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'security': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'error_rate': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            AI Incident Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {analyzeMutation.isPending && (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-slate-600">Analyzing incident, correlating logs and traces...</p>
            </div>
          )}

          {analysis && (
            <>
              {/* Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIncidentIcon(analysis.incident_type)}
                      <span className="font-medium text-sm capitalize">{analysis.incident_type.replace('_', ' ')}</span>
                    </div>
                    <Badge className={analysis.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {analysis.confidence}% Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700">{analysis.root_cause}</p>
                  <div className="flex gap-2 mt-3 text-xs text-slate-600">
                    <span>📊 {analysis.logs_analyzed} logs analyzed</span>
                    <span>🔍 {analysis.traces_analyzed} traces analyzed</span>
                  </div>
                </CardContent>
              </Card>

              {/* Executed Actions */}
              {analysis.executed_actions?.length > 0 && (
                <Card className="border-green-300 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Auto-Executed Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {analysis.executed_actions.map((action, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-green-700">
                          <Play className="w-3 h-3" />
                          {action}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Immediate Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recommended Actions</h3>
                {analysis.immediate_actions?.map((action, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm capitalize">{action.action.replace('_', ' ')}</span>
                            <Badge className={getRiskColor(action.risk_level)}>
                              {action.risk_level}
                            </Badge>
                            {action.auto_executable && (
                              <Badge className="bg-blue-100 text-blue-700">Auto-executable</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{action.description}</p>
                          <p className="text-xs text-slate-500">Expected: {action.estimated_impact}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Correlated Issues */}
              {analysis.correlated_issues?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Correlated Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-xs">
                      {analysis.correlated_issues.map((issue, idx) => (
                        <li key={idx} className="text-slate-600">• {issue}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Prevention Steps */}
              {analysis.prevention_steps?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Long-term Prevention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-xs">
                      {analysis.prevention_steps.map((step, idx) => (
                        <li key={idx} className="text-slate-600">• {step}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Escalation */}
              {analysis.escalate_to_human && (
                <Card className="border-red-300 bg-red-50">
                  <CardContent className="p-3 text-sm text-red-700">
                    ⚠️ This incident requires human review and intervention
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}