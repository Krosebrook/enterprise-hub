import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Fallback behavior configuration
export default function AgentBehaviorSettings({ formData, onChange }) {
  return (
    <>
      {/* System Prompt Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>Define how your agent should behave and respond</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="You are a helpful assistant..."
            value={formData.system_prompt}
            onChange={(e) => onChange("system_prompt", e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Fallback Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Fallback Behavior</CardTitle>
          <CardDescription>What should the agent do when it's not confident?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fallback Action</Label>
            <Select
              value={formData.fallback_behavior}
              onValueChange={(value) => onChange("fallback_behavior", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="escalate_human">Escalate to Human</SelectItem>
                <SelectItem value="retry">Retry Response</SelectItem>
                <SelectItem value="return_error">Return Error</SelectItem>
                <SelectItem value="use_default">Use Default Response</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Confidence Threshold</Label>
              <span className="text-sm text-slate-500">{formData.confidence_threshold}</span>
            </div>
            <Slider
              value={[formData.confidence_threshold]}
              onValueChange={([value]) => onChange("confidence_threshold", value)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Minimum confidence level to respond (below triggers fallback)
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
