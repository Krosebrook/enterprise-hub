import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, AlertCircle, Info, AlertTriangle, XCircle, Bug } from 'lucide-react';
import { format } from 'date-fns';

export default function LogViewer({ services }) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('1h');

  const { data: logs = [], refetch } = useQuery({
    queryKey: ['applicationLogs', severityFilter, serviceFilter, timeRange],
    queryFn: async () => {
      let query = {};
      
      if (severityFilter !== 'all') {
        query.severity = severityFilter;
      }
      if (serviceFilter !== 'all') {
        query.service_name = serviceFilter;
      }
      
      const allLogs = await base44.entities.ApplicationLog.filter(query);
      
      // Filter by time range
      const now = new Date();
      const cutoff = new Date(now);
      if (timeRange === '1h') cutoff.setHours(cutoff.getHours() - 1);
      else if (timeRange === '24h') cutoff.setHours(cutoff.getHours() - 24);
      else if (timeRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
      
      return allLogs
        .filter(log => new Date(log.timestamp || log.created_date) > cutoff)
        .sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date))
        .slice(0, 1000);
    },
    refetchInterval: 5000 // Auto-refresh every 5s
  });

  const filteredLogs = logs.filter(log =>
    searchQuery === '' ||
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-slate-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'debug':
        return 'bg-slate-50 border-slate-200 text-slate-600';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Application Logs</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Services</option>
            {services.map(svc => (
              <option key={svc.id} value={svc.name}>{svc.name}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        {/* Log count */}
        <div className="flex items-center gap-4 mb-3 text-xs text-slate-600">
          <span>Showing {filteredLogs.length} of {logs.length} logs</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live (refreshing every 5s)
          </span>
        </div>

        {/* Logs */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No logs found</p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border text-xs ${getSeverityColor(log.severity)}`}
              >
                <div className="flex items-start gap-2">
                  {getSeverityIcon(log.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono font-medium">{log.service_name}</span>
                      <span className="text-slate-500 whitespace-nowrap">
                        {format(new Date(log.timestamp || log.created_date), 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className="break-words">{log.message}</p>
                    {log.source && (
                      <p className="text-slate-600 mt-1">Source: {log.source}</p>
                    )}
                    {log.stack_trace && (
                      <pre className="mt-2 p-2 bg-black/5 rounded text-[10px] overflow-x-auto">
                        {log.stack_trace}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}