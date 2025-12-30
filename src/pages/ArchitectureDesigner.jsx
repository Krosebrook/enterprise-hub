import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ArrowLeft,
  Plus,
  Save,
  CheckCircle,
  Code,
  Rocket,
  ZoomIn,
  ZoomOut,
  Maximize,
  Database,
  Server,
  MessageSquare,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ServiceCard from '../components/architecture/ServiceCard';
import ServicePropertiesPanel from '../components/architecture/ServicePropertiesPanel';
import CodeGenerationDialog from '../components/architecture/CodeGenerationDialog';

const servicePalette = [
  { type: 'api', label: 'API Service', icon: Server, color: 'bg-blue-500' },
  { type: 'database', label: 'Database', icon: Database, color: 'bg-green-500' },
  { type: 'queue', label: 'Message Queue', icon: MessageSquare, color: 'bg-yellow-500' },
];

export default function ArchitectureDesigner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  
  const [architectureId, setArchitectureId] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newArchitecture, setNewArchitecture] = useState({
    name: '',
    description: '',
    template_type: 'blank'
  });
  const [selectedService, setSelectedService] = useState(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setArchitectureId(id);
    } else {
      setShowCreateDialog(true);
    }
  }, []);

  const { data: architecture, isLoading: archLoading } = useQuery({
    queryKey: ['architecture', architectureId],
    queryFn: () => base44.entities.Architecture.filter({ id: architectureId }),
    enabled: !!architectureId,
    select: (data) => data[0]
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', architectureId],
    queryFn: () => base44.entities.Service.filter({ architecture_id: architectureId }),
    enabled: !!architectureId,
    initialData: []
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['connections', architectureId],
    queryFn: () => base44.entities.ServiceConnection.filter({ architecture_id: architectureId }),
    enabled: !!architectureId,
    initialData: []
  });

  const createArchitectureMutation = useMutation({
    mutationFn: (data) => base44.entities.Architecture.create(data),
    onSuccess: (data) => {
      setArchitectureId(data.id);
      setShowCreateDialog(false);
      window.history.replaceState(null, '', createPageUrl(`ArchitectureDesigner?id=${data.id}`));
      queryClient.invalidateQueries({ queryKey: ['architectures'] });
    }
  });

  const updateArchitectureMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Architecture.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architecture', architectureId] });
    }
  });

  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', architectureId] });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', architectureId] });
      setShowPropertiesPanel(false);
      setSelectedService(null);
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', architectureId] });
      setSelectedService(null);
      setShowPropertiesPanel(false);
    }
  });

  const handleCreateArchitecture = () => {
    if (!newArchitecture.name.trim()) return;
    createArchitectureMutation.mutate({
      ...newArchitecture,
      status: 'draft',
      canvas_data: { nodes: [], edges: [] }
    });
  };

  const handleAddService = () => {
    const newService = {
      architecture_id: architectureId,
      name: `Service ${services.length + 1}`,
      language: 'nodejs',
      framework: 'Express',
      database_type: 'none',
      has_api: true,
      api_type: 'rest',
      port: 8080 + services.length,
      health_status: 'unknown',
      canvas_position_x: 150 + (services.length * 50) % 400,
      canvas_position_y: 100 + Math.floor(services.length / 3) * 200
    };
    createServiceMutation.mutate(newService);
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowPropertiesPanel(true);
  };

  const handleServiceDragEnd = (service, e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - 100);
    const y = Math.max(0, e.clientY - rect.top - 65);
    
    updateServiceMutation.mutate({
      id: service.id,
      data: {
        canvas_position_x: x,
        canvas_position_y: y
      }
    });
  };

  const handleSaveService = (serviceData) => {
    if (serviceData.id) {
      updateServiceMutation.mutate({
        id: serviceData.id,
        data: serviceData
      });
    } else {
      createServiceMutation.mutate({
        ...serviceData,
        architecture_id: architectureId
      });
    }
  };

  const handleValidate = async () => {
    setIsSaving(true);
    await updateArchitectureMutation.mutateAsync({
      id: architectureId,
      data: { 
        status: 'validated',
        services_count: services.length
      }
    });
    setIsSaving(false);
  };

  const handleGenerate = async () => {
    setIsSaving(true);
    await updateArchitectureMutation.mutateAsync({
      id: architectureId,
      data: { status: 'generated' }
    });
    setIsSaving(false);
    setShowCodeDialog(true);
  };

  if (archLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Architectures')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {architecture?.name || 'New Architecture'}
            </h1>
            <p className="text-sm text-slate-500">
              {architecture?.description || 'Design your microservices architecture'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleValidate}
            disabled={isSaving || services.length === 0}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Validate
          </Button>
          <Button 
            variant="outline"
            onClick={handleGenerate}
            disabled={isSaving || architecture?.status === 'draft'}
          >
            <Code className="w-4 h-4 mr-2" />
            Generate Code
          </Button>
          <Button 
            className="bg-slate-900 hover:bg-slate-800"
            disabled={architecture?.status !== 'generated'}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Palette */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-6">
          {/* Services Palette */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Services
            </h3>
            <div className="space-y-2">
              {servicePalette.map((item) => (
                <button
                  key={item.type}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  onClick={handleAddService}
                >
                  <div className={`${item.color} text-white p-2 rounded`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Tools
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setZoom(1)}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-auto">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Services</span>
                    <span className="font-medium">{services.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Connections</span>
                    <span className="font-medium">{connections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium capitalize">{architecture?.status || 'draft'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 bg-slate-100 relative overflow-auto"
          style={{
            backgroundImage: `
              radial-gradient(circle, #d1d5db 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        >
          <div 
            className="min-h-full min-w-full relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              minWidth: '2000px',
              minHeight: '1500px'
            }}
          >
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedService?.id === service.id}
                onClick={() => handleServiceClick(service)}
                onDragEnd={(e) => handleServiceDragEnd(service, e)}
              />
            ))}

            {services.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Plus className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No services yet</h3>
                  <p className="text-slate-500 mb-4">Click on a service type to add it to your architecture</p>
                  <Button onClick={handleAddService}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Service
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {showPropertiesPanel && selectedService && (
        <ServicePropertiesPanel
          service={selectedService}
          onSave={handleSaveService}
          onClose={() => {
            setShowPropertiesPanel(false);
            setSelectedService(null);
          }}
        />
      )}

      {/* Code Generation Dialog */}
      <CodeGenerationDialog
        open={showCodeDialog}
        onClose={() => setShowCodeDialog(false)}
        architecture={architecture}
        services={services}
      />

      {/* Create Architecture Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Architecture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., E-commerce Platform v2"
                value={newArchitecture.name}
                onChange={(e) => setNewArchitecture(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your architecture..."
                value={newArchitecture.description}
                onChange={(e) => setNewArchitecture(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select 
                value={newArchitecture.template_type} 
                onValueChange={(value) => setNewArchitecture(prev => ({ ...prev, template_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank Canvas</SelectItem>
                  <SelectItem value="e-commerce">E-commerce</SelectItem>
                  <SelectItem value="saas">SaaS Platform</SelectItem>
                  <SelectItem value="iot">IoT System</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="fintech">Fintech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(createPageUrl('Architectures'))} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateArchitecture}
              disabled={!newArchitecture.name.trim() || createArchitectureMutation.isPending}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {createArchitectureMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}