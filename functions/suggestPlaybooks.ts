import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = await req.json();

    // Fetch current system state
    const [alerts, metrics, playbooks] = await Promise.all([
      base44.asServiceRole.entities.AlertEvent.filter({ status: 'active' }),
      base44.asServiceRole.entities.ServiceMetrics.list('-timestamp', 20),
      base44.asServiceRole.entities.Playbook.filter({ is_active: true })
    ]);

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');

    const prompt = `You are an intelligent incident response system. Analyze the current system state and suggest appropriate playbooks.

Active Alerts: ${alerts.length}
Critical Alerts: ${criticalAlerts.length}
High Priority Alerts: ${highAlerts.length}

Recent Alerts:
${JSON.stringify(alerts.slice(0, 10), null, 2)}

Recent System Metrics:
${JSON.stringify(metrics.slice(0, 10), null, 2)}

Available Playbooks:
${JSON.stringify(playbooks.map(p => ({
  id: p.id,
  name: p.name,
  trigger_type: p.trigger_type,
  success_rate: p.success_rate
})), null, 2)}

Based on the current system state, suggest which playbooks should be executed and why.

Return JSON:
{
  "system_health_score": <0-100>,
  "incident_severity": "none|low|medium|high|critical",
  "suggested_playbooks": [
    {
      "playbook_id": "<id>",
      "playbook_name": "<name>",
      "priority": "immediate|high|medium|low",
      "confidence": <0-100>,
      "reasoning": "<why this playbook should run>",
      "trigger_conditions_met": ["<condition 1>", "<condition 2>"],
      "expected_impact": "<what this will fix>",
      "estimated_duration": "<time estimate>",
      "auto_execute": <boolean - true only if safe and immediate action needed>
    }
  ],
  "preventive_actions": [
    {
      "action": "<preventive measure>",
      "reason": "<why this prevents future incidents>"
    }
  ],
  "summary": "<overall system assessment>"
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          system_health_score: { type: 'number' },
          incident_severity: { type: 'string' },
          suggested_playbooks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                playbook_id: { type: 'string' },
                playbook_name: { type: 'string' },
                priority: { type: 'string' },
                confidence: { type: 'number' },
                reasoning: { type: 'string' },
                trigger_conditions_met: { type: 'array', items: { type: 'string' } },
                expected_impact: { type: 'string' },
                estimated_duration: { type: 'string' },
                auto_execute: { type: 'boolean' }
              }
            }
          },
          preventive_actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          },
          summary: { type: 'string' }
        }
      }
    });

    // Auto-execute high confidence playbooks if conditions met
    for (const suggestion of analysis.suggested_playbooks) {
      if (suggestion.auto_execute && suggestion.confidence > 90 && suggestion.priority === 'immediate') {
        const playbook = playbooks.find(p => p.id === suggestion.playbook_id);
        if (playbook && !playbook.approval_required) {
          // Trigger playbook execution
          await base44.asServiceRole.functions.invoke('executePlaybook', {
            playbook_id: suggestion.playbook_id,
            triggered_by: 'ai_auto_execute',
            reason: suggestion.reasoning
          });

          await base44.asServiceRole.entities.ApplicationLog.create({
            service_name: 'playbook_engine',
            severity: 'info',
            message: `AI auto-executed playbook: ${suggestion.playbook_name}`,
            source: 'ai_playbook_suggester',
            metadata: {
              playbook_id: suggestion.playbook_id,
              confidence: suggestion.confidence,
              reasoning: suggestion.reasoning
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return Response.json({
      timestamp: new Date().toISOString(),
      analysis,
      alerts_analyzed: alerts.length,
      playbooks_available: playbooks.length
    });
  } catch (error) {
    console.error('Playbook suggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});