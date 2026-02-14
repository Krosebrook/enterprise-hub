import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  CheckCircle,
  Clock,
  Globe,
  Activity,
  TrendingUp,
  Ban,
  Eye,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActivityTimeline from '@/components/shell/ActivityTimeline';

const threatLevelConfig = {
  none: { label: 'No Threats', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  low: { label: 'Low Risk', color: 'bg-blue-100 text-blue-700', icon: Shield },
  medium: { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  high: { label: 'High Risk', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700', icon: AlertOctagon },
};

const severityConfig = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export default function SecurityMonitor({ gateway, onUpdate }) {
  const [autoRefresh, setAutoRefresh] = useState(false);

  const scanMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('monitorAPIKeySecurity', {
        gateway_id: gateway.id,
      }),
  });

  const { data: recentAlerts } = useQuery({
    queryKey: ['security-alerts', gateway.id],
    queryFn: () =>
      base44.entities.AlertEvent.filter({
        service_id: gateway.architecture_id,
        alert_type: 'security_threat',
      }),
    initialData: [],
  });

  const { data: securityLogs } = useQuery({
    queryKey: ['security-logs', gateway.id],
    queryFn: () =>
      base44.entities.ApplicationLog.filter({
        service_name: 'api_gateway',
        source: 'security_monitor',
      }),
    initialData: [],
  });

  const securityData = scanMutation.data?.data;
  const criticalThreats = securityData?.analysis?.filter(
    (a) => a.analysis.threat_level === 'critical'
  ).length || 0;

  const handleScan = () => {
    scanMutation.mutate();
  };

  React.useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        scanMutation.mutate();
      }, 60000); // Every 60 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Proactive Security Monitoring
          </h3>
          <p className="text-sm text-slate-500">
            AI-powered threat detection and anomaly analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Stop Auto-Refresh' : 'Enable Auto-Refresh'}
          </Button>
          <Button onClick={handleScan} disabled={scanMutation.isPending}>
            {scanMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            Run Security Scan
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalThreats > 0 && (
        <Alert variant="destructive">
          <AlertOctagon className="w-4 h-4" />
          <AlertDescription>
            <strong>Critical Security Threats Detected!</strong> {criticalThreats}{' '}
            API key(s) showing signs of compromise or attack. Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Overview */}
      {securityData && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Overall Risk</p>
                  <Badge className={threatLevelConfig[securityData.overall_risk_level]?.color}>
                    {threatLevelConfig[securityData.overall_risk_level]?.label}
                  </Badge>
                </div>
                <Shield className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Keys Analyzed</p>
                  <p className="text-2xl font-bold">{securityData.keys_analyzed}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Threats Found</p>
                  <p className="text-2xl font-bold text-red-600">{criticalThreats}</p>
                </div>
                <AlertOctagon className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Last Scan</p>
                  <p className="text-sm font-medium">
                    {new Date(securityData.scan_timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Results */}
      {securityData && (
        <Tabs defaultValue="threats">
          <TabsList>
            <TabsTrigger value="threats">
              Active Threats ({securityData.analysis?.flatMap(a => a.analysis.threats_detected).length || 0})
            </TabsTrigger>
            <TabsTrigger value="anomalies">
              Anomalies ({securityData.analysis?.flatMap(a => a.analysis.anomalies).length || 0})
            </TabsTrigger>
            <TabsTrigger value="traffic">Traffic Analysis</TabsTrigger>
            <TabsTrigger value="actions">Recommended Actions</TabsTrigger>
          </TabsList>

          {/* Threats Tab */}
          <TabsContent value="threats" className="space-y-4">
            {securityData.analysis?.map((keyAnalysis) =>
              keyAnalysis.analysis.threats_detected?.map((threat, idx) => (
                <Alert
                  key={`${keyAnalysis.key_id}-${idx}`}
                  variant={threat.severity === 'critical' || threat.severity === 'high' ? 'destructive' : 'default'}
                  className={`border-2 ${severityConfig[threat.severity]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={severityConfig[threat.severity]}>
                          {threat.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {threat.type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="font-semibold text-sm">{keyAnalysis.key_name}</span>
                      </div>

                      <AlertDescription>
                        <p className="font-medium mb-2">{threat.description}</p>
                        
                        <div className="space-y-2 text-sm mt-3">
                          <div className="bg-slate-50 p-2 rounded">
                            <p className="text-xs text-slate-500 mb-1">Evidence:</p>
                            <p className="text-slate-700">{threat.evidence}</p>
                          </div>
                          
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-blue-600 mb-1">Recommendation:</p>
                            <p className="text-blue-900">{threat.recommendation}</p>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            First detected: {threat.first_detected}
                          </div>
                        </div>
                      </AlertDescription>
                    </div>

                    {keyAnalysis.analysis.should_block_immediately && (
                      <Button variant="destructive" size="sm" className="ml-4">
                        <Ban className="w-4 h-4 mr-2" />
                        Block Key
                      </Button>
                    )}
                  </div>
                </Alert>
              ))
            )}
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-4">
            {securityData.analysis?.map((keyAnalysis) =>
              keyAnalysis.analysis.anomalies?.map((anomaly, idx) => (
                <Card key={`${keyAnalysis.key_id}-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{keyAnalysis.key_name}</span>
                          <Badge variant="outline" className="capitalize">
                            {anomaly.category}
                          </Badge>
                          {anomaly.deviation_percentage > 100 && (
                            <Badge className="bg-red-100 text-red-700">
                              {anomaly.deviation_percentage}% deviation
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-700 mb-3">{anomaly.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-50 p-2 rounded">
                            <p className="text-xs text-slate-500">Normal Baseline</p>
                            <p className="font-medium text-slate-900">{anomaly.normal_baseline}</p>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <p className="text-xs text-orange-600">Current Value</p>
                            <p className="font-medium text-orange-900">{anomaly.current_value}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Traffic Analysis Tab */}
          <TabsContent value="traffic" className="space-y-4">
            {securityData.analysis?.map((keyAnalysis) => (
              <Card key={keyAnalysis.key_id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {keyAnalysis.key_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Requests (Last Hour)</p>
                      <p className="text-2xl font-bold">
                        {keyAnalysis.analysis.traffic_analysis?.requests_last_hour?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Error Rate</p>
                      <p className="text-2xl font-bold text-red-600">
                        {keyAnalysis.analysis.traffic_analysis?.error_rate_percentage || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Peak Time</p>
                      <p className="text-lg font-medium">
                        {keyAnalysis.analysis.traffic_analysis?.peak_request_time || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Geographic Spread</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {keyAnalysis.analysis.traffic_analysis?.geographic_spread?.map((country) => (
                          <Badge key={country} variant="outline" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {keyAnalysis.analysis.traffic_analysis?.unusual_endpoints?.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        Unusual Endpoints (High Error Rate)
                      </p>
                      <div className="space-y-1">
                        {keyAnalysis.analysis.traffic_analysis.unusual_endpoints.map((endpoint, idx) => (
                          <p key={idx} className="text-xs font-mono text-yellow-700">
                            {endpoint}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Recommended Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            {securityData.analysis?.map((keyAnalysis) =>
              keyAnalysis.analysis.recommended_actions?.map((action, idx) => (
                <Card
                  key={`${keyAnalysis.key_id}-${idx}`}
                  className={
                    action.priority === 'immediate'
                      ? 'border-red-200 bg-red-50'
                      : action.priority === 'high'
                      ? 'border-orange-200 bg-orange-50'
                      : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={
                              action.priority === 'immediate'
                                ? 'bg-red-100 text-red-700'
                                : action.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }
                          >
                            {action.priority} priority
                          </Badge>
                          <span className="font-semibold">{keyAnalysis.key_name}</span>
                        </div>
                        
                        <p className="text-lg font-medium capitalize mb-2">
                          {action.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-slate-600">{action.reason}</p>
                      </div>

                      <Button
                        variant={action.priority === 'immediate' ? 'destructive' : 'default'}
                        size="sm"
                      >
                        Execute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Security Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            activities={securityLogs.slice(0, 10).map((log) => ({
              id: log.id,
              title: log.message,
              description: log.metadata?.reason || log.metadata?.threats_found + ' threats found',
              created_date: log.timestamp,
              color: log.severity === 'critical' ? 'red' : log.severity === 'warn' ? 'yellow' : 'blue',
            }))}
            emptyMessage="No security events logged yet"
          />
        </CardContent>
      </Card>

      {/* Loading State */}
      {scanMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">
                Analyzing API key security patterns...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}