import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Send, RotateCcw, MessageSquare, Sparkles, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

export default function AgentPlayground() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [agentId, setAgentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [testSettings, setTestSettings] = useState({
    temperature: 0.7,
    max_tokens: 1000,
    model_override: "",
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) {
      setAgentId(id);
    } else {
      navigate(createPageUrl("Agents"));
    }
  }, []);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => base44.entities.Agent.filter({ id: agentId }),
    enabled: !!agentId,
    select: (data) => data[0],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      // Simulate agent response using InvokeLLM
      const systemPrompt = agent.system_prompt || "You are a helpful assistant.";
      const roleContext = agent.role ? `Your role is: ${agent.role}. ` : "";
      const personaContext = agent.persona
        ? `Communication style: ${agent.persona.communication_style || "balanced"}, 
         Tone: ${agent.persona.tone || "professional"}, 
         Expertise: ${agent.persona.expertise_level || "intermediate"}. `
        : "";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: message,
        add_context_from_internet: false,
        response_json_schema: null,
      });

      return response;
    },
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessageMutation.mutate(input);
    setInput("");
  };

  const handleReset = () => {
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
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
          <Link to={createPageUrl("Agents")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Agent Playground
            </h1>
            <p className="text-sm text-slate-500">{agent?.name || "Testing Agent"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-700">{agent?.role || "assistant"}</Badge>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Start Testing Your Agent
                  </h3>
                  <p className="text-slate-500 max-w-sm">
                    Send messages to test your agent's responses and refine its behavior before
                    deployment
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-sm max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    <div
                      className={`flex items-center gap-1 mt-2 text-xs ${
                        msg.role === "user" ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex gap-3">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={3}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">Enter</kbd> to send,{" "}
              <kbd className="px-1 py-0.5 bg-slate-100 rounded">Shift+Enter</kbd> for new line
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
          <Tabs defaultValue="agent" className="p-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agent">Agent</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="agent" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Agent Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500">Model:</span>
                    <p className="font-medium">{agent?.model_name || "gpt-4-turbo"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Temperature:</span>
                    <p className="font-medium">{agent?.temperature || 0.7}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Role:</span>
                    <p className="font-medium capitalize">{agent?.role || "assistant"}</p>
                  </div>
                  {agent?.persona && (
                    <>
                      <div>
                        <span className="text-slate-500">Tone:</span>
                        <p className="font-medium capitalize">{agent.persona.tone}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Style:</span>
                        <p className="font-medium capitalize">
                          {agent.persona.communication_style}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">
                    {agent?.system_prompt || "No system prompt defined"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Temperature Override</label>
                    <Slider
                      value={[testSettings.temperature]}
                      onValueChange={([value]) =>
                        setTestSettings({ ...testSettings, temperature: value })
                      }
                      min={0}
                      max={1}
                      step={0.1}
                      className="mb-2"
                    />
                    <div className="text-xs text-slate-500">
                      Current: {testSettings.temperature}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                    <Slider
                      value={[testSettings.max_tokens]}
                      onValueChange={([value]) =>
                        setTestSettings({ ...testSettings, max_tokens: value })
                      }
                      min={100}
                      max={4000}
                      step={100}
                      className="mb-2"
                    />
                    <div className="text-xs text-slate-500">Current: {testSettings.max_tokens}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Session Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Messages:</span>
                    <span className="font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">User:</span>
                    <span className="font-medium">
                      {messages.filter((m) => m.role === "user").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agent:</span>
                    <span className="font-medium">
                      {messages.filter((m) => m.role === "assistant").length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
