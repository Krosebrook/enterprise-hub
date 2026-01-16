import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Refactored: Split into focused, reusable components
import TemplateSelector, { templatePrompts } from "../components/agent/TemplateSelector";
import AgentBasicInfo from "../components/agent/AgentBasicInfo";
import AgentPersona from "../components/agent/AgentPersona";
import AgentModelSettings from "../components/agent/AgentModelSettings";
import AgentBehaviorSettings from "../components/agent/AgentBehaviorSettings";

export default function AgentCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [agentId, setAgentId] = useState(null);

  // Centralized form state with sensible defaults
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    role: "assistant",
    persona: {
      tone: "professional",
      communication_style: "balanced",
      expertise_level: "intermediate",
      personality_traits: [],
    },
    template_type: "custom",
    model_provider: "openai",
    model_name: "gpt-4-turbo",
    temperature: 0.3,
    max_tokens: 1000,
    system_prompt: "",
    fallback_behavior: "escalate_human",
    confidence_threshold: 0.7,
    status: "draft",
  });

  // Extract agent ID from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) setAgentId(id);
  }, []);

  // Fetch existing agent data for edit mode
  const { data: existingAgent } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => base44.entities.Agent.filter({ id: agentId }),
    enabled: !!agentId,
    select: (data) => data[0],
  });

  // Populate form when editing existing agent
  useEffect(() => {
    if (existingAgent) {
      setFormData({
        name: existingAgent.name || "",
        description: existingAgent.description || "",
        role: existingAgent.role || "assistant",
        persona: existingAgent.persona || {
          tone: "professional",
          communication_style: "balanced",
          expertise_level: "intermediate",
          personality_traits: [],
        },
        template_type: existingAgent.template_type || "custom",
        model_provider: existingAgent.model_provider || "openai",
        model_name: existingAgent.model_name || "gpt-4-turbo",
        temperature: existingAgent.temperature || 0.3,
        max_tokens: existingAgent.max_tokens || 1000,
        system_prompt: existingAgent.system_prompt || "",
        fallback_behavior: existingAgent.fallback_behavior || "escalate_human",
        confidence_threshold: existingAgent.confidence_threshold || 0.7,
        status: existingAgent.status || "draft",
      });
    }
  }, [existingAgent]);

  // Mutations for create/update operations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Agent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      navigate(createPageUrl("Agents"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      navigate(createPageUrl("Agents"));
    },
  });

  // Generic form field update handler
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Template selection with auto-populated system prompt
  const handleTemplateSelect = (templateId) => {
    handleChange("template_type", templateId);

    if (templatePrompts[templateId]) {
      handleChange("system_prompt", templatePrompts[templateId]);
    }
  };

  // Submit handler for both create and update
  const handleSubmit = () => {
    if (agentId) {
      updateMutation.mutate({ id: agentId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with actions */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Agents")}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {agentId ? "Edit Agent" : "Create New Agent"}
              </h1>
              <p className="text-sm text-slate-500">
                Configure your AI agent's behavior and capabilities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(createPageUrl("Agents"))}>
              Cancel
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={handleSubmit}
              disabled={isPending || !formData.name}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {agentId ? "Save Changes" : "Create Agent"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main form with tab navigation */}
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="persona">Role & Persona</TabsTrigger>
            <TabsTrigger value="model">Model Settings</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>

          {/* Tab: Basic Information */}
          <TabsContent value="basic" className="space-y-6">
            <TemplateSelector
              selectedTemplate={formData.template_type}
              onSelect={handleTemplateSelect}
            />
            <AgentBasicInfo formData={formData} onChange={handleChange} />
          </TabsContent>

          {/* Tab: Role & Persona Configuration */}
          <TabsContent value="persona" className="space-y-6">
            <AgentPersona formData={formData} onChange={handleChange} />
          </TabsContent>

          {/* Tab: Model Settings */}
          <TabsContent value="model" className="space-y-6">
            <AgentModelSettings formData={formData} onChange={handleChange} />
          </TabsContent>

          {/* Tab: Behavior Configuration */}
          <TabsContent value="behavior" className="space-y-6">
            <AgentBehaviorSettings formData={formData} onChange={handleChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
