import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ServicePropertiesPanel({ service, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'nodejs',
    framework: '',
    database_type: 'none',
    database_name: '',
    has_api: true,
    api_type: 'rest',
    port: 8080,
    health_check_path: '/health',
    auth_method: 'jwt',
    auto_scaling: false,
    min_instances: 1,
    max_instances: 3
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        language: service.language || 'nodejs',
        framework: service.framework || '',
        database_type: service.database_type || 'none',
        database_name: service.database_name || '',
        has_api: service.has_api ?? true,
        api_type: service.api_type || 'rest',
        port: service.port || 8080,
        health_check_path: service.health_check_path || '/health',
        auth_method: service.auth_method || 'jwt',
        auto_scaling: service.auto_scaling || false,
        min_instances: service.min_instances || 1,
        max_instances: service.max_instances || 3
      });
    }
  }, [service]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...service,
      ...formData
    });
  };

  const frameworkOptions = {
    go: ['Gin', 'Echo', 'Fiber', 'Chi'],
    nodejs: ['Express', 'Fastify', 'NestJS', 'Koa'],
    python: ['FastAPI', 'Django', 'Flask', 'Starlette'],
    java: ['Spring Boot', 'Micronaut', 'Quarkus', 'Vert.x'],
    rust: ['Actix', 'Rocket', 'Axum', 'Warp'],
    csharp: ['.NET Core', 'ASP.NET', 'ServiceStack']
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {service?.id ? 'Edit Service' : 'New Service'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <Accordion type="multiple" defaultValue={['basic', 'tech', 'api']} className="space-y-4">
          {/* Basic Info */}
          <AccordionItem value="basic" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              Basic Information
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., User Service"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="What does this service do?"
                  rows={3}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Technology Stack */}
          <AccordionItem value="tech" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              Technology Stack
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => {
                    handleChange('language', value);
                    handleChange('framework', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="nodejs">Node.js</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Framework</Label>
                <Select 
                  value={formData.framework} 
                  onValueChange={(value) => handleChange('framework', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {(frameworkOptions[formData.language] || []).map(fw => (
                      <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Database</Label>
                <Select 
                  value={formData.database_type} 
                  onValueChange={(value) => handleChange('database_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                    <SelectItem value="redis">Redis</SelectItem>
                    <SelectItem value="elasticsearch">Elasticsearch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.database_type !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="database_name">Database Name</Label>
                  <Input
                    id="database_name"
                    value={formData.database_name}
                    onChange={(e) => handleChange('database_name', e.target.value)}
                    placeholder="e.g., users_db"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* API Configuration */}
          <AccordionItem value="api" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              API Configuration
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="has_api">Expose API</Label>
                <Switch
                  id="has_api"
                  checked={formData.has_api}
                  onCheckedChange={(checked) => handleChange('has_api', checked)}
                />
              </div>

              {formData.has_api && (
                <>
                  <div className="space-y-2">
                    <Label>API Type</Label>
                    <Select 
                      value={formData.api_type} 
                      onValueChange={(value) => handleChange('api_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rest">REST</SelectItem>
                        <SelectItem value="grpc">gRPC</SelectItem>
                        <SelectItem value="graphql">GraphQL</SelectItem>
                        <SelectItem value="websocket">WebSocket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={formData.port}
                        onChange={(e) => handleChange('port', parseInt(e.target.value))}
                        min={1}
                        max={65535}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="health_check_path">Health Path</Label>
                      <Input
                        id="health_check_path"
                        value={formData.health_check_path}
                        onChange={(e) => handleChange('health_check_path', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Security */}
          <AccordionItem value="security" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              Security
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Authentication Method</Label>
                <Select 
                  value={formData.auth_method} 
                  onValueChange={(value) => handleChange('auth_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="jwt">JWT</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    <SelectItem value="mtls">mTLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced */}
          <AccordionItem value="advanced" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              Advanced
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto_scaling">Auto-scaling</Label>
                <Switch
                  id="auto_scaling"
                  checked={formData.auto_scaling}
                  onCheckedChange={(checked) => handleChange('auto_scaling', checked)}
                />
              </div>

              {formData.auto_scaling && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_instances">Min Instances</Label>
                    <Input
                      id="min_instances"
                      type="number"
                      value={formData.min_instances}
                      onChange={(e) => handleChange('min_instances', parseInt(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_instances">Max Instances</Label>
                    <Input
                      id="max_instances"
                      type="number"
                      value={formData.max_instances}
                      onChange={(e) => handleChange('max_instances', parseInt(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-3 mt-6 sticky bottom-0 bg-white py-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}