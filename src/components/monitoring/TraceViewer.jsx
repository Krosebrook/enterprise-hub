import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import TraceFlow from './TraceFlow';

export default function TraceViewer({ services }) {
  const [filters, setFilters] = useState({
    service: 'all',
    endpoint: '',
    minDuration: 0,
    maxDuration: 10000,
    showErrors: false,
    limit: 50
  });
  const [selectedTrace, setSelectedTrace] = useState(null);

  const { data: traces = [] } = useQuery({
    queryKey: ['traces', filters],
    queryFn: async () => {
      const query = {};
      if (filters.service !== 'all') query.service_name = filters.service;
      if (filters.endpoint) query.endpoint = { $regex: filters.endpoint };
      if (filters.showErrors) query.error = true;
      
      const results = await base44.entities.Trace.filter(query);
      return results
        .filter(t => t.duration_ms >= filters.minDuration && t.duration_ms <= filters.maxDuration)
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
        .slice(0, filters.limit);
    }
  });

  const getDurationColor = (duration) => {
    if (duration < 100) return 'text-green-600';
    if (duration < 500) return 'text-yellow-600';
    if (duration < 1000) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Service</label>
              <select
                value={filters.service}
                onChange={(e) => setFilters({...filters, service: e.target.value})}
                className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-1"
              >
                <option value="all">All Services</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Endpoint</label>
              <Input
                placeholder="/api/users"
                value={filters.endpoint}
                onChange={(e) => setFilters({...filters, endpoint: e.target.value})}
                className="text-sm h-8 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Min Duration (ms)</label>
              <Input
                type="number"
                value={filters.minDuration}
                onChange={(e) => setFilters({...filters, minDuration: parseInt(e.target.value) || 0})}
                className="text-sm h-8 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Max Duration (ms)</label>
              <Input
                type="number"
                value={filters.maxDuration}
                onChange={(e) => setFilters({...filters, maxDuration: parseInt(e.target.value) || 10000})}
                className="text-sm h-8 mt-1"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showErrors}
                  onChange={(e) => setFilters({...filters, showErrors: e.target.checked})}
                />
                Errors Only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {/* Traces List */}
        <div className="col-span-2 space-y-2">
          {traces.map(trace => (
            <Card
              key={trace.id}
              className={`cursor-pointer hover:shadow-lg transition-all ${
                selectedTrace?.id === trace.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedTrace(trace)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {trace.error ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-medium text-sm">{trace.endpoint}</span>
                      <Badge variant="outline" className="text-xs">
                        {trace.method}
                      </Badge>
                      {trace.status_code && (
                        <Badge className={trace.status_code >= 400 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {trace.status_code}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>{trace.service_name}</div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className={getDurationColor(trace.duration_ms)}>
                          {trace.duration_ms}ms
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    {new Date(trace.start_time).toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trace Detail */}
        {selectedTrace && (
          <TraceFlow trace={selectedTrace} />
        )}
      </div>
    </div>
  );
}