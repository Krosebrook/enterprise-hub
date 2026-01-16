import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Available models per provider
const modelProviders = {
  openai: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  google: ['gemini-pro', 'gemini-pro-vision'],
  meta: ['llama-3-70b', 'llama-3-8b']
};

export default function AgentModelSettings({ formData, onChange }) {
  // Handle provider change and auto-select first available model
  const handleProviderChange = (provider) => {
    onChange('model_provider', provider);
    onChange('model_name', modelProviders[provider][0]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Configuration</CardTitle>
        <CardDescription>Choose the AI model that powers your agent</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider and Model Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select 
              value={formData.model_provider} 
              onValueChange={handleProviderChange}
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
              onValueChange={(value) => onChange('model_name', value)}
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

        {/* Temperature Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-slate-500">{formData.temperature}</span>
          </div>
          <Slider
            value={[formData.temperature]}
            onValueChange={([value]) => onChange('temperature', value)}
            min={0}
            max={2}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Lower = more focused, Higher = more creative
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label htmlFor="max_tokens">Max Tokens</Label>
          <Input
            id="max_tokens"
            type="number"
            value={formData.max_tokens}
            onChange={(e) => onChange('max_tokens', parseInt(e.target.value))}
            min={100}
            max={32000}
          />
          <p className="text-xs text-slate-500">
            Maximum length of the response
          </p>
        </div>
      </CardContent>
    </Card>
  );
}