import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/shell/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Network,
  Route,
  Key,
  BarChart3,
  Settings,
  TrendingUp,
  Zap,
  Shield,
} from 'lucide-react';
import APIKeyManager from '@/components/gateway/APIKeyManager';
import SecurityMonitor from '@/components/gateway/SecurityMonitor';
import APICatalog from '@/components/gateway/APICatalog';

export default function APIGatewayManager() {
  const [searchParams] = useSearchParams();
  const gatewayId = searchParams.get('id');
  const queryClient = useQueryClient();

  const { data: gateway, isLoading } = useQuery({
    queryKey: ['api-gateway', gatewayId],
    queryFn: () => base44.entities.APIGateway.get(gatewayId),
    enabled: !!gatewayId,
  });

  const optimizeRoutingMutation = useMutation({
    mutationFn: ({ route_path }) =>
      base44.functions.invoke('intelligentRouting', {
        gateway_id: gatewayId,
        route_path,
        current_traffic: 150,
      }),
  });

  const adjustRateLimitsMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('adjustRateLimits', {
        gateway_id: gatewayId,
      }),
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!gateway) {
    return <div className="p-8">Gateway not found</div>;
  }

  const aiEnabled = gateway.ai_routing_config?.enabled || gateway.dynamic_rate_limiting?.enabled;

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title={gateway.name}
        subtitle="AI-powered API Gateway Management"
        breadcrumbs={[
          { label: 'Architectures', href: '/Architectures' },
          { label: gateway.name },
        ]}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => adjustRateLimitsMutation.mutate()}
              disabled={adjustRateLimitsMutation.isPending}
            >
              <Zap className="w-4 h-4 mr-2" />
              Optimize Rate Limits
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Routes</p>
                  <p className="text-2xl font-bold mt-1">{gateway.routes?.length || 0}</p>
                </div>
                <Route className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">API Keys</p>
                  <p className="text-2xl font-bold mt-1">{gateway.api_keys?.length || 0}</p>
                </div>
                <Key className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Requests</p>
                  <p className="text-2xl font-bold mt-1">
                    {gateway.total_requests?.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Blocked Requests</p>
                  <p className="text-2xl font-bold mt-1">
                    {gateway.total_blocked?.toLocaleString() || 0}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        {gateway.ai_insights && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart3 className="w-5 h-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Health Score</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {gateway.ai_insights.current_health_score || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Traffic Trend</p>
                  <Badge className="capitalize">
                    {gateway.ai_insights.predicted_traffic_trend || 'stable'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Risk Level</p>
                  <Badge
                    className={
                      gateway.ai_insights.risk_level === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : gateway.ai_insights.risk_level === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }
                  >
                    {gateway.ai_insights.risk_level || 'low'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="catalog">
          <TabsList>
            <TabsTrigger value="catalog">
              <Network className="w-4 h-4 mr-2" />
              API Catalog
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security Monitor
            </TabsTrigger>
            <TabsTrigger value="keys">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="routes">
              <Route className="w-4 h-4 mr-2" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              AI Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <APICatalog gateway={gateway} />
          </TabsContent>

          <TabsContent value="security">
            <SecurityMonitor
              gateway={gateway}
              onUpdate={() => queryClient.invalidateQueries(['api-gateway', gatewayId])}
            />
          </TabsContent>

          <TabsContent value="keys">
            <APIKeyManager
              gateway={gateway}
              onUpdate={() => queryClient.invalidateQueries(['api-gateway', gatewayId])}
            />
          </TabsContent>

          <TabsContent value="routes">
            <Card>
              <CardContent className="p-6">
                <p className="text-slate-500">Route management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardContent className="p-6">
                <p className="text-slate-500">AI configuration coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}