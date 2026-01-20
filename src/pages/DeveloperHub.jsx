import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Code, FileText, Package, Download, Play, Sparkles, HelpCircle, GitBranch, Rocket, Bug, History, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function DeveloperHub() {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [showMockDialog, setShowMockDialog] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [debugForm, setDebugForm] = useState({
    error_message: '',
    stack_trace: '',
    service_name: ''
  });

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

  const { data: artifacts = [] } = useQuery({
    queryKey: ['artifacts', selectedService?.id],
    queryFn: () => base44.entities.CodeArtifact.filter({ service_id: selectedService?.id }),
    enabled: !!selectedService?.id
  });

  const aiHelperMutation = useMutation({
    mutationFn: async (query) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful development assistant. Answer this developer question concisely:\n\n${query}`
      });
      setAiResponse(response);
    }
  });

  const debugMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('debugEnvironment', data)
  });

  const saveArtifactMutation = useMutation({
    mutationFn: (data) => base44.entities.CodeArtifact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
    }
  });

  const deployMutation = useMutation({
    mutationFn: async ({ service_id, artifact_id }) => {
      // Trigger CI/CD pipeline
      const pipelines = await base44.entities.Pipeline.filter({ architecture_id: selectedService?.architecture_id });
      if (pipelines.length > 0) {
        return base44.functions.invoke('executePipeline', {
          pipeline_id: pipelines[0].id,
          trigger_type: 'manual'
        });
      }
      throw new Error('No pipeline configured');
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

  const handleGenerateAndSave = async (service) => {
    const result = await generateCodeMutation.mutateAsync(service);
    const generatedData = result.data;

    // Save all artifacts with versioning
    const version = '1.0.0';
    const artifactTypes = [
      { type: 'openapi', content: generatedData.openapi_schema, filename: 'openapi.yaml' },
      { type: 'crud_code', content: generatedData.crud_code, filename: 'crud.js' },
      { type: 'tests', content: generatedData.test_code, filename: 'tests.js' },
      { type: 'integration_tests', content: generatedData.integration_test_code, filename: 'integration.test.js' },
      { type: 'dockerfile', content: generatedData.dockerfile, filename: 'Dockerfile' },
      { type: 'kubernetes_deployment', content: generatedData.kubernetes_deployment, filename: 'deployment.yaml' },
      { type: 'client_sdk', content: generatedData.client_sdk, filename: 'sdk.ts' }
    ];

    for (const artifact of artifactTypes) {
      if (artifact.content) {
        await saveArtifactMutation.mutateAsync({
          service_id: service.id,
          service_name: service.name,
          artifact_type: artifact.type,
          version,
          content: artifact.content,
          file_name: artifact.filename,
          is_latest: true
        });
      }
    }
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
        <div className="flex gap-2">
          <Button onClick={() => setShowDebugger(true)} variant="outline">
            <Bug className="w-4 h-4 mr-2" />
            AI Debugger
          </Button>
          <Button onClick={() => setShowAIHelper(true)} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Generated Services</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts & Versions</TabsTrigger>
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedService(service);
                        handleGenerateAndSave(service);
                      }}
                      disabled={generateCodeMutation.isPending}
                    >
                      {generateCodeMutation.isPending ? 'Generating...' : 'Generate & Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedService(service);
                        setShowVersions(true);
                      }}
                    >
                      <History className="w-3 h-3" />
                    </Button>
                  </div>
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

        <TabsContent value="artifacts" className="space-y-4">
          {selectedService && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{selectedService.name} - Artifacts</span>
                  <Button
                    size="sm"
                    onClick={() => deployMutation.mutate({ service_id: selectedService.id })}
                    disabled={deployMutation.isPending}
                  >
                    <Rocket className="w-3 h-3 mr-2" />
                    Deploy via CI/CD
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {artifacts.map(artifact => (
                    <div key={artifact.id} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{artifact.file_name}</p>
                          <div className="flex gap-2 text-xs text-slate-600">
                            <Badge variant="outline">{artifact.version}</Badge>
                            {artifact.is_latest && <Badge className="bg-green-100 text-green-700">Latest</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(artifact.content);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadFile(artifact.content, artifact.file_name)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {artifacts.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No artifacts yet. Generate code to create versioned artifacts.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {!selectedService && (
            <p className="text-sm text-slate-500 text-center py-8">
              Select a service to view its artifacts
            </p>
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

      {/* AI Debugger Dialog */}
      <Dialog open={showDebugger} onOpenChange={setShowDebugger}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              AI Environment Debugger
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Error Message</label>
              <Textarea
                placeholder="Paste your error message here..."
                value={debugForm.error_message}
                onChange={(e) => setDebugForm({...debugForm, error_message: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Stack Trace (Optional)</label>
              <Textarea
                placeholder="Paste stack trace if available..."
                value={debugForm.stack_trace}
                onChange={(e) => setDebugForm({...debugForm, stack_trace: e.target.value})}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Service Name</label>
              <Input
                placeholder="e.g., api-service"
                value={debugForm.service_name}
                onChange={(e) => setDebugForm({...debugForm, service_name: e.target.value})}
              />
            </div>
            <Button
              onClick={() => debugMutation.mutate(debugForm)}
              disabled={!debugForm.error_message || debugMutation.isPending}
              className="w-full"
            >
              {debugMutation.isPending ? 'Analyzing...' : 'Analyze & Debug'}
            </Button>

            {debugMutation.data && (
              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={debugMutation.data.data.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                        {debugMutation.data.data.severity}
                      </Badge>
                      <Badge variant="outline">{debugMutation.data.data.category}</Badge>
                    </div>
                    <p className="text-sm font-medium text-blue-900">Root Cause:</p>
                    <p className="text-sm text-blue-700">{debugMutation.data.data.root_cause}</p>
                  </div>

                  {debugMutation.data.data.quick_fix && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs font-medium text-green-900">Quick Fix:</p>
                      <p className="text-xs text-green-700">{debugMutation.data.data.quick_fix}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-2">Resolution Steps:</p>
                    <div className="space-y-2">
                      {debugMutation.data.data.resolution_steps?.map((step, idx) => (
                        <div key={idx} className="p-2 bg-white rounded border border-blue-200">
                          <p className="text-sm font-medium">Step {step.step}: {step.action}</p>
                          {step.command && (
                            <code className="text-xs bg-slate-900 text-slate-100 px-2 py-1 rounded block mt-1">
                              {step.command}
                            </code>
                          )}
                          <p className="text-xs text-slate-600 mt-1">{step.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {debugMutation.data.data.optimization_suggestions?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Optimization Tips:</p>
                      <ul className="space-y-1 text-xs">
                        {debugMutation.data.data.optimization_suggestions.map((tip, idx) => (
                          <li key={idx} className="text-blue-700">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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