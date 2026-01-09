import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock, CheckCircle, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function VersionHistory({ architecture, open, onClose }) {
  const [showCreateVersion, setShowCreateVersion] = React.useState(false);
  const [versionNotes, setVersionNotes] = React.useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: versions = [] } = useQuery({
    queryKey: ['architecture-versions', architecture?.name],
    queryFn: () => base44.entities.Architecture.filter({ 
      name: architecture.name,
      organization_id: architecture.organization_id 
    }),
    enabled: !!architecture,
    select: (data) => data.sort((a, b) => b.version - a.version)
  });

  const createVersionMutation = useMutation({
    mutationFn: async () => {
      // Get current architecture data
      const services = await base44.entities.Service.filter({ 
        architecture_id: architecture.id 
      });
      const connections = await base44.entities.ServiceConnection.filter({ 
        architecture_id: architecture.id 
      });

      // Mark current as not latest
      await base44.entities.Architecture.update(architecture.id, { 
        is_latest: false 
      });

      // Create new version
      const { id, created_date, updated_date, created_by, ...archData } = architecture;
      const newArch = await base44.entities.Architecture.create({
        ...archData,
        version: architecture.version + 1,
        parent_version_id: architecture.id,
        version_notes: versionNotes,
        is_latest: true,
        status: 'draft'
      });

      // Copy services and connections
      const serviceIdMap = new Map();
      for (const service of services) {
        const { id: oldId, created_date, updated_date, created_by, ...svcData } = service;
        const newService = await base44.entities.Service.create({
          ...svcData,
          architecture_id: newArch.id
        });
        serviceIdMap.set(oldId, newService.id);
      }

      for (const conn of connections) {
        const { id, created_date, updated_date, created_by, ...connData } = conn;
        await base44.entities.ServiceConnection.create({
          ...connData,
          architecture_id: newArch.id,
          source_service_id: serviceIdMap.get(conn.source_service_id),
          target_service_id: serviceIdMap.get(conn.target_service_id)
        });
      }

      return newArch;
    },
    onSuccess: (newArch) => {
      queryClient.invalidateQueries({ queryKey: ['architecture-versions'] });
      queryClient.invalidateQueries({ queryKey: ['architectures'] });
      setShowCreateVersion(false);
      setVersionNotes('');
      navigate(createPageUrl(`ArchitectureDesigner?id=${newArch.id}`));
    }
  });

  const switchToVersionMutation = useMutation({
    mutationFn: (versionId) => {
      navigate(createPageUrl(`ArchitectureDesigner?id=${versionId}`));
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setShowCreateVersion(true)}
              className="w-full"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Create New Version
            </Button>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {versions.map((version) => (
                <div 
                  key={version.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">v{version.version}</span>
                      {version.is_latest && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Latest
                        </Badge>
                      )}
                      {version.id === architecture?.id && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </div>
                    <Badge className="capitalize" variant="outline">
                      {version.status}
                    </Badge>
                  </div>

                  {version.version_notes && (
                    <p className="text-sm text-slate-600 mb-3">
                      {version.version_notes}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(version.created_date), 'MMM d, yyyy HH:mm')}
                    </div>
                    <div>{version.services_count || 0} services</div>
                  </div>

                  {version.id !== architecture?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => switchToVersionMutation.mutate(version.id)}
                    >
                      Switch to this version
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateVersion} onOpenChange={setShowCreateVersion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              Creating v{architecture?.version + 1} from v{architecture?.version}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Version Notes</label>
              <Textarea
                placeholder="Describe the changes in this version..."
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateVersion(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => createVersionMutation.mutate()}
              disabled={createVersionMutation.isPending}
              className="flex-1"
            >
              {createVersionMutation.isPending ? (
                <Copy className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Create Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}