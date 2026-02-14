import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  RefreshCw,
  FileCode,
  Download,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Shield,
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

const methodColors = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-purple-100 text-purple-700',
};

export default function APICatalog({ gateway }) {
  const [searchQuery, setSearchQuery] = useState('');

  const discoveryMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('discoverAPIs', {
        gateway_id: gateway.id,
        analyze_traces: true,
      }),
  });

  const generateSpecMutation = useMutation({
    mutationFn: (discovered_apis) =>
      base44.functions.invoke('generateOpenAPISpec', {
        gateway_id: gateway.id,
        discovered_apis,
        service_name: gateway.name,
      }),
  });

  const discoveryData = discoveryMutation.data?.data;
  const openApiSpec = generateSpecMutation.data?.data?.openapi_spec;

  const handleDiscover = () => {
    discoveryMutation.mutate();
  };

  const handleGenerateSpec = () => {
    if (discoveryData?.discovered_apis) {
      generateSpecMutation.mutate(discoveryData.discovered_apis);
    }
  };

  const handleDownloadSpec = () => {
    if (!openApiSpec) return;
    const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gateway.name}-openapi.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAPIs = discoveryData?.discovered_apis?.filter((api) =>
    api.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.service_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">API Discovery & Documentation</h3>
          <p className="text-sm text-slate-500">AI-powered API catalog with auto-generated specs</p>
        </div>
        <div className="flex gap-2">
          {discoveryData && (
            <Button
              variant="outline"
              onClick={handleGenerateSpec}
              disabled={generateSpecMutation.isPending}
            >
              <FileCode className="w-4 h-4 mr-2" />
              Generate OpenAPI Spec
            </Button>
          )}
          <Button onClick={handleDiscover} disabled={discoveryMutation.isPending}>
            {discoveryMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Discover APIs
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {discoveryData && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Endpoints Discovered</p>
              <p className="text-2xl font-bold">{discoveryData.statistics.total_endpoints_discovered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Requests Analyzed</p>
              <p className="text-2xl font-bold">{discoveryData.statistics.total_requests_analyzed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Services Identified</p>
              <p className="text-2xl font-bold">{discoveryData.statistics.services_identified}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Auth Methods</p>
              <div className="flex gap-1 flex-wrap">
                {discoveryData.statistics.authentication_methods?.map((method) => (
                  <Badge key={method} variant="outline" className="text-xs">
                    {method}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OpenAPI Spec Download */}
      {openApiSpec && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">OpenAPI Specification Generated</p>
                  <p className="text-sm text-green-700">
                    {generateSpecMutation.data?.data?.endpoints_documented} endpoints documented
                  </p>
                </div>
              </div>
              <Button onClick={handleDownloadSpec}>
                <Download className="w-4 h-4 mr-2" />
                Download Spec
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {discoveryData && (
        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="endpoints">
              Endpoints ({discoveryData.discovered_apis?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              Recommendations ({discoveryData.recommendations?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Calls</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Error Rate</TableHead>
                      <TableHead>Auth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAPIs?.map((api, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={methodColors[api.method]}>{api.method}</Badge>
                              <code className="text-sm font-mono">{api.path}</code>
                            </div>
                            <div className="flex gap-1">
                              {api.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{api.service_name}</TableCell>
                        <TableCell className="text-sm">{api.call_count?.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{api.avg_response_time_ms}ms</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              api.error_rate > 10
                                ? 'bg-red-100 text-red-700'
                                : api.error_rate > 5
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }
                          >
                            {api.error_rate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {api.authentication}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-3">
              {discoveryData.recommendations?.map((rec, idx) => (
                <Card
                  key={idx}
                  className={
                    rec.priority === 'critical'
                      ? 'border-red-200 bg-red-50'
                      : rec.priority === 'high'
                      ? 'border-orange-200 bg-orange-50'
                      : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {rec.type === 'security' ? (
                        <Shield className="w-5 h-5 text-red-600" />
                      ) : rec.type === 'performance' ? (
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={
                              rec.priority === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : rec.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {rec.type}
                          </Badge>
                          <code className="text-xs">{rec.endpoint}</code>
                        </div>
                        <p className="text-sm text-slate-700">{rec.suggestion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Loading State */}
      {discoveryMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">
                Analyzing network traffic and discovering API endpoints...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}