import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gateway_id } = await req.json();

    const [gateway] = await base44.entities.APIGateway.filter({ id: gateway_id });
    if (!gateway) {
      return Response.json({ error: 'Gateway not found' }, { status: 404 });
    }

    // Get service health metrics
    const services = await base44.entities.Service.filter({ architecture_id: gateway.architecture_id });
    const metrics = await Promise.all(
      services.map(s => base44.entities.ServiceMetrics.filter({ service_id: s.id }).then(m => ({
        service: s,
        metrics: m.slice(0, 20)
      })))
    );

    const prompt = `Optimize API Gateway routing and rate limiting.

Gateway: ${gateway.name}
Routes: ${gateway.routes?.length || 0}
Total Requests: ${gateway.total_requests}
Blocked: ${gateway.total_blocked}

Services Health:
${metrics.map(({ service, metrics: m }) => `- ${service.name}: Avg CPU ${m.reduce((sum, x) => sum + x.cpu_usage, 0) / m.length || 0}%, Latency ${m.reduce((sum, x) => sum + x.avg_latency_ms, 0) / m.length || 0}ms`).join('\n')}

Provide:
1. Intelligent routing recommendations
2. Dynamic rate limits per service
3. API key tier recommendations
4. Traffic prediction

Return JSON:
{
  "routing_strategy": "ai_predicted|health_based|round_robin",
  "recommended_routes": [
    {
      "path": "<path>",
      "target_service_id": "<id>",
      "rate_limit": <number>,
      "reasoning": "<why this routing>"
    }
  ],
  "rate_limit_adjustments": {
    "free_tier": <number>,
    "basic_tier": <number>,
    "premium_tier": <number>,
    "enterprise_tier": <number>
  },
  "traffic_predictions": {
    "next_hour_requests": <number>,
    "peak_expected_at": "<time>",
    "recommended_capacity": <number>
  },
  "cost_optimization": "<suggestions>"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          routing_strategy: { type: 'string' },
          recommended_routes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                target_service_id: { type: 'string' },
                rate_limit: { type: 'number' },
                reasoning: { type: 'string' }
              }
            }
          },
          rate_limit_adjustments: {
            type: 'object',
            properties: {
              free_tier: { type: 'number' },
              basic_tier: { type: 'number' },
              premium_tier: { type: 'number' },
              enterprise_tier: { type: 'number' }
            }
          },
          traffic_predictions: {
            type: 'object',
            properties: {
              next_hour_requests: { type: 'number' },
              peak_expected_at: { type: 'string' },
              recommended_capacity: { type: 'number' }
            }
          },
          cost_optimization: { type: 'string' }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Gateway optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});