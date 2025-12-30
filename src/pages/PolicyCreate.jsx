import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ArrowLeft,
  Save,
  Shield,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PermissionGate from '../components/rbac/PermissionGate';

const categoryIcons = {
  security: Shield,
  cost: DollarSign,
  quality: CheckCircle,
  compliance: Shield
};

export default function PolicyCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [policyId, setPolicyId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'security',
    severity: 'medium',
    enforcement_level: 'warn',
    scope: 'global',
    rule_type: 'threshold',
    rule_config: {},
    is_active: true,
    change_summary: ''
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setPolicyId(id);
  }, []);

  const { data: existingPolicy } = useQuery({
    queryKey: ['policy', policyId],
    queryFn: () => base44.entities.Policy.filter({ id: policyId }),
    enabled: !!policyId,
    select: (data) => data[0]
  });

  useEffect(() => {
    if (existingPolicy) {
      setFormData({
        name: existingPolicy.name || '',
        description: existingPolicy.description || '',
        category: existingPolicy.category || 'security',
        severity: existingPolicy.severity || 'medium',
        enforcement_level: existingPolicy.enforcement_level || 'warn',
        scope: existingPolicy.scope || 'global',
        rule_type: existingPolicy.rule_type || 'threshold',
        rule_config: existingPolicy.rule_config || {},
        is_active: existingPolicy.is_active ?? true,
        change_summary: ''
      });
    }
  }, [existingPolicy]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Policy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      navigate(createPageUrl('Policies'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Create new version
      const newVersion = {
        ...data,
        version: (existingPolicy?.version || 0) + 1,
        previous_version_id: id
      };
      await base44.entities.Policy.create(newVersion);
      // Deactivate old version
      await base44.entities.Policy.update(id, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      navigate(createPageUrl('Policies'));
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (policyId) {
      updateMutation.mutate({ id: policyId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PermissionGate permission="policy.create" showError>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Policies')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {policyId ? 'Edit Policy' : 'Create New Policy'}
                </h1>
                <p className="text-sm text-slate-500">
                  Define rules and enforcement levels
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate(createPageUrl('Policies'))}
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
                {policyId ? 'Save Changes' : 'Create Policy'}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 lg:p-8">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="enforcement">Enforcement</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Policy Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Maximum Monthly Budget"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What does this policy enforce?"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="cost">Cost</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select 
                        value={formData.severity} 
                        onValueChange={(value) => handleChange('severity', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Scope</Label>
                    <Select 
                      value={formData.scope} 
                      onValueChange={(value) => handleChange('scope', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="architecture">Architecture</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="cost">Cost</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {policyId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Version Control</CardTitle>
                    <CardDescription>This will create a new version of the policy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="change_summary">Change Summary</Label>
                      <Textarea
                        id="change_summary"
                        placeholder="Describe what changed in this version..."
                        value={formData.change_summary}
                        onChange={(e) => handleChange('change_summary', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Rules</CardTitle>
                  <CardDescription>Define the conditions and thresholds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select 
                      value={formData.rule_type} 
                      onValueChange={(value) => handleChange('rule_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="threshold">Threshold</SelectItem>
                        <SelectItem value="approval_required">Approval Required</SelectItem>
                        <SelectItem value="forbidden">Forbidden</SelectItem>
                        <SelectItem value="mandatory">Mandatory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      Rule configuration editor coming soon. Define JSON-based rules for complex conditions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enforcement Tab */}
            <TabsContent value="enforcement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enforcement Settings</CardTitle>
                  <CardDescription>How should violations be handled?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enforcement Level</Label>
                    <Select 
                      value={formData.enforcement_level} 
                      onValueChange={(value) => handleChange('enforcement_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Block</p>
                              <p className="text-xs text-slate-500">Prevent action completely</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="warn">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Warn</p>
                              <p className="text-xs text-slate-500">Show warning, allow with confirmation</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="audit_only">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Audit Only</p>
                              <p className="text-xs text-slate-500">Log violation, don't block</p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Policy Enforcement</p>
                        <p className="text-sm text-blue-700 mt-1">
                          {formData.enforcement_level === 'block' && 'Actions that violate this policy will be completely blocked.'}
                          {formData.enforcement_level === 'warn' && 'Users will see a warning but can proceed with proper justification.'}
                          {formData.enforcement_level === 'audit_only' && 'Violations will be logged for audit purposes only.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGate>
  );
}