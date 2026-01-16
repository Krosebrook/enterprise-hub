import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, MessageSquare, BarChart3, Workflow, Code } from 'lucide-react';

// Template configuration with icons and styling
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

// Default system prompts for each template type
export const templatePrompts = {
  customer_support: 'You are a helpful customer support agent. Be friendly, professional, and concise. If you cannot resolve an issue, politely offer to escalate to a human agent.',
  data_analysis: 'You are a data analysis assistant. Help users understand their data, create visualizations, and derive insights. Be precise and explain your reasoning.',
  workflow_automation: 'You are a workflow automation assistant. Help users automate repetitive tasks, create efficient processes, and optimize their workflows.',
  code_assistant: 'You are a coding assistant. Help users write, debug, and optimize code. Explain your suggestions clearly and follow best practices.'
};

export default function TemplateSelector({ selectedTemplate, onSelect }) {
  return (
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
              onClick={() => onSelect(template.id)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${selectedTemplate === template.id 
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
  );
}