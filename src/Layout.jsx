import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  GitBranch,
  Bot,
  Shield,
  Activity,
  Settings,
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Building2,
  User,
  Users as UsersIcon,
  BookOpen,
  FileText,
  Zap,
  HelpCircle,
  Command,
} from "lucide-react";
import CommandPalette from "@/components/shell/CommandPalette";
import KeyboardShortcuts from "@/components/shell/KeyboardShortcuts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getRoleName, getRoleColor } from "./components/rbac/rbacUtils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigationGroups = [
  {
    label: "Create",
    items: [
      { name: "Architectures", href: "Architectures", icon: GitBranch },
      { name: "AI Agents", href: "Agents", icon: Bot },
      { name: "Service Catalog", href: "ServiceCatalog", icon: Building2 },
    ]
  },
  {
    label: "Operate",
    items: [
      { name: "Developer Hub", href: "DeveloperHub", icon: BookOpen },
      { name: "Observability", href: "Observability", icon: Activity },
      { name: "Playbooks", href: "Playbooks", icon: Zap },
    ]
  },
  {
    label: "Govern",
    items: [
      { name: "Policies", href: "Policies", icon: Shield },
      { name: "Compliance", href: "Compliance", icon: Shield },
      { name: "Users", href: "Users", icon: UsersIcon },
      { name: "Audit Log", href: "AuditLog", icon: FileText },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadUser();
    
    const handleKeyDown = (e) => {
      if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log("User not logged in");
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const NavLinks = ({ mobile = false }) => (
    <nav className={mobile ? "flex flex-col gap-6" : "flex flex-col gap-6 px-3"}>
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {group.label}
            </span>
          </div>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-slate-200">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 tracking-tight">Enterprise Hub</h1>
              <p className="text-xs text-slate-500">Design · Govern · Scale</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4 overflow-y-auto">
            <NavLinks />
          </div>

          {/* User Section */}
          {user && (
            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.full_name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
                  <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-slate-900">Enterprise Hub</h1>
                    <p className="text-xs text-slate-500">Design · Govern · Scale</p>
                  </div>
                </div>
                <div className="flex-1 py-4 px-3">
                  <NavLinks mobile />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Enterprise Hub</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-4 py-3 border-b">
                <p className="font-medium">Notifications</p>
              </div>
              <div className="py-2">
                <DropdownMenuItem className="px-4 py-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm">New architecture deployed</p>
                      <p className="text-xs text-slate-500">2 min ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:fixed lg:top-0 lg:left-64 lg:right-0 lg:z-40 lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-4 lg:bg-white lg:border-b lg:border-slate-200">
        {/* Search */}
        <button
          onClick={() => setCommandOpen(true)}
          className="relative w-96 h-9 flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-md hover:bg-white transition-colors text-left"
        >
          <Command className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Search or jump to...</span>
          <kbd className="absolute right-3 px-2 py-0.5 text-xs text-slate-400 bg-slate-100 rounded border">
            ⌘K
          </kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-4 py-3 border-b">
                <p className="font-medium">Notifications</p>
              </div>
              <div className="py-2 max-h-96 overflow-y-auto">
                <DropdownMenuItem className="px-4 py-3 cursor-pointer">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm">E-commerce Platform deployed to production</p>
                      <p className="text-xs text-slate-500">2 min ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-4 py-3 cursor-pointer">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm">Monthly budget at 85%</p>
                      <p className="text-xs text-slate-500">5 hours ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-4 py-3 cursor-pointer">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm">Agent training completed with 92% accuracy</p>
                      <p className="text-xs text-slate-500">1 day ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.full_name || "User"}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  {user.role && (
                    <Badge className={`${getRoleColor(user.role)} mt-2 text-xs`}>
                      {getRoleName(user.role)}
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-[73px]">
        <div className="min-h-[calc(100vh-73px)]">{children}</div>
      </main>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}