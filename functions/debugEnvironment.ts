import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error_message, stack_trace, environment_info, service_name } = await req.json();

    if (!error_message) {
      return Response.json({ error: 'Missing error_message' }, { status: 400 });
    }

    const prompt = `You are an expert debugger. Analyze this development environment issue and provide actionable solutions.

Error: ${error_message}

${stack_trace ? `Stack Trace:\n${stack_trace}\n` : ''}

Environment:
${environment_info ? JSON.stringify(environment_info, null, 2) : 'Not provided'}

Service: ${service_name || 'Unknown'}

Analyze and provide:
1. Root cause analysis
2. Step-by-step resolution
3. Common pitfalls to avoid
4. Environment optimization suggestions

Return JSON:
{
  "root_cause": "<analysis>",
  "severity": "critical|high|medium|low",
  "category": "dependency|configuration|network|permission|runtime|build",
  "resolution_steps": [
    {
      "step": <number>,
      "action": "<what to do>",
      "command": "<command to run if applicable>",
      "explanation": "<why this helps>"
    }
  ],
  "quick_fix": "<immediate workaround if available>",
  "common_mistakes": [
    "<what to avoid>"
  ],
  "optimization_suggestions": [
    "<how to improve development environment>"
  ],
  "related_documentation": [
    "<relevant docs or resources>"
  ]
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          root_cause: { type: 'string' },
          severity: { type: 'string' },
          category: { type: 'string' },
          resolution_steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step: { type: 'number' },
                action: { type: 'string' },
                command: { type: 'string' },
                explanation: { type: 'string' }
              }
            }
          },
          quick_fix: { type: 'string' },
          common_mistakes: {
            type: 'array',
            items: { type: 'string' }
          },
          optimization_suggestions: {
            type: 'array',
            items: { type: 'string' }
          },
          related_documentation: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    // Log the debugging session
    await base44.entities.ApplicationLog.create({
      service_name: service_name || 'developer_hub',
      severity: 'info',
      message: `AI debugging session: ${analysis.category} - ${analysis.severity}`,
      source: 'ai_debugger',
      metadata: {
        error_message,
        resolution_provided: true
      },
      timestamp: new Date().toISOString()
    });

    return Response.json(analysis);
  } catch (error) {
    console.error('Debug analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});