import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, CheckCircle2, Code, Database, DollarSign } from 'lucide-react';

export default function AdvancedAIGenerationPanel({ architectureId, open, onClose }) {
  const queryClient = useQueryClient();
  const [domainDescription, setDomainDescription] = useState('');
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [includeFeatures, setIncludeFeatures] = useState({
    openapi: true,
    migrations: true,
    cost_estimation: true
  });
  const [cloudProviders, setCloudProviders] = useState(['aws', 'gcp']);

  const generateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('generateAdvancedArchitecture', {
        architecture_id: architectureId,
        domain_description: domainDescription,
        requirements: selectedRequirements,
        include_openapi: includeFeatures.openapi,
        include_migrations: includeFeatures.migrations,
        include_cost_estimation: includeFeatures.cost_estimation,
        cloud_providers: cloudProviders
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', architectureId] });
      queryClient.invalidateQueries({ queryKey: ['costEstimates'] });
      setDomainDescription('');
      setSelectedRequirements([]);
      onClose();
    }
  });

  const handleGenerate = () => {
    if (!domainDescription.trim()) {
      alert('Please describe your business domain');
      return;
    }
    generateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Advanced Architecture Generation
          </DialogTitle>
          <DialogDescription>
            Generate architecture with OpenAPI specs, migration strategies, and cost estimates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Domain Description */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Business Domain</label>
            <Textarea
              placeholder="Describe your platform features, user base, and key requirements..."
              value={domainDescription}
              onChange={(e) => setDomainDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Advanced Features */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Include in Generation</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <Checkbox
                  checked={includeFeatures.openapi}
                  onCheckedChange={(checked) => setIncludeFeatures({...includeFeatures, openapi: checked})}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="font-medium">OpenAPI 3.0 Specifications</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Generates detailed API contracts for each service</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <Checkbox
                  checked={includeFeatures.migrations}
                  onCheckedChange={(checked) => setIncludeFeatures({...includeFeatures, migrations: checked})}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span className="font-medium">Database Migration Strategies</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Blue-green, canary, or rolling deployment plans</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <Checkbox
                  checked={includeFeatures.cost_estimation}
                  onCheckedChange={(checked) => setIncludeFeatures({...includeFeatures, cost_estimation: checked})}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">Cloud Cost Estimation</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Estimates across AWS, GCP, and Azure</p>
                </div>
              </label>
            </div>
          </div>

          {/* Cloud Providers (if cost estimation enabled) */}
          {includeFeatures.cost_estimation && (
            <div>
              <label className="text-sm font-semibold mb-3 block">Cloud Providers</label>
              <div className="space-y-2">
                {['aws', 'gcp', 'azure'].map(provider => (
                  <label key={provider} className="flex items-center gap-2">
                    <Checkbox
                      checked={cloudProviders.includes(provider)}
                      onCheckedChange={(checked) => {
                        setCloudProviders(prev =>
                          checked ? [...prev, provider] : prev.filter(p => p !== provider)
                        );
                      }}
                    />
                    <span className="text-sm capitalize">{provider}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Generation Status */}
          {generateMutation.isPending && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-sm text-blue-900">Generating advanced architecture...</p>
                    <p className="text-xs text-blue-700">Processing specifications and estimates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {generateMutation.isSuccess && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-green-900">Architecture generated successfully!</p>
                    <div className="mt-2 space-y-1 text-xs text-green-700">
                      {generateMutation.data?.data?.services_created && (
                        <p>✓ {generateMutation.data.data.services_created} services created</p>
                      )}
                      {includeFeatures.openapi && (
                        <p>✓ OpenAPI specs generated</p>
                      )}
                      {includeFeatures.migrations && (
                        <p>✓ Migration strategies planned</p>
                      )}
                      {includeFeatures.cost_estimation && (
                        <p>✓ Cost estimates available</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !domainDescription.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Architecture
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}