import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Key,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  DollarSign,
  Activity,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

const tierColors = {
  free: 'bg-slate-100 text-slate-700',
  basic: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

const severityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function APIKeyManager({ gateway, onUpdate }) {
  const [selectedKeyId, setSelectedKeyId] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: (keyId) =>
      base44.functions.invoke('analyzeAPIKeys', {
        gateway_id: gateway.id,
        api_key_id: keyId,
      }),
  });

  const analysis = analyzeMutation.data?.data;

  const handleAnalyze = (keyId = null) => {
    setSelectedKeyId(keyId);
    analyzeMutation.mutate(keyId);
  };

  const handleApplyRecommendation = async (keyId, newTier, newLimit) => {
    const updatedKeys = gateway.api_keys.map((key) =>
      key.key_id === keyId ? { ...key, tier: newTier, rate_limit: newLimit } : key
    );
    await base44.entities.APIGateway.update(gateway.id, { api_keys: updatedKeys });
    onUpdate?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">API Key Lifecycle Management</h3>
          <p className="text-sm text-slate-500">AI-powered tier optimization and security analysis</p>
        </div>
        <Button
          onClick={() => handleAnalyze(null)}
          disabled={analyzeMutation.isPending}
          className="gap-2"
        >
          {analyzeMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Analyze All Keys
        </Button>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys ({gateway.api_keys?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Name</TableHead>
                <TableHead>Current Tier</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateway.api_keys?.map((key) => (
                <TableRow key={key.key_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-xs text-slate-500">{key.key_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={tierColors[key.tier]}>{key.tier}</Badge>
                  </TableCell>
                  <TableCell>{key.rate_limit || 'Unlimited'} req/min</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(key.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAnalyze(key.key_id)}
                      disabled={analyzeMutation.isPending}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">
                Tier Recommendations ({analysis.results?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="security">
                Security Issues ({analysis.results?.flatMap(r => r.analysis.security_issues).length || 0})
              </TabsTrigger>
              <TabsTrigger value="anomalies">
                Anomalies ({analysis.results?.flatMap(r => r.analysis.anomalies_detected).length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {analysis.results?.map((result) => (
                <Card key={result.key_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{result.key_name}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          Usage Pattern: <span className="font-medium capitalize">{result.analysis.usage_pattern}</span>
                        </p>
                      </div>
                      <Badge className={tierColors[result.analysis.recommended_tier]}>
                        Recommended: {result.analysis.recommended_tier}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-500">Daily Requests</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {result.analysis.requests_per_day_estimate?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-500">Security Score</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={result.analysis.security_risk_score} className="flex-1" />
                          <span className="text-lg font-semibold">
                            {result.analysis.security_risk_score}/100
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-500">Avg Response</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {result.analysis.performance_insights?.avg_response_time || 0}ms
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-500">Error Rate</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {result.analysis.performance_insights?.error_rate_percentage || 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Tier Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              {analysis.results?.map((result) => {
                const currentKey = gateway.api_keys?.find(k => k.key_id === result.key_id);
                const tierChanged = currentKey?.tier !== result.analysis.recommended_tier;

                return (
                  <Card key={result.key_id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Key className="w-5 h-5 text-slate-500" />
                            <h4 className="font-semibold">{result.key_name}</h4>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-4">
                            <div>
                              <p className="text-sm text-slate-500 mb-1">Current Tier</p>
                              <Badge className={tierColors[currentKey?.tier]}>
                                {currentKey?.tier}
                              </Badge>
                            </div>
                            <div className="flex items-center">
                              {tierChanged ? (
                                result.analysis.recommended_tier > currentKey?.tier ? (
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-orange-600" />
                                )
                              ) : (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 mb-1">Recommended Tier</p>
                              <Badge className={tierColors[result.analysis.recommended_tier]}>
                                {result.analysis.recommended_tier}
                              </Badge>
                            </div>
                          </div>

                          <Alert>
                            <AlertDescription className="text-sm">
                              <strong>Reason:</strong> {result.analysis.tier_change_reason}
                            </AlertDescription>
                          </Alert>

                          {/* Cost Optimization */}
                          {result.analysis.cost_optimization && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  Cost Optimization
                                </span>
                              </div>
                              <div className="text-sm text-green-700">
                                Potential savings: ${result.analysis.cost_optimization.potential_savings}/mo
                              </div>
                              <ul className="mt-2 space-y-1">
                                {result.analysis.cost_optimization.suggestions?.map((suggestion, idx) => (
                                  <li key={idx} className="text-xs text-green-600 flex items-start gap-2">
                                    <span>•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {tierChanged && (
                          <Button
                            onClick={() =>
                              handleApplyRecommendation(
                                result.key_id,
                                result.analysis.recommended_tier,
                                result.analysis.cost_optimization?.recommended_tier_cost_estimate
                              )
                            }
                            className="ml-4"
                          >
                            Apply Recommendation
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Security Issues Tab */}
            <TabsContent value="security" className="space-y-4">
              {analysis.results?.map((result) =>
                result.analysis.security_issues?.map((issue, idx) => (
                  <Alert
                    key={`${result.key_id}-${idx}`}
                    variant={issue.severity === 'critical' || issue.severity === 'high' ? 'destructive' : 'default'}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={severityColors[issue.severity]}>
                            {issue.severity}
                          </Badge>
                          <span className="font-semibold">{result.key_name}</span>
                        </div>
                        <AlertDescription>
                          <p className="mb-2">{issue.issue}</p>
                          <p className="text-sm text-slate-600">
                            <strong>Recommendation:</strong> {issue.recommendation}
                          </p>
                        </AlertDescription>
                      </div>
                      <Shield className="w-5 h-5 text-slate-400" />
                    </div>
                  </Alert>
                ))
              )}
            </TabsContent>

            {/* Anomalies Tab */}
            <TabsContent value="anomalies" className="space-y-4">
              {analysis.results?.map((result) =>
                result.analysis.anomalies_detected?.map((anomaly, idx) => (
                  <Card key={`${result.key_id}-${idx}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            anomaly.risk_level === 'high' ? 'text-red-600' : 
                            anomaly.risk_level === 'medium' ? 'text-yellow-600' : 
                            'text-blue-600'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{result.key_name}</span>
                            <Badge variant="outline" className="capitalize">
                              {anomaly.type}
                            </Badge>
                            <Badge className={severityColors[anomaly.risk_level]}>
                              {anomaly.risk_level} risk
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{anomaly.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Loading State */}
      {analyzeMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">Analyzing API key usage patterns...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}