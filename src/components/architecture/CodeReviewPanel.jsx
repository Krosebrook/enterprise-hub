import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CodeReviewPanel({ review, open, onClose }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!review) return null;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>AI Code Review</span>
            <Badge className={review.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {review.approval_status === 'approved' ? '✅ Approved' : '⚠️ Needs Review'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-700">{review.summary}</p>
              <div className="mt-3 flex gap-2">
                <Badge className="bg-slate-100 text-slate-700">Issues: {review.issues?.length || 0}</Badge>
                <Badge className={getSeverityColor(review.severity)}>
                  {review.severity?.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Positive Aspects */}
          {review.positive_aspects?.length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  What's Good
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {review.positive_aspects.map((aspect, idx) => (
                    <li key={idx} className="text-sm text-green-700">✓ {aspect}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Issues */}
          {review.issues?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Issues Found</h3>
              {review.issues.map((issue, idx) => (
                <Card key={idx} className="border-slate-200">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{issue.title}</span>
                          <Badge className={getSeverityColor(issue.severity)} variant="outline">
                            {issue.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{issue.description}</p>
                        
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:underline mb-2">
                            Show suggestion
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="font-medium text-slate-700 mb-1">How to fix:</p>
                              <p className="text-slate-600">{issue.suggestion}</p>
                            </div>
                            {issue.code_example && (
                              <div>
                                <p className="font-medium text-slate-700 mb-1">Fixed code:</p>
                                <div className="relative bg-slate-900 rounded p-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => {
                                      navigator.clipboard.writeText(issue.code_example);
                                      setCopiedIndex(idx);
                                      setTimeout(() => setCopiedIndex(null), 2000);
                                    }}
                                  >
                                    <Copy className="w-3 h-3 text-slate-300" />
                                  </Button>
                                  <pre className="text-slate-100 text-xs overflow-x-auto pr-8">
                                    {issue.code_example}
                                  </pre>
                                  {copiedIndex === idx && (
                                    <p className="text-xs text-green-400 mt-1">Copied!</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {review.issues?.length === 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700 font-medium">No issues found!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}