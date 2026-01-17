import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const REQUIREMENT_PRESETS = [
  { label: 'High Scalability', value: 'Must scale to handle millions of concurrent users' },
  { label: 'Low Latency', value: 'Requires sub-100ms response times globally' },
  { label: 'Cost Efficiency', value: 'Optimize for minimal infrastructure costs' },
  { label: 'High Availability', value: 'Must maintain 99.99% uptime with disaster recovery' },
  { label: 'Security First', value: 'Zero-trust architecture with end-to-end encryption' },
  { label: 'Real-time Processing', value: 'Process and respond to events in real-time' }
];

export default function AIGenerationPanel({ architectureId, open, onClose }) {
  const queryClient = useQueryClient();
  const [domainDescription, setDomainDescription] = useState('');
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [customRequirements, setCustomRequirements] = useState('');

  const generateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('generateArchitectureWithAI', {
        architecture_id: architectureId,
        domain_description: domainDescription,
        requirements: [...selectedRequirements, ...customRequirements.split('\n').filter(r => r.trim())]
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['services', architectureId] });
      queryClient.invalidateQueries({ queryKey: ['connections', architectureId] });
      setDomainDescription('');
      setSelectedRequirements([]);
      setCustomRequirements('');
      onClose();
    }
  });

  const toggleRequirement = (requirement) => {
    setSelectedRequirements(prev =>
      prev.includes(requirement)
        ? prev.filter(r => r !== requirement)
        : [...prev, requirement]
    );
  };

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
            AI Architecture Generator
          </DialogTitle>
          <DialogDescription>
            Describe your business domain and requirements. AI will generate an optimized microservices architecture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Domain Description */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Business Domain Description</label>
            <Textarea
              placeholder="e.g., Build a social media platform that allows users to share photos, follow friends, and engage with content in real-time..."
              value={domainDescription}
              onChange={(e) => setDomainDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">Be detailed about your platform's key features and user base.</p>
          </div>

          {/* Requirements */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Select Requirements</label>
            <div className="grid grid-cols-2 gap-2">
              {REQUIREMENT_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => toggleRequirement(preset.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedRequirements.includes(preset.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {selectedRequirements.includes(preset.value) && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{preset.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Requirements */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Additional Requirements (one per line)</label>
            <Textarea
              placeholder="• Must support multi-region deployment&#10;• PostgreSQL for main database&#10;• Kubernetes orchestration"
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              rows={4}
              className="resize-none text-xs"
            />
          </div>

          {/* Generation Status */}
          {generateMutation.isPending && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-sm text-blue-900">Generating architecture...</p>
                    <p className="text-xs text-blue-700">This may take a minute. AI is designing your microservices.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {generateMutation.isSuccess && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm text-green-900">Architecture generated!</p>
                    <p className="text-xs text-green-700">
                      {generateMutation.data?.data?.services_created} services and {generateMutation.data?.data?.connections_created} connections created.
                    </p>
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