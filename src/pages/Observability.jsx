import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subMinutes } from 'date-fns';

// Mock real-time data
const generateTimeSeriesData = (points = 30, baseValue = 50, variance = 20) => {
  return Array.from({ length: points }, (_, i) => ({
    time: format(subMinutes(new Date(), points - 1 - i), 'HH:mm'),
    value: Math.max(0, baseValue + (Math.random() - 0.5) * variance)
  }));
};

const healthyServices = [
  { name: 'User Service', status: 'healthy', cpu: 23, memory: 45, requests: 1247, latency: 45 },
  { name: 'Order Service', status: 'healthy', cpu: 67, memory: 72, requests: 892, latency: 123 },
  { name: 'Payment Gateway', status: 'degraded', cpu: 89, memory: 85, requests: 456, latency: 890 },
  { name: 'Notification Service', status: 'healthy', cpu: 12, memory: 34, requests: 2341, latency: 23 },
  { name: 'Analytics Service', status: 'healthy', cpu: 45, memory: 56, requests: 678, latency: 67 },
  { name: 'Search Service', status: 'unhealthy', cpu: 95, memory: 92, requests: 0, latency: 0 }
];

const recentAlerts = [
  { id: 1, severity: 'critical', message: 'Search Service is down', time: '2 min ago', service: 'Search Service' },
  { id: 2, severity: 'warning', message: 'Payment Gateway latency > 500ms', time: '15 min ago', service: 'Payment Gateway' },
  { id: 3, severity: 'info', message: 'Deployment completed successfully', time: '1 hour ago', service: 'User Service' },
  { id: 4, severity: 'warning', message: 'Memory usage > 80%', time: '2 hours ago', service: 'Order Service' }
];

export default function Observability() {
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedService, setSelectedService] = useState('all');

  const cpuData = generateTimeSeriesData(30, 45, 30);
  const memoryData = generateTimeSeriesData(30, 60, 25);
  const requestsData = generateTimeSeriesData(30, 500, 200);
  const latencyData = generateTimeSeriesData(30, 100, 80);

  const { data: services = [] } = useQuery({
    queryKey: ['services-health'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700';
      case 'degraded': return 'bg-yellow-100 text-yellow-700';
      case 'unhealthy': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const healthyCount = healthyServices.filter(s => s.status === 'healthy').length;
  const degradedCount = healthyServices.filter(s => s.status === 'degraded').length;
  const unhealthyCount = healthyServices.filter(s => s.status === 'unhealthy').length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Observability</h1>
          <p className="text-slate-500 mt-1">Monitor your services in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <Clock className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">Last 15 min</SelectItem>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Services</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{healthyServices.length}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Server className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Healthy</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{healthyCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Degraded</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{degradedCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Unhealthy</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{unhealthyCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({recentAlerts.filter(a => a.severity !== 'info').length})</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthyServices.map((service) => (
              <Card key={service.name} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                      <CardTitle className="text-base">{service.name}</CardTitle>
                    </div>
                    <Badge className={getStatusBadge(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Cpu className="w-4 h-4" />
                        CPU
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={service.cpu} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-10">{service.cpu}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <HardDrive className="w-4 h-4" />
                        Memory
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={service.memory} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-10">{service.memory}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{service.requests.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">req/min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{service.latency}ms</p>
                      <p className="text-xs text-slate-500">p95 latency</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuData}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'CPU']} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorCpu)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Memory Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memoryData}>
                      <defs>
                        <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Memory']} />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#colorMemory)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Requests Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Request Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={requestsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip formatter={(value) => [`${value.toFixed(0)}`, 'req/min']} />
                      <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Latency Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Response Latency (p95)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}ms`} />
                      <Tooltip formatter={(value) => [`${value.toFixed(0)}ms`, 'Latency']} />
                      <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5" />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm opacity-75 mt-1">{alert.service}</p>
                        </div>
                      </div>
                      <span className="text-sm opacity-75">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}