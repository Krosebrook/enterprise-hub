import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, Clock, CheckCircle, Copy, RotateCcw, GitCompare } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function VersionHistory({ architecture, open, onClose }) {
  const [showCreateVersion, setShowCreateVersion] = React.useState(false);
  const [versionNotes, setVersionNotes] = React.useState("");
  const [compareV1, setCompareV1] = React.useState(null);
  const [compareV2, setCompareV2] = React.useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: versions = [] } = useQuery({
    queryKey: ["architecture-versions", architecture?.name],
    queryFn: () =>
      base44.entities.Architecture.filter({
        name: architecture.name,
        organization_id: architecture.organization_id,
      }),
    enabled: !!architecture,
    select: (data) => data.sort((a, b) => b.version - a.version),
  });

  const createVersionMutation = useMutation({
    mutationFn: async () => {
      const services = await base44.entities.Service.filter({
        architecture_id: architecture.id,
      });
      const connections = await base44.entities.ServiceConnection.filter({
        architecture_id: architecture.id,
      });

      await base44.entities.Architecture.update(architecture.id, {
        is_latest: false,
      });

      const { id, created_date, updated_date, created_by, ...archData } = architecture;
      const newArch = await base44.entities.Architecture.create({
        ...archData,
        version: architecture.version + 1,
        parent_version_id: architecture.id,
        version_notes: versionNotes,
        is_latest: true,
        status: "draft",
      });

      const serviceIdMap = new Map();
      for (const service of services) {
        const { id: oldId, created_date, updated_date, created_by, ...svcData } = service;
        const newService = await base44.entities.Service.create({
          ...svcData,
          architecture_id: newArch.id,
        });
        serviceIdMap.set(oldId, newService.id);
      }

      for (const conn of connections) {
        const { id, created_date, updated_date, created_by, ...connData } = conn;
        await base44.entities.ServiceConnection.create({
          ...connData,
          architecture_id: newArch.id,
          source_service_id: serviceIdMap.get(conn.source_service_id),
          target_service_id: serviceIdMap.get(conn.target_service_id),
        });
      }

      return newArch;
    },
    onSuccess: (newArch) => {
      queryClient.invalidateQueries({ queryKey: ["architecture-versions"] });
      queryClient.invalidateQueries({ queryKey: ["architectures"] });
      setShowCreateVersion(false);
      setVersionNotes("");
      navigate(createPageUrl(`ArchitectureDesigner?id=${newArch.id}`));
    },
  });

  const switchToVersionMutation = useMutation({
    mutationFn: async (versionId) => {
      const targetVersion = versions.find(v => v.id === versionId);
      if (!targetVersion) return;
      
      const targetServices = await base44.entities.Service.filter({ architecture_id: versionId });
      const targetConnections = await base44.entities.ServiceConnection.filter({ architecture_id: versionId });
      
      await base44.entities.Architecture.update(architecture.id, {
        status: architecture.status,
        version: architecture.version + 1,
        parent_version_id: versionId,
        version_notes: `Reverted to version ${targetVersion.version}`
      });
      
      for (const svc of targetServices) {
        const { id, created_date, updated_date, created_by, ...svcData } = svc;
        await base44.entities.Service.create({
          ...svcData,
          architecture_id: architecture.id,
        });
      }
      
      for (const conn of targetConnections) {
        const { id, created_date, updated_date, created_by, ...connData } = conn;
        await base44.entities.ServiceConnection.create({
          ...connData,
          architecture_id: architecture.id,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['architecture', architecture.id] });
      queryClient.invalidateQueries({ queryKey: ['services', architecture.id] });
      queryClient.invalidateQueries({ queryKey: ["architecture-versions"] });
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Version History & Comparison
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="versions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="space-y-4">
              <Button onClick={() => setShowCreateVersion(true)} className="w-full">
                <GitBranch className="w-4 h-4 mr-2" />
                Create New Version
              </Button>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {versions.map((version) => (
                  <Card key={version.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">v{version.version}</span>
                          {version.is_latest && (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Latest
                            </Badge>
                          )}
                          {version.id === architecture?.id && <Badge variant="outline">Current</Badge>}
                        </div>
                        <Badge className="capitalize" variant="outline">
                          {version.status}
                        </Badge>
                      </div>

                      {version.version_notes && (
                        <p className="text-sm text-slate-600 mb-3">{version.version_notes}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(version.created_date), "MMM d, yyyy HH:mm")}
                        </div>
                        <div>{version.services_count || 0} services</div>
                      </div>

                      <div className="flex gap-2">
                        {version.id !== architecture?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => switchToVersionMutation.mutate(version.id)}
                            disabled={switchToVersionMutation.isPending}
                            className="flex-1"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCompareV1(version.id);
                            setCompareV2(null);
                          }}
                          className="flex-1"
                        >
                          <GitCompare className="w-3 h-3 mr-1" />
                          Compare
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compare" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Version 1</label>
                  <select
                    value={compareV1 || ''}
                    onChange={(e) => setCompareV1(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Select version...</option>
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>
                        v{v.version} {v.is_latest ? '(Latest)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Version 2</label>
                  <select
                    value={compareV2 || ''}
                    onChange={(e) => setCompareV2(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Select version...</option>
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>
                        v{v.version} {v.is_latest ? '(Latest)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {compareV1 && compareV2 && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-xs font-medium text-slate-700">📊 Comparison</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Comparing v{versions.find(v => v.id === compareV1)?.version} ↔️ v{versions.find(v => v.id === compareV2)?.version}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-xs font-medium text-green-700">✓ Services Comparison</p>
                      <p className="text-xs text-green-600 mt-1">Service count, languages, and configurations</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-700">🔄 Connection Changes</p>
                      <p className="text-xs text-blue-600 mt-1">Dependencies and interaction patterns</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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