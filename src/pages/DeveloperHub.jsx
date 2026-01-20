import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code, FileText, Package, Download, Play, Sparkles, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function DeveloperHub() {
  const [selectedService, setSelectedService] = useState(null);
  const [showMockDialog, setShowMockDialog] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list()
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['serviceCatalog'],
    queryFn: () => base44.entities.ServiceCatalog.list()
  });

  const generateCodeMutation = useMutation({
    mutationFn: (service) => base44.functions.invoke('generateServiceCode', { service })
  });

  const generateMockMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('generateAPIMock', data),
    onSuccess: () => setShowMockDialog(false)
  });

  const aiHelperMutation = useMutation({
    mutationFn: async (query) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful development assistant. Answer this developer question concisely:\n\n${query}`
      });
      setAiResponse(response);
    }
  });

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6" />
            Developer Hub
          </h1>
          <p className="text-slate-600">Access generated code, SDKs, and development tools</p>
        </div>
        <Button onClick={() => setShowAIHelper(true)} variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Assistant
        </Button>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Generated Services</TabsTrigger>
          <TabsTrigger value="catalog">Service Catalog</TabsTrigger>
          <TabsTrigger value="mocks">API Mocks</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {services.map(service => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{service.name}</span>
                    <Badge>{service.language}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-600">{service.description}</p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedService(service);
                      generateCodeMutation.mutate(service);
                    }}
                    disabled={generateCodeMutation.isPending}
                  >
                    {generateCodeMutation.isPending ? 'Generating...' : 'Generate Full Stack'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {generateCodeMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generated Artifacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {generateCodeMutation.data.data.openapi_schema && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(generateCodeMutation.data.data.openapi_schema, 'openapi.yaml')}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    OpenAPI Schema
                  </Button>
                )}
                {generateCodeMutation.data.data.crud_code && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(generateCodeMutation.data.data.crud_code, 'crud.js')}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    CRUD Code
                  </Button>
                )}
                {generateCodeMutation.data.data.dockerfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(generateCodeMutation.data.data.dockerfile, 'Dockerfile')}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Dockerfile
                  </Button>
                )}
                {generateCodeMutation.data.data.kubernetes_deployment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(generateCodeMutation.data.data.kubernetes_deployment, 'deployment.yaml')}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    K8s Deployment
                  </Button>
                )}
                {generateCodeMutation.data.data.client_sdk && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(generateCodeMutation.data.data.client_sdk, 'sdk.ts')}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Client SDK
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {catalog.map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-slate-600">{item.description}</p>
                  <div className="flex gap-1">
                    <Badge variant="outline">{item.category}</Badge>
                    <Badge variant="outline">{item.language}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => generateCodeMutation.mutate({
                      name: item.name,
                      description: item.description,
                      language: item.language,
                      framework: item.framework
                    })}
                  >
                    <Code className="w-3 h-3 mr-2" />
                    Generate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mocks">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>API Mock Generator</span>
                <Button size="sm" onClick={() => setShowMockDialog(true)}>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Mock
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Generate mock API servers for faster development and testing
              </p>
              {generateMockMutation.data && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700 font-medium mb-2">✅ Mock server generated!</p>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(generateMockMutation.data.data.mock_server_code, 'mock-server.js')}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Download Mock Server
                  </Button>
                  <p className="text-xs text-green-600 mt-2">{generateMockMutation.data.data.setup_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Helper Dialog */}
      <Dialog open={showAIHelper} onOpenChange={setShowAIHelper}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Development Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Ask anything about development, debugging, or optimization..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              rows={3}
            />
            <Button
              onClick={() => aiHelperMutation.mutate(aiQuery)}
              disabled={!aiQuery.trim() || aiHelperMutation.isPending}
            >
              {aiHelperMutation.isPending ? 'Thinking...' : 'Ask AI'}
            </Button>
            {aiResponse && (
              <Card>
                <CardContent className="p-4 text-sm whitespace-pre-wrap">
                  {aiResponse}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mock Generator Dialog */}
      <Dialog open={showMockDialog} onOpenChange={setShowMockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Mock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Select a service with OpenAPI schema</p>
            {services.filter(s => s.has_api).map(service => (
              <Button
                key={service.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => generateMockMutation.mutate({
                  service_name: service.name,
                  openapi_schema: 'Generated schema placeholder'
                })}
              >
                {service.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}