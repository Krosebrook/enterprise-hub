import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ArrowLeft,
  Settings,
  Save,
  Loader2,
  MessageSquare,
  Code,
  BarChart3,
  Workflow
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const templates = [
  { 
    id: 'custom', 
    name: 'Custom', 
    description: 'Start from scratch',
    icon: Settings,
    color: 'bg-slate-100 text-slate-600'
  },
  { 
    id: 'customer_support', 
    name: 'Customer Support', 
    description: 'Handle tier-1 support tickets',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    id: 'data_analysis', 
    name: 'Data Analysis', 
    description: 'Analyze and visualize data',
    icon: BarChart3,
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    id: 'workflow_automation', 
    name: 'Workflow Automation', 
    description: 'Automate repetitive tasks',
    icon: Workflow,
    color: 'bg-green-100 text-green-600'
  },
  { 
    id: 'code_assistant', 
    name: 'Code Assistant', 
    description: 'Help with coding tasks',
    icon: Code,
    color: 'bg-orange-100 text-orange-600'
  }
];

const modelProviders = {
  openai: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  google: ['gemini-pro', 'gemini-pro-vision'],
  meta: ['llama-3-70b', 'llama-3-8b']
};

export default function AgentCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [agentId, setAgentId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'custom',
    model_provider: 'openai',
    model_name: 'gpt-4-turbo',
    temperature: 0.3,
    max_tokens: 1000,
    system_prompt: '',
    fallback_behavior: 'escalate_human',
    confidence_threshold: 0.7,
    status: 'draft'
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setAgentId(id);
  }, []);

  const { data: existingAgent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => base44.entities.Agent.filter({ id: agentId }),
    enabled: !!agentId,
    select: (data) => data[0]
  });

  useEffect(() => {
    if (existingAgent) {
      setFormData({
        name: existingAgent.name || '',
        description: existingAgent.description || '',
        template_type: existingAgent.template_type || 'custom',
        model_provider: existingAgent.model_provider || 'openai',
        model_name: existingAgent.model_name || 'gpt-4-turbo',
        temperature: existingAgent.temperature || 0.3,
        max_tokens: existingAgent.max_tokens || 1000,
        system_prompt: existingAgent.system_prompt || '',
        fallback_behavior: existingAgent.fallback_behavior || 'escalate_human',
        confidence_threshold: existingAgent.confidence_threshold || 0.7,
        status: existingAgent.status || 'draft'
      });
    }
  }, [existingAgent]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Agent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      navigate(createPageUrl('Agents'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      navigate(createPageUrl('Agents'));
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (templateId) => {
    handleChange('template_type', templateId);
    
    // Set default system prompts based on template
    const prompts = {
      customer_support: 'You are a helpful customer support agent. Be friendly, professional, and concise. If you cannot resolve an issue, politely offer to escalate to a human agent.',
      data_analysis: 'You are a data analysis assistant. Help users understand their data, create visualizations, and derive insights. Be precise and explain your reasoning.',
      workflow_automation: 'You are a workflow automation assistant. Help users automate repetitive tasks, create efficient processes, and optimize their workflows.',
      code_assistant: 'You are a coding assistant. Help users write, debug, and optimize code. Explain your suggestions clearly and follow best practices.'
    };
    
    if (prompts[templateId]) {
      handleChange('system_prompt', prompts[templateId]);
    }
  };

  const handleSubmit = () => {
    if (agentId) {
      updateMutation.mutate({ id: agentId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Agents')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {agentId ? 'Edit Agent' : 'Create New Agent'}
              </h1>
              <p className="text-sm text-slate-500">
                Configure your AI agent's behavior and capabilities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(createPageUrl('Agents'))}
            >
              Cancel
            </Button>
            <Button 
              className="bg-slate-900 hover:bg-slate-800"
              onClick={handleSubmit}
              disabled={isPending || !formData.name}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {agentId ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="model">Model Settings</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose a Template</CardTitle>
                <CardDescription>Start with a pre-configured template or build from scratch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${formData.template_type === template.id 
                          ? 'border-slate-900 bg-slate-50' 
                          : 'border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center mb-3`}>
                        <template.icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-medium text-slate-900 text-sm">{template.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Agent Details */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Customer Support Bot"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this agent do?"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Settings Tab */}
          <TabsContent value="model" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
                <CardDescription>Choose the AI model that powers your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select 
                      value={formData.model_provider} 
                      onValueChange={(value) => {
                        handleChange('model_provider', value);
                        handleChange('model_name', modelProviders[value][0]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="meta">Meta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select 
                      value={formData.model_name} 
                      onValueChange={(value) => handleChange('model_name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(modelProviders[formData.model_provider] || []).map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Temperature</Label>
                      <span className="text-sm text-slate-500">{formData.temperature}</span>
                    </div>
                    <Slider
                      value={[formData.temperature]}
                      onValueChange={([value]) => handleChange('temperature', value)}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_tokens">Max Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      value={formData.max_tokens}
                      onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
                      min={100}
                      max={32000}
                    />
                    <p className="text-xs text-slate-500">
                      Maximum length of the response
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>Define how your agent should behave and respond</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="You are a helpful assistant..."
                  value={formData.system_prompt}
                  onChange={(e) => handleChange('system_prompt', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fallback Behavior</CardTitle>
                <CardDescription>What should the agent do when it's not confident?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fallback Action</Label>
                  <Select 
                    value={formData.fallback_behavior} 
                    onValueChange={(value) => handleChange('fallback_behavior', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escalate_human">Escalate to Human</SelectItem>
                      <SelectItem value="retry">Retry Response</SelectItem>
                      <SelectItem value="return_error">Return Error</SelectItem>
                      <SelectItem value="use_default">Use Default Response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Confidence Threshold</Label>
                    <span className="text-sm text-slate-500">{formData.confidence_threshold}</span>
                  </div>
                  <Slider
                    value={[formData.confidence_threshold]}
                    onValueChange={([value]) => handleChange('confidence_threshold', value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">
                    Minimum confidence level to respond (below triggers fallback)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}