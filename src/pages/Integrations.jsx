import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Play,
  RefreshCw,
  Settings,
  Cloud,
  Lock,
  Activity
} from 'lucide-react';

const INTEGRATIONS = [
  // OAuth Connectors
  { id: 'google_sheets', name: 'Google Sheets', type: 'oauth_connector', category: 'Google' },
  { id: 'google_drive', name: 'Google Drive', type: 'oauth_connector', category: 'Google' },
  { id: 'google_docs', name: 'Google Docs', type: 'oauth_connector', category: 'Google' },
  { id: 'google_slides', name: 'Google Slides', type: 'oauth_connector', category: 'Google' },
  { id: 'google_calendar', name: 'Google Calendar', type: 'oauth_connector', category: 'Google' },
  { id: 'slack', name: 'Slack', type: 'oauth_connector', category: 'Communication' },
  { id: 'notion', name: 'Notion', type: 'oauth_connector', category: 'Productivity' },
  { id: 'linkedin', name: 'LinkedIn', type: 'oauth_connector', category: 'Social' },
  { id: 'tiktok', name: 'TikTok', type: 'oauth_connector', category: 'Social' },
  
  // Manual Integrations
  { id: 'resend', name: 'Resend', type: 'manual_secret', category: 'Email', secret: 'RESEND_API_KEY' },
  { id: 'twilio', name: 'Twilio', type: 'manual_secret', category: 'SMS', secret: 'TWILIO_ACCOUNT_SID' },
  { id: 'openai_tts', name: 'OpenAI TTS', type: 'manual_secret', category: 'AI', secret: 'OPENAI_API_KEY' },
  { id: 'elevenlabs', name: 'ElevenLabs', type: 'manual_secret', category: 'AI', secret: 'ELEVENLABS_API_KEY' },
  { id: 'fal_ai', name: 'Fal AI', type: 'manual_secret', category: 'AI', secret: 'FAL_API_KEY' },
  { id: 'brightdata', name: 'BrightData', type: 'manual_secret', category: 'Data', secret: 'BRIGHTDATA_USERNAME' },
  { id: 'x_twitter', name: 'X (Twitter)', type: 'manual_secret', category: 'Social', secret: 'X_API_KEY' },
  { id: 'hubspot', name: 'HubSpot', type: 'manual_secret', category: 'CRM', secret: 'HUBSPOT_PRIVATE_APP_TOKEN' },
  { id: 'monday', name: 'Monday.com', type: 'manual_secret', category: 'Productivity', secret: 'MONDAY_API_TOKEN' },
  { id: 'zapier', name: 'Zapier', type: 'manual_secret', category: 'Automation', secret: 'ZAPIER_WEBHOOK_URL' },
  
  // Custom API
  { id: 'custom_api', name: 'Custom API', type: 'custom_api', category: 'Custom', secret: 'CUSTOM_API_BASE_URL' }
];

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const { data: configs = [] } = useQuery({
    queryKey: ['integrationConfigs'],
    queryFn: () => base44.entities.IntegrationConfig.list()
  });

  const { data: outboxStats = {} } = useQuery({
    queryKey: ['outboxStats'],
    queryFn: async () => {
      const items = await base44.entities.IntegrationOutbox.list();
      const last24h = items.filter(i => {
        const created = new Date(i.created_date);
        return Date.now() - created.getTime() < 24 * 60 * 60 * 1000;
      });
      return {
        queued: last24h.filter(i => i.status === 'queued').length,
        sent: last24h.filter(i => i.status === 'sent').length,
        failed: last24h.filter(i => i.status === 'failed').length,
        dead_letter: last24h.filter(i => i.status === 'dead_letter').length
      };
    }
  });

  const { data: runs = [] } = useQuery({
    queryKey: ['reconcileRuns'],
    queryFn: () => base44.entities.ReconcileRun.list().then(d =>
      d.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    )
  });

  const dispatchMutation = useMutation({
    mutationFn: () => base44.functions.invoke('dispatchOutbox', { batchSize: 50 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outboxStats'] });
    }
  });

  const reconcileMutation = useMutation({
    mutationFn: (integrationId) =>
      base44.functions.invoke('reconcileIntegrations', { integration_id: integrationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconcileRuns'] });
    }
  });

  const toggleIntegration = useMutation({
    mutationFn: (config) =>
      base44.entities.IntegrationConfig.update(config.id, { enabled: !config.enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrationConfigs'] });
    }
  });

  const getConfig = (integrationId) => configs.find(c => c.integration_id === integrationId);
  const getLastRun = (integrationId) => runs.find(r => r.integration_id === integrationId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Integrations</h1>
        <p className="text-slate-600">Manage external API connections with outbox pattern and reconciliation</p>
      </div>

      {/* Outbox Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Outbox Status (Last 24h)
            </span>
            <Button
              size="sm"
              onClick={() => dispatchMutation.mutate()}
              disabled={dispatchMutation.isPending}
            >
              {dispatchMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Dispatch Now
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600">Queued</p>
              <p className="text-2xl font-bold text-blue-600">{outboxStats.queued || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-slate-600">Sent</p>
              <p className="text-2xl font-bold text-green-600">{outboxStats.sent || 0}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-slate-600">Failed</p>
              <p className="text-2xl font-bold text-yellow-600">{outboxStats.failed || 0}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-slate-600">Dead Letter</p>
              <p className="text-2xl font-bold text-red-600">{outboxStats.dead_letter || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Tabs */}
      <Tabs defaultValue="oauth" className="w-full">
        <TabsList>
          <TabsTrigger value="oauth">OAuth Connectors</TabsTrigger>
          <TabsTrigger value="manual">Manual (Secrets)</TabsTrigger>
          <TabsTrigger value="custom">Custom API</TabsTrigger>
        </TabsList>

        <TabsContent value="oauth" className="space-y-4">
          <p className="text-sm text-slate-600">One-click OAuth connections (app-level, shared)</p>
          {INTEGRATIONS.filter(i => i.type === 'oauth_connector').map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              config={getConfig(integration.id)}
              lastRun={getLastRun(integration.id)}
              onToggle={toggleIntegration}
              onReconcile={reconcileMutation}
            />
          ))}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <p className="text-sm text-slate-600">Manual integrations requiring API keys/secrets</p>
          {INTEGRATIONS.filter(i => i.type === 'manual_secret').map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              config={getConfig(integration.id)}
              lastRun={getLastRun(integration.id)}
              onToggle={toggleIntegration}
              onReconcile={reconcileMutation}
            />
          ))}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <p className="text-sm text-slate-600">Custom API integration template</p>
          {INTEGRATIONS.filter(i => i.type === 'custom_api').map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              config={getConfig(integration.id)}
              lastRun={getLastRun(integration.id)}
              onToggle={toggleIntegration}
              onReconcile={reconcileMutation}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IntegrationCard({ integration, config, lastRun, onToggle, onReconcile }) {
  const isEnabled = config?.enabled || false;
  const isReconciling = false; // TODO: track mutation state

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold">{integration.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isEnabled ? 'default' : 'secondary'}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {lastRun && (
                <Badge variant={lastRun.status === 'success' ? 'default' : 'destructive'}>
                  Last: {lastRun.status}
                </Badge>
              )}
            </div>
            {lastRun && (
              <p className="text-xs text-slate-500 mt-2">
                Last reconcile: {new Date(lastRun.created_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReconcile.mutate(integration.id)}
              disabled={isReconciling}
            >
              {isReconciling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => onToggle.mutate(config || { integration_id: integration.id, enabled: true })}
            >
              {isEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}