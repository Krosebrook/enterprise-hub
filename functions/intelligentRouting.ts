import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gateway_id, route_path, current_traffic } = await req.json();

    if (!gateway_id || !route_path) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const gateway = await base44.asServiceRole.entities.APIGateway.get(gateway_id);
    const route = gateway.routes.find(r => r.path === route_path);

    if (!route || !route.ai_routing_enabled) {
      return Response.json({ error: 'Route not found or AI routing not enabled' }, { status: 404 });
    }

    // Fetch service health metrics for target services
    const targetServices = gateway.routes
      .filter(r => r.target_service_id === route.target_service_id)
      .map(r => r.target_service_id);

    const metrics = await base44.asServiceRole.entities.ServiceMetrics.filter({
      service_id: route.target_service_id
    });

    const recentMetrics = metrics
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const prompt = `You are an intelligent API Gateway routing optimizer. Analyze the following data and make routing decisions.

Route: ${route_path}
Method: ${route.method}
Target Service: ${route.target_service_id}
Current Traffic (req/min): ${current_traffic || 'unknown'}
Rate Limit: ${route.rate_limit || 'none'}

Recent Service Metrics (last 10 data points):
${JSON.stringify(recentMetrics, null, 2)}

Load Balancing Strategy: ${gateway.ai_routing_config?.load_balancing_strategy || 'round_robin'}
Auto Failover: ${gateway.ai_routing_config?.auto_failover ? 'enabled' : 'disabled'}

Analyze and provide:
1. Should this request be routed to the primary service or failover?
2. Predicted traffic for next 5 minutes
3. Health score (0-100) for target service
4. Recommended action (route, throttle, failover, reject)

Return JSON:
{
  "route_decision": "primary|failover|reject",
  "target_service_id": "<service_id>",
  "health_score": <0-100>,
  "predicted_traffic_next_5min": <number>,
  "throttle_percentage": <0-100>,
  "reasoning": "<why this decision>",
  "alternative_routes": [
    {
      "service_id": "<id>",
      "confidence": <0-1>,
      "reason": "<why this is an alternative>"
    }
  ]
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          route_decision: { type: 'string' },
          target_service_id: { type: 'string' },
          health_score: { type: 'number' },
          predicted_traffic_next_5min: { type: 'number' },
          throttle_percentage: { type: 'number' },
          reasoning: { type: 'string' },
          alternative_routes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                service_id: { type: 'string' },
                confidence: { type: 'number' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Log the routing decision
    await base44.asServiceRole.entities.ApplicationLog.create({
      service_name: 'api_gateway',
      severity: 'info',
      message: `AI routing decision: ${analysis.route_decision} for ${route_path}`,
      source: 'intelligent_routing',
      metadata: {
        gateway_id,
        route_path,
        health_score: analysis.health_score,
        predicted_traffic: analysis.predicted_traffic_next_5min
      },
      timestamp: new Date().toISOString()
    });

    return Response.json(analysis);
  } catch (error) {
    console.error('Intelligent routing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});