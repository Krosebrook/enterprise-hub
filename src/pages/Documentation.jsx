import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Shield,
  GitBranch,
  Layers,
  FileCode,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
  Bot
} from 'lucide-react';
import PermissionGate from '../components/rbac/PermissionGate';

const docs = [
  {
    title: 'Documentation Policy',
    path: 'docs/DOC_POLICY.md',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: 'Documentation governance, provenance rules, and authority model',
    status: 'active'
  },
  {
    title: 'Documentation Authority Agent',
    path: 'docs/AGENTS_DOCUMENTATION_AUTHORITY.md',
    icon: Bot,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    description: 'System prompt for automated documentation maintenance',
    status: 'active'
  },
  {
    title: 'Security Architecture',
    path: 'docs/SECURITY.md',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50',
    description: 'Security architecture, threat model, RBAC, incident response',
    status: 'active'
  },
  {
    title: 'System Architecture',
    path: 'docs/ARCHITECTURE.md',
    icon: GitBranch,
    color: 'text-green-600',
    bg: 'bg-green-50',
    description: 'System architecture, modules, data flows, trust boundaries',
    status: 'active'
  },
  {
    title: 'Technology Framework',
    path: 'docs/FRAMEWORK.md',
    icon: Layers,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    description: 'Technology stack, LLM models, tooling, integrations',
    status: 'active'
  },
  {
    title: 'Changelog',
    path: 'docs/CHANGELOG.md',
    icon: FileCode,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    description: 'Version history following SemVer',
    status: 'active'
  }
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  outdated: { label: 'Needs Update', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = docs.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDoc = (path) => {
    // In a real implementation, this would open the doc from GitHub
    window.open(`https://github.com/YOUR_ORG/YOUR_REPO/blob/main/${path}`, '_blank');
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Documentation</h1>
            <p className="text-slate-500">Repository documentation with provenance tracking</p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200 mt-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Documentation Governance Active</p>
                <p className="text-blue-700">
                  All documentation follows evidence-bound writing with provenance tracking. 
                  The Documentation Authority Agent maintains accuracy and traceability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Documentation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredDocs.map((doc) => {
          const StatusIcon = statusConfig[doc.status].icon;
          return (
            <Card key={doc.path} className="hover:shadow-lg transition-all duration-200 group cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={`${doc.bg} p-3 rounded-lg`}>
                    <doc.icon className={`w-6 h-6 ${doc.color}`} />
                  </div>
                  <Badge className={statusConfig[doc.status].color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[doc.status].label}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{doc.description}</p>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-slate-50"
                  onClick={() => handleOpenDoc(doc.path)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Document
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agent Section */}
      <PermissionGate permission="agent.view">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Documentation Authority Agent</CardTitle>
                <p className="text-sm text-slate-500">Automated documentation maintenance with evidence-bound writing</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Provenance Tracking</p>
                  <p className="text-sm text-slate-600">Every claim includes source, locator, confidence level, and verification date</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Fail-Closed Design</p>
                  <p className="text-sm text-slate-600">Marks information as UNKNOWN when unverifiable, never invents content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Incremental Updates</p>
                  <p className="text-sm text-slate-600">Makes minimal changes unless full rewrite explicitly approved</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">ADR Supremacy</p>
                  <p className="text-sm text-slate-600">Architecture Decision Records are immutable and take precedence</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <Button variant="outline" className="w-full" onClick={() => window.open(base44.agents.getWhatsAppConnectURL('documentation_authority'), '_blank')}>
                <Bot className="w-4 h-4 mr-2" />
                Connect via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Documentation Standards */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Documentation Standards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-sm mb-3">Confidence Levels</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Badge className="bg-green-100 text-green-700">HIGH</Badge>
                  <span className="text-slate-600">Verified from code/config within 30 days</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700">MEDIUM</Badge>
                  <span className="text-slate-600">Inferred or verified 30-90 days ago</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-red-100 text-red-700">LOW</Badge>
                  <span className="text-slate-600">Single source, unverified, or &gt;90 days old</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-3">Required Documentation</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Security architecture and threat model
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  System architecture and data flows
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Technology stack and integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Version history (SemVer changelog)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}