import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playbook_id } = await req.json();

    const [playbook] = await base44.entities.Playbook.filter({ id: playbook_id });
    if (!playbook) {
      return Response.json({ error: 'Playbook not found' }, { status: 404 });
    }

    // Get execution history
    const executions = await base44.entities.PlaybookExecution.filter({ playbook_id }).then(data => 
      data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20)
    );

    const prompt = `Optimize this incident response playbook.

Playbook: ${playbook.name}
Description: ${playbook.description}
Current Actions: ${playbook.actions.length}
Execution Count: ${playbook.execution_count || 0}
Success Rate: ${playbook.success_rate || 0}%
Avg Duration: ${playbook.avg_execution_time_ms || 0}ms

Recent Executions:
${executions.slice(0, 5).map(e => `- ${e.status} (${e.duration_ms}ms): ${e.action_results?.length || 0} actions`).join('\n')}

Analyze and optimize:
1. Action ordering for efficiency
2. Add missing safety checks
3. Improve error handling
4. Add conditional logic
5. Optimize for speed

Return JSON:
{
  "optimized_actions": [
    {
      "action_type": "<type>",
      "target_service_id": "<id>",
      "parameters": {},
      "timeout_seconds": <number>,
      "retry_count": <number>,
      "continue_on_failure": <boolean>
    }
  ],
  "improvements": [
    "<what was improved>"
  ],
  "estimated_time_reduction_percent": <number>,
  "estimated_success_rate_improvement": <number>
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          optimized_actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action_type: { type: 'string' },
                target_service_id: { type: 'string' },
                parameters: { type: 'object' },
                timeout_seconds: { type: 'number' },
                retry_count: { type: 'number' },
                continue_on_failure: { type: 'boolean' }
              }
            }
          },
          improvements: {
            type: 'array',
            items: { type: 'string' }
          },
          estimated_time_reduction_percent: { type: 'number' },
          estimated_success_rate_improvement: { type: 'number' }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Playbook optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});