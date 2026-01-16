import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Persona configuration for fine-grained behavior control
export default function AgentPersona({ formData, onChange }) {
  const updatePersona = (field, value) => {
    onChange("persona", { ...formData.persona, [field]: value });
  };

  return (
    <>
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Role</CardTitle>
          <CardDescription>Define the primary role of your agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Role Type</Label>
            <Select value={formData.role} onValueChange={(value) => onChange("role", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistant">Assistant - General helper</SelectItem>
                <SelectItem value="analyst">Analyst - Data & insights</SelectItem>
                <SelectItem value="advisor">Advisor - Strategic guidance</SelectItem>
                <SelectItem value="specialist">Specialist - Domain expert</SelectItem>
                <SelectItem value="coordinator">Coordinator - Task management</SelectItem>
                <SelectItem value="custom">Custom Role</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Persona Fine-tuning */}
      <Card>
        <CardHeader>
          <CardTitle>Persona Settings</CardTitle>
          <CardDescription>
            Fine-tune your agent's communication style and personality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={formData.persona.tone}
                onValueChange={(value) => updatePersona("tone", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Communication Style</Label>
              <Select
                value={formData.persona.communication_style}
                onValueChange={(value) => updatePersona("communication_style", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="explanatory">Explanatory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expertise Level</Label>
            <Select
              value={formData.persona.expertise_level}
              onValueChange={(value) => updatePersona("expertise_level", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner - Simple explanations</SelectItem>
                <SelectItem value="intermediate">Intermediate - Balanced detail</SelectItem>
                <SelectItem value="expert">Expert - Technical depth</SelectItem>
                <SelectItem value="adaptive">Adaptive - Adjust to user</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Live preview of persona configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="font-medium text-blue-900 mb-1">Preview Persona</div>
            <div className="text-blue-700">
              A <span className="font-semibold">{formData.persona.tone}</span> {formData.role} with{" "}
              <span className="font-semibold">{formData.persona.communication_style}</span>{" "}
              responses, targeting{" "}
              <span className="font-semibold">{formData.persona.expertise_level}</span> users.
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
