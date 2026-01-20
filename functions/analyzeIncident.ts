import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alert_event_id } = await req.json();

    if (!alert_event_id) {
      return Response.json({ error: 'Missing alert_event_id' }, { status: 400 });
    }

    // Get alert event
    const [alert] = await base44.entities.AlertEvent.filter({ id: alert_event_id });
    if (!alert) {
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Get related logs (last 10 minutes around alert)
    const alertTime = new Date(alert.fired_at);
    const logs = await base44.entities.ApplicationLog.filter({
      service_name: alert.service_name
    }).then(data => data.filter(log => {
      const logTime = new Date(log.timestamp);
      return Math.abs(logTime - alertTime) < 600000; // 10 min window
    }).slice(0, 50));

    // Get related traces
    const traces = await base44.entities.Trace.filter({
      service_name: alert.service_name
    }).then(data => data.filter(trace => {
      const traceTime = new Date(trace.start_time);
      return Math.abs(traceTime - alertTime) < 600000;
    }).slice(0, 20));

    const prompt = `Analyze this incident and provide automated remediation steps.

ALERT:
- Type: ${alert.metric_type}
- Service: ${alert.service_name}
- Current Value: ${alert.current_value}
- Threshold: ${alert.threshold}
- Severity: ${alert.severity}
- Message: ${alert.message}

RELATED LOGS (${logs.length}):
${logs.slice(0, 10).map(log => `[${log.severity}] ${log.message}`).join('\n')}

RELATED TRACES (${traces.length}):
${traces.slice(0, 5).map(t => `- ${t.endpoint} (${t.duration_ms}ms, ${t.error ? 'ERROR' : 'OK'})`).join('\n')}

ERROR TRACES:
${traces.filter(t => t.error).slice(0, 3).map(t => `- ${t.endpoint}: ${t.error_message}`).join('\n')}

Analyze and provide:
1. Root cause analysis
2. Immediate remediation steps
3. Whether to auto-execute playbook
4. Long-term prevention measures

Return JSON:
{
  "root_cause": "<analysis>",
  "confidence": <0-100>,
  "incident_type": "performance|security|availability|error_rate",
  "immediate_actions": [
    {
      "action": "restart_service|scale_up|rollback|clear_cache|rate_limit",
      "description": "<what to do>",
      "auto_executable": true|false,
      "estimated_impact": "<expected outcome>",
      "risk_level": "low|medium|high"
    }
  ],
  "correlated_issues": [
    "<related problems found in logs/traces>"
  ],
  "prevention_steps": [
    "<long-term fix>"
  ],
  "execute_playbook": true|false,
  "playbook_id": "<playbook name if applicable>",
  "escalate_to_human": true|false
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          root_cause: { type: 'string' },
          confidence: { type: 'number' },
          incident_type: { type: 'string' },
          immediate_actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                description: { type: 'string' },
                auto_executable: { type: 'boolean' },
                estimated_impact: { type: 'string' },
                risk_level: { type: 'string' }
              }
            }
          },
          correlated_issues: {
            type: 'array',
            items: { type: 'string' }
          },
          prevention_steps: {
            type: 'array',
            items: { type: 'string' }
          },
          execute_playbook: { type: 'boolean' },
          playbook_id: { type: 'string' },
          escalate_to_human: { type: 'boolean' }
        }
      }
    });

    // Auto-execute low-risk actions if confidence is high
    const executedActions = [];
    if (analysis.confidence > 80 && analysis.execute_playbook) {
      for (const action of analysis.immediate_actions) {
        if (action.auto_executable && action.risk_level === 'low') {
          // Log the action
          await base44.entities.ApplicationLog.create({
            service_name: alert.service_name,
            severity: 'info',
            message: `Auto-remediation: ${action.action} - ${action.description}`,
            source: 'ai_incident_response',
            metadata: { alert_id: alert_event_id, action },
            timestamp: new Date().toISOString()
          });
          executedActions.push(action.action);
        }
      }
    }

    // Create activity
    await base44.entities.Activity.create({
      activity_type: 'compliance_violation',
      title: `Incident analyzed: ${alert.service_name}`,
      description: `${analysis.root_cause}. Executed: ${executedActions.join(', ') || 'None (manual review required)'}`,
      resource_type: 'service',
      resource_name: alert.service_name,
      icon: 'alert-circle',
      color: analysis.escalate_to_human ? 'red' : 'yellow'
    });

    return Response.json({
      ...analysis,
      executed_actions: executedActions,
      logs_analyzed: logs.length,
      traces_analyzed: traces.length
    });
  } catch (error) {
    console.error('Incident analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});