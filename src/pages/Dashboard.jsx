import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  GitBranch, 
  Bot, 
  Shield, 
  Plus, 
  Sparkles, 
  FileBarChart,
  ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import MetricCard from '../components/dashboard/MetricCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import PermissionGate from '../components/rbac/PermissionGate';
import { getRoleName, getRoleColor } from '../components/rbac/rbacUtils';
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log('User not logged in');
    }
  };

  const { data: architectures = [] } = useQuery({
    queryKey: ['architectures'],
    queryFn: () => base44.entities.Architecture.list('-created_date', 10),
    initialData: []
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list('-created_date', 10),
    initialData: []
  });

  const { data: complianceFrameworks = [] } = useQuery({
    queryKey: ['compliance-frameworks'],
    queryFn: () => base44.entities.ComplianceFramework.list(),
    initialData: []
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 10),
    initialData: []
  });

  const activeArchitectures = architectures.filter(a => a.status !== 'archived').length;
  const deployedAgents = agents.filter(a => a.status === 'deployed').length;
  
  const enabledFrameworks = complianceFrameworks.filter(f => f.is_enabled);
  const avgComplianceScore = enabledFrameworks.length > 0
    ? Math.round(enabledFrameworks.reduce((sum, f) => sum + (f.compliance_score || 0), 0) / enabledFrameworks.length)
    : 0;

  return (
    <div 
      className="p-6 lg:p-8 max-w-7xl mx-auto"
      data-b44-sync="page-dashboard"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Here's what's happening with your organization
            </p>
          </div>
          {user?.role && (
            <Badge className={getRoleColor(user.role)}>
              {getRoleName(user.role)}
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        data-b44-sync="metrics-grid"
      >
        <MetricCard
          title="Active Architectures"
          value={activeArchitectures}
          trend={{ direction: 'up', value: 3, label: 'from last month' }}
          icon={GitBranch}
          color="blue"
        />
        <MetricCard
          title="Deployed Agents"
          value={deployedAgents}
          trend={{ direction: 'up', value: 2, label: 'from last month' }}
          icon={Bot}
          color="purple"
        />
        <MetricCard
          title="Compliance Score"
          value={`${avgComplianceScore}%`}
          trend={{ direction: 'up', value: 5, percent: true, label: 'this week' }}
          icon={Shield}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Link to={createPageUrl('Activity')}>
              <Button variant="ghost" size="sm" className="text-slate-500">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} maxItems={5} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="space-y-4">
            <PermissionGate permission="architecture.create">
              <QuickActionCard
                title="New Architecture"
                description="Design a new microservices architecture"
                icon={Plus}
                href="ArchitectureDesigner"
                color="blue"
              />
            </PermissionGate>
            <PermissionGate permission="agent.create">
              <QuickActionCard
                title="Train Agent"
                description="Create or train an AI agent"
                icon={Sparkles}
                href="AgentCreate"
                color="purple"
              />
            </PermissionGate>
            <QuickActionCard
              title="View Reports"
              description="Generate compliance and cost reports"
              icon={FileBarChart}
              href="Reports"
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Recent Architectures */}
      {architectures.length > 0 && (
        <Card className="mt-8 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Architectures</CardTitle>
            <Link to={createPageUrl('Architectures')}>
              <Button variant="ghost" size="sm" className="text-slate-500">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {architectures.slice(0, 3).map((arch) => (
                <Link
                  key={arch.id}
                  to={createPageUrl(`ArchitectureDesigner?id=${arch.id}`)}
                  className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{arch.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {arch.description || 'No description'}
                      </p>
                    </div>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${arch.status === 'deployed' ? 'bg-green-100 text-green-700' : ''}
                      ${arch.status === 'draft' ? 'bg-slate-100 text-slate-700' : ''}
                      ${arch.status === 'validated' ? 'bg-blue-100 text-blue-700' : ''}
                      ${arch.status === 'generated' ? 'bg-purple-100 text-purple-700' : ''}
                    `}>
                      {arch.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>{arch.services_count || 0} services</span>
                    <span>{arch.template_type || 'blank'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}