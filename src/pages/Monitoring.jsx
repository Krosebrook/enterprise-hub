import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { AlertCircle, TrendingUp, Activity, Clock, Zap, Plus } from 'lucide-react';
import LogViewer from '../components/monitoring/LogViewer';

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const { data: architectures = [] } = useQuery({
    queryKey: ['architectures'],
    queryFn: () => base44.entities.Architecture.list()
  });

  const { data: services = [] } = useQuery({
    queryKey: ['allServices'],
    queryFn: async () => {
      const allServices = [];
      for (const arch of architectures) {
        const svc = await base44.entities.Service.filter({ architecture_id: arch.id });
        allServices.push(...svc);
      }
      return allServices;
    },
    enabled: architectures.length > 0
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['serviceMetrics'],
    queryFn: () => base44.entities.ServiceMetrics.list().then(m =>
      m.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 500)
    )
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alertEvents'],
    queryFn: () => base44.entities.AlertEvent.filter({ status: 'firing' })
  });

  const { data: alertRules = [] } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => base44.entities.AlertRule.list()
  });

  // Prepare chart data
  const chartData = metrics
    .filter(m => !selectedService || m.service_id === selectedService)
    .reduce((acc, m) => {
      const existing = acc.find(d => d.timestamp === m.timestamp);
      if (existing) {
        existing[`${m.service_name}_cpu`] = m.cpu_percent;
        existing[`${m.service_name}_memory`] = m.memory_percent;
        existing[`${m.service_name}_latency`] = m.request_latency_ms;
      } else {
        acc.push({
          timestamp: m.timestamp,
          [`${m.service_name}_cpu`]: m.cpu_percent,
          [`${m.service_name}_memory`]: m.memory_percent,
          [`${m.service_name}_latency`]: m.request_latency_ms
        });
      }
      return acc;
    }, [])
    .slice(-50);

  // KPI summary
  const avgCpu = metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + (m.cpu_percent || 0), 0) / metrics.length) : 0;
  const avgMemory = metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + (m.memory_percent || 0), 0) / metrics.length) : 0;
  const avgLatency = metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + (m.request_latency_ms || 0), 0) / metrics.length) : 0;
  const errorRateAvg = metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + (m.error_rate_percent || 0), 0) / metrics.length * 100) / 100 : 0;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring Dashboard</h1>
          <p className="text-slate-600">Real-time KPIs and service health</p>
        </div>
        <Button onClick={() => setShowAlertDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Alert Rule
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard icon={<Zap className="w-5 h-5" />} title="Avg CPU" value={`${avgCpu}%`} status={avgCpu > 80 ? 'warning' : 'healthy'} />
        <KPICard icon={<Activity className="w-5 h-5" />} title="Avg Memory" value={`${avgMemory}%`} status={avgMemory > 80 ? 'warning' : 'healthy'} />
        <KPICard icon={<Clock className="w-5 h-5" />} title="Avg Latency" value={`${avgLatency}ms`} status={avgLatency > 500 ? 'warning' : 'healthy'} />
        <KPICard icon={<TrendingUp className="w-5 h-5" />} title="Error Rate" value={`${errorRateAvg}%`} status={errorRateAvg > 1 ? 'warning' : 'healthy'} />
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="p-3 bg-white rounded border border-red-200">
                  <p className="font-medium text-sm">{alert.service_name} - {alert.metric_type}</p>
                  <p className="text-xs text-slate-600">{alert.message}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Current: {alert.current_value} | Threshold: {alert.threshold}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cpu">CPU</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="latency">Latency</TabsTrigger>
          <TabsTrigger value="alerts">Alert Rules</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {services.slice(0, 3).map((svc, idx) => (
                    <Line
                      key={`${svc.id}-cpu`}
                      type="monotone"
                      dataKey={`${svc.name}_cpu`}
                      stroke={COLORS[idx]}
                      name={`${svc.name} (CPU %)`}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cpu">
          <Card>
            <CardHeader>
              <CardTitle>CPU Usage by Service</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {services.slice(0, 3).map((svc, idx) => (
                    <Bar
                      key={`${svc.id}-cpu`}
                      dataKey={`${svc.name}_cpu`}
                      fill={COLORS[idx]}
                      name={svc.name}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage by Service</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {services.slice(0, 3).map((svc, idx) => (
                    <Bar
                      key={`${svc.id}-memory`}
                      dataKey={`${svc.name}_memory`}
                      fill={COLORS[idx]}
                      name={svc.name}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="latency">
          <Card>
            <CardHeader>
              <CardTitle>Request Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {services.slice(0, 3).map((svc, idx) => (
                    <Line
                      key={`${svc.id}-latency`}
                      type="monotone"
                      dataKey={`${svc.name}_latency`}
                      stroke={COLORS[idx]}
                      name={svc.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertRules.length === 0 ? (
                  <p className="text-sm text-slate-500">No alert rules configured</p>
                ) : (
                  alertRules.map(rule => (
                    <div key={rule.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{rule.name}</p>
                          <p className="text-xs text-slate-600">
                            {rule.metric_type} {rule.condition} {rule.threshold}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {rule.severity}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <LogViewer services={services} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon, title, value, status }) {
  const statusColor = status === 'healthy' ? 'text-green-600' : 'text-orange-600';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={statusColor}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}