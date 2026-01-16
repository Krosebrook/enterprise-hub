import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Plus, Search, MoreVertical, GitBranch, Trash2, Edit, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import PermissionGate from "../components/rbac/PermissionGate";

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
  validated: { label: "Validated", color: "bg-blue-100 text-blue-700" },
  generated: { label: "Generated", color: "bg-purple-100 text-purple-700" },
  deployed: { label: "Deployed", color: "bg-green-100 text-green-700" },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-500" },
};

const templateConfig = {
  blank: { label: "Blank", color: "bg-slate-100 text-slate-600" },
  "e-commerce": { label: "E-commerce", color: "bg-orange-100 text-orange-700" },
  saas: { label: "SaaS", color: "bg-blue-100 text-blue-700" },
  iot: { label: "IoT", color: "bg-green-100 text-green-700" },
  healthcare: { label: "Healthcare", color: "bg-red-100 text-red-700" },
  fintech: { label: "Fintech", color: "bg-purple-100 text-purple-700" },
};

export default function Architectures() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [architectureToDelete, setArchitectureToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: architectures = [], isLoading } = useQuery({
    queryKey: ["architectures"],
    queryFn: () => base44.entities.Architecture.list("-created_date"),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Architecture.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["architectures"] });
      setDeleteDialogOpen(false);
      setArchitectureToDelete(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (arch) => {
      const { id, created_date, updated_date, created_by, ...data } = arch;
      return base44.entities.Architecture.create({
        ...data,
        name: `${data.name} (Copy)`,
        status: "draft",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["architectures"] });
    },
  });

  const filteredArchitectures = architectures.filter((arch) => {
    const matchesSearch =
      arch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arch.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || arch.status === statusFilter;
    const matchesTemplate = templateFilter === "all" || arch.template_type === templateFilter;
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const handleDelete = (arch) => {
    setArchitectureToDelete(arch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (architectureToDelete) {
      deleteMutation.mutate(architectureToDelete.id);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" data-b44-sync="page-architectures">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Architectures</h1>
          <p className="text-slate-500 mt-1">Design and manage your microservices architectures</p>
        </div>
        <PermissionGate permission="architecture.create">
          <Link to={createPageUrl("ArchitectureDesigner")}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              New Architecture
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search architectures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="blank">Blank</SelectItem>
              <SelectItem value="e-commerce">E-commerce</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="iot">IoT</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="fintech">Fintech</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Architecture Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredArchitectures.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <GitBranch className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No architectures found</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              {searchQuery || statusFilter !== "all" || templateFilter !== "all"
                ? "Try adjusting your filters or search query"
                : "Get started by creating your first microservices architecture"}
            </p>
            {!searchQuery && statusFilter === "all" && templateFilter === "all" && (
              <Link to={createPageUrl("ArchitectureDesigner")}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Architecture
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArchitectures.map((arch) => (
            <Card key={arch.id} className="hover:shadow-lg transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={createPageUrl(`ArchitectureDesigner?id=${arch.id}`)}
                      className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                    >
                      {arch.name}
                    </Link>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {arch.description || "No description"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl(`ArchitectureDesigner?id=${arch.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <PermissionGate permission="architecture.edit">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`ArchitectureDesigner?id=${arch.id}&edit=true`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(arch)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                      </PermissionGate>
                      <PermissionGate permission="architecture.delete">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(arch)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </PermissionGate>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={statusConfig[arch.status]?.color || statusConfig.draft.color}>
                    {statusConfig[arch.status]?.label || arch.status}
                  </Badge>
                  {arch.template_type && arch.template_type !== "blank" && (
                    <Badge
                      className={
                        templateConfig[arch.template_type]?.color || templateConfig.blank.color
                      }
                    >
                      {templateConfig[arch.template_type]?.label || arch.template_type}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{arch.services_count || 0} services</span>
                  <span>
                    {arch.created_date
                      ? format(new Date(arch.created_date), "MMM d, yyyy")
                      : "Recently"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Architecture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{architectureToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
