import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Package, TrendingUp, Shield, DollarSign, Edit, Trash2, Search } from 'lucide-react';

const CATEGORIES = ['api', 'database', 'messaging', 'authentication', 'storage', 'caching', 'search', 'analytics', 'payment', 'notification'];

export default function ServiceCatalogPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'api',
    language: 'nodejs',
    framework: '',
    database_type: 'none',
    api_type: 'rest',
    cost_profile: { monthly_base_cost: 50, cost_tier: 'medium' },
    performance_profile: { avg_latency_ms: 100, performance_tier: 'medium' },
    security_profile: { auth_methods: ['jwt'], security_tier: 'standard', encryption_at_rest: true, encryption_in_transit: true },
    tags: []
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['serviceCatalog'],
    queryFn: () => base44.entities.ServiceCatalog.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceCatalog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceCatalog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
      setEditingItem(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceCatalog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'api',
      language: 'nodejs',
      framework: '',
      database_type: 'none',
      api_type: 'rest',
      cost_profile: { monthly_base_cost: 50, cost_tier: 'medium' },
      performance_profile: { avg_latency_ms: 100, performance_tier: 'medium' },
      security_profile: { auth_methods: ['jwt'], security_tier: 'standard', encryption_at_rest: true, encryption_in_transit: true },
      tags: []
    });
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowCreateDialog(true);
  };

  const filteredCatalog = catalog.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTierColor = (tier) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      ultra: 'bg-purple-100 text-purple-700',
      basic: 'bg-slate-100 text-slate-700',
      standard: 'bg-blue-100 text-blue-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[tier] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Service Catalog
          </h1>
          <p className="text-slate-600">Manage reusable microservice templates</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Catalog Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Catalog Items */}
      <div className="grid grid-cols-3 gap-4">
        {filteredCatalog.map(item => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <Badge className="mt-2 capitalize">{item.category}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-600">{item.description}</p>
              
              <div className="flex gap-2 text-xs">
                <Badge variant="outline">{item.language}</Badge>
                {item.framework && <Badge variant="outline">{item.framework}</Badge>}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-green-600" />
                  <Badge className={getTierColor(item.cost_profile?.cost_tier)}>
                    {item.cost_profile?.cost_tier || 'N/A'}
                  </Badge>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <Badge className={getTierColor(item.performance_profile?.performance_tier)}>
                    {item.performance_profile?.performance_tier || 'N/A'}
                  </Badge>
                </div>
                <div className="text-center">
                  <Shield className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                  <Badge className={getTierColor(item.security_profile?.security_tier)}>
                    {item.security_profile?.security_tier || 'N/A'}
                  </Badge>
                </div>
              </div>

              {item.usage_count > 0 && (
                <p className="text-xs text-slate-500 text-center pt-2 border-t">
                  Used {item.usage_count} times
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Create'} Catalog Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Authentication Service"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="nodejs">Node.js</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="java">Java</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Framework</label>
                <Input
                  value={formData.framework}
                  onChange={(e) => setFormData({...formData, framework: e.target.value})}
                  placeholder="e.g., Express, FastAPI"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Cost Tier</label>
                <select
                  value={formData.cost_profile?.cost_tier}
                  onChange={(e) => setFormData({
                    ...formData,
                    cost_profile: {...formData.cost_profile, cost_tier: e.target.value}
                  })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Performance Tier</label>
                <select
                  value={formData.performance_profile?.performance_tier}
                  onChange={(e) => setFormData({
                    ...formData,
                    performance_profile: {...formData.performance_profile, performance_tier: e.target.value}
                  })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Security Tier</label>
                <select
                  value={formData.security_profile?.security_tier}
                  onChange={(e) => setFormData({
                    ...formData,
                    security_profile: {...formData.security_profile, security_tier: e.target.value}
                  })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingItem(null); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name} className="flex-1">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}