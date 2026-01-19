import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { architecture_id, services, scenarios, cloud_providers } = await req.json();

    if (!services || !scenarios || !cloud_providers) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const prompt = `You are a cloud cost optimization expert. Simulate and compare costs for this microservices architecture across different scenarios and cloud providers.

Architecture:
- ${services.length} services
- Services: ${services.map(s => `${s.name} (${s.language})`).join(', ')}

Traffic Scenarios:
${scenarios.map(s => `- ${s.name}: ${s.users} users, ${s.rps} req/sec`).join('\n')}

Cloud Providers: ${cloud_providers.join(', ')}

For each scenario and provider combination, estimate:
1. Monthly compute costs (instances, containers, or serverless)
2. Monthly database costs
3. Monthly network/bandwidth costs
4. Total monthly cost

Then identify:
- The best cost-performance option
- Cost optimization recommendations
- Service-specific rightsizing suggestions

Return JSON:
{
  "comparisons": [
    {
      "scenario_name": "<scenario name>",
      "providers": [
        {
          "provider": "aws|gcp|azure",
          "monthly_cost": <number>,
          "compute_cost": <number>,
          "database_cost": <number>,
          "network_cost": <number>
        }
      ]
    }
  ],
  "best_option": {
    "provider": "aws|gcp|azure",
    "scenario": "<scenario name>",
    "monthly_cost": <number>,
    "reason": "<why this is best>"
  },
  "optimizations": [
    {
      "title": "<optimization title>",
      "description": "<detailed description>",
      "savings_percent": <percentage>,
      "applies_to": "<which scenarios/providers>"
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          comparisons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scenario_name: { type: 'string' },
                providers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      provider: { type: 'string' },
                      monthly_cost: { type: 'number' },
                      compute_cost: { type: 'number' },
                      database_cost: { type: 'number' },
                      network_cost: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          best_option: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              scenario: { type: 'string' },
              monthly_cost: { type: 'number' },
              reason: { type: 'string' }
            }
          },
          optimizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                savings_percent: { type: 'number' },
                applies_to: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Cost simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});