import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Simplified form for agent name and description
export default function AgentBasicInfo({ formData, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g., Customer Support Bot"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What does this agent do?"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}