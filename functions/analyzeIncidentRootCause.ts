import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playbook_execution_id } = await req.json();

    if (!playbook_execution_id) {
      return Response.json({ error: 'Missing playbook_execution_id' }, { status: 400 });
    }

    const execution = await base44.asServiceRole.entities.PlaybookExecution.get(playbook_execution_id);
    const playbook = await base44.asServiceRole.entities.Playbook.get(execution.playbook_id);

    // Get alert that triggered the playbook
    let alertEvent = null;
    if (execution.alert_event_id) {
      alertEvent = await base44.asServiceRole.entities.AlertEvent.get(execution.alert_event_id);
    }

    // Get relevant logs and traces
    const [logs, traces, metrics] = await Promise.all([
      base44.asServiceRole.entities.ApplicationLog.filter({
        timestamp: { $gte: execution.started_at }
      }),
      base44.asServiceRole.entities.Trace.filter({
        start_time: { $gte: execution.started_at }
      }),
      base44.asServiceRole.entities.ServiceMetrics.filter({
        timestamp: { $gte: execution.started_at }
      })
    ]);

    const prompt = `You are an expert incident responder and root cause analyst. Analyze this incident and provide a comprehensive root cause analysis.

Playbook Executed: ${playbook.name}
Execution Status: ${execution.status}
Duration: ${execution.duration_ms}ms
Started: ${execution.started_at}
Completed: ${execution.completed_at}

Triggering Alert:
${alertEvent ? JSON.stringify(alertEvent, null, 2) : 'Manual execution'}

Actions Executed:
${JSON.stringify(execution.action_results, null, 2)}

System Logs (sample):
${JSON.stringify(logs.slice(0, 20), null, 2)}

Performance Traces (sample):
${JSON.stringify(traces.slice(0, 10), null, 2)}

System Metrics:
${JSON.stringify(metrics.slice(0, 15), null, 2)}

Provide a detailed root cause analysis:

{
  "incident_type": "<type of incident>",
  "root_cause": "<primary root cause>",
  "contributing_factors": [
    {
      "factor": "<factor description>",
      "impact": "high|medium|low",
      "evidence": "<supporting evidence from logs/metrics>"
    }
  ],
  "timeline": [
    {
      "timestamp": "<time>",
      "event": "<what happened>",
      "significance": "<why this matters>"
    }
  ],
  "resolution_effectiveness": <0-100>,
  "actions_taken": [
    {
      "action": "<what was done>",
      "outcome": "successful|failed|partial",
      "impact": "<what changed>"
    }
  ],
  "prevention_recommendations": [
    {
      "recommendation": "<specific recommendation>",
      "priority": "critical|high|medium|low",
      "implementation_effort": "low|medium|high",
      "expected_impact": "<benefit if implemented>"
    }
  ],
  "monitoring_improvements": [
    {
      "metric": "<what to monitor>",
      "threshold": "<recommended threshold>",
      "reason": "<why this helps>"
    }
  ],
  "similar_incidents": {
    "count_in_last_30_days": <number>,
    "pattern_identified": <boolean>,
    "pattern_description": "<if pattern exists>"
  },
  "lessons_learned": ["<lesson 1>", "<lesson 2>"],
  "executive_summary": "<2-3 sentence summary for leadership>"
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          incident_type: { type: 'string' },
          root_cause: { type: 'string' },
          contributing_factors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                factor: { type: 'string' },
                impact: { type: 'string' },
                evidence: { type: 'string' }
              }
            }
          },
          timeline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                event: { type: 'string' },
                significance: { type: 'string' }
              }
            }
          },
          resolution_effectiveness: { type: 'number' },
          actions_taken: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                outcome: { type: 'string' },
                impact: { type: 'string' }
              }
            }
          },
          prevention_recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                recommendation: { type: 'string' },
                priority: { type: 'string' },
                implementation_effort: { type: 'string' },
                expected_impact: { type: 'string' }
              }
            }
          },
          monitoring_improvements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                metric: { type: 'string' },
                threshold: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          },
          similar_incidents: {
            type: 'object',
            properties: {
              count_in_last_30_days: { type: 'number' },
              pattern_identified: { type: 'boolean' },
              pattern_description: { type: 'string' }
            }
          },
          lessons_learned: { type: 'array', items: { type: 'string' } },
          executive_summary: { type: 'string' }
        }
      }
    });

    // Create activity log
    await base44.asServiceRole.entities.Activity.create({
      organization_id: playbook.organization_id,
      user_email: user.email,
      user_name: user.full_name,
      activity_type: 'playbook_analysis_completed',
      title: 'Root Cause Analysis Completed',
      description: analysis.executive_summary,
      resource_type: 'playbook_execution',
      resource_id: playbook_execution_id,
      resource_name: playbook.name,
      icon: 'file-text',
      color: 'blue'
    });

    return Response.json({
      playbook_execution_id,
      playbook_name: playbook.name,
      analysis_timestamp: new Date().toISOString(),
      analysis
    });
  } catch (error) {
    console.error('Root cause analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});