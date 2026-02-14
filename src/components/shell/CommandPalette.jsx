import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  GitBranch,
  Bot,
  Shield,
  DollarSign,
  Activity,
  BookOpen,
  Zap,
  Users,
  FileText,
  Building2,
  Settings,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';

const pages = [
  { name: 'Dashboard', icon: Activity, path: 'Dashboard', group: 'Navigate' },
  { name: 'Architectures', icon: GitBranch, path: 'Architectures', group: 'Navigate' },
  { name: 'AI Agents', icon: Bot, path: 'Agents', group: 'Navigate' },
  { name: 'Service Catalog', icon: Building2, path: 'ServiceCatalog', group: 'Navigate' },
  { name: 'Developer Hub', icon: BookOpen, path: 'DeveloperHub', group: 'Navigate' },
  { name: 'Playbooks', icon: Zap, path: 'Playbooks', group: 'Navigate' },
  { name: 'Compliance', icon: Shield, path: 'Compliance', group: 'Navigate' },
  { name: 'Cost Management', icon: DollarSign, path: 'Costs', group: 'Navigate' },
  { name: 'Observability', icon: Activity, path: 'Observability', group: 'Navigate' },
  { name: 'Policies', icon: Shield, path: 'Policies', group: 'Navigate' },
  { name: 'Users', icon: Users, path: 'Users', group: 'Navigate' },
  { name: 'Audit Log', icon: FileText, path: 'AuditLog', group: 'Navigate' },
  { name: 'Documentation', icon: BookOpen, path: 'Documentation', group: 'Navigate' },
];

const actions = [
  { name: 'New Architecture', icon: Plus, path: 'ArchitectureDesigner', group: 'Create' },
  { name: 'Create Agent', icon: Plus, path: 'AgentCreate', group: 'Create' },
  { name: 'Define Policy', icon: Plus, path: 'PolicyCreate', group: 'Create' },
  { name: 'Generate with AI', icon: Sparkles, path: 'ArchitectureDesigner', group: 'Create' },
];

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const runCommand = useCallback((command) => {
    onOpenChange(false);
    navigate(createPageUrl(command));
  }, [navigate, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or jump to..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigate">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => runCommand(page.path)}
              className="flex items-center gap-2"
            >
              <page.icon className="w-4 h-4" />
              <span>{page.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Create">
          {actions.map((action) => (
            <CommandItem
              key={action.path}
              onSelect={() => runCommand(action.path)}
              className="flex items-center gap-2"
            >
              <action.icon className="w-4 h-4" />
              <span>{action.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}