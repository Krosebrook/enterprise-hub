import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gateway_id } = await req.json();

    if (!gateway_id) {
      return Response.json({ error: 'Missing gateway_id' }, { status: 400 });
    }

    const gateway = await base44.asServiceRole.entities.APIGateway.get(gateway_id);

    if (!gateway.dynamic_rate_limiting?.enabled) {
      return Response.json({ error: 'Dynamic rate limiting not enabled' }, { status: 400 });
    }

    // Fetch recent traffic metrics
    const recentMetrics = await base44.asServiceRole.entities.ServiceMetrics.filter({
      service_id: gateway.architecture_id
    });

    const sortedMetrics = recentMetrics
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);

    // Fetch recent alert events
    const alerts = await base44.asServiceRole.entities.AlertEvent.filter({
      service_id: gateway.architecture_id,
      status: 'active'
    });

    const prompt = `You are an intelligent API Gateway rate limit optimizer. Analyze traffic patterns and service health to dynamically adjust rate limits.

Gateway: ${gateway.name}
Base Rate Limit: ${gateway.dynamic_rate_limiting.base_rate_per_minute} req/min
AI Adjustment: ${gateway.dynamic_rate_limiting.ai_adjustment_enabled ? 'enabled' : 'disabled'}
Health-Based Adjustment: ${gateway.dynamic_rate_limiting.adjust_based_on_health ? 'enabled' : 'disabled'}

Recent Metrics (last 20 data points):
${JSON.stringify(sortedMetrics.map(m => ({
  timestamp: m.timestamp,
  cpu_usage: m.cpu_usage,
  memory_usage: m.memory_usage,
  request_count: m.request_count,
  error_rate: m.error_rate
})), null, 2)}

Active Alerts: ${alerts.length}
${alerts.length > 0 ? JSON.stringify(alerts.map(a => ({ severity: a.severity, message: a.message })), null, 2) : 'None'}

API Keys by Tier:
${JSON.stringify(gateway.api_keys?.map(k => ({ tier: k.tier, current_limit: k.rate_limit })) || [], null, 2)}

Analyze and provide:
1. Predicted traffic for next 15 minutes
2. System health trend (improving, stable, degrading)
3. Recommended rate limit adjustments per tier
4. Risk level (low, medium, high, critical)

Return JSON:
{
  "predicted_traffic_15min": <number>,
  "health_trend": "improving|stable|degrading",
  "risk_level": "low|medium|high|critical",
  "recommended_adjustments": [
    {
      "tier": "free|basic|premium|enterprise",
      "current_limit": <number>,
      "new_limit": <number>,
      "adjustment_percentage": <number>,
      "reason": "<explanation>"
    }
  ],
  "global_throttle": <0-100>,
  "reasoning": "<overall analysis>",
  "should_alert": <boolean>,
  "alert_message": "<message if should_alert is true>"
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          predicted_traffic_15min: { type: 'number' },
          health_trend: { type: 'string' },
          risk_level: { type: 'string' },
          recommended_adjustments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tier: { type: 'string' },
                current_limit: { type: 'number' },
                new_limit: { type: 'number' },
                adjustment_percentage: { type: 'number' },
                reason: { type: 'string' }
              }
            }
          },
          global_throttle: { type: 'number' },
          reasoning: { type: 'string' },
          should_alert: { type: 'boolean' },
          alert_message: { type: 'string' }
        }
      }
    });

    // Apply adjustments if auto-adjustment enabled
    if (gateway.dynamic_rate_limiting.ai_adjustment_enabled) {
      const updatedApiKeys = gateway.api_keys.map(key => {
        const adjustment = analysis.recommended_adjustments.find(a => a.tier === key.tier);
        if (adjustment) {
          return { ...key, rate_limit: adjustment.new_limit };
        }
        return key;
      });

      await base44.asServiceRole.entities.APIGateway.update(gateway_id, {
        api_keys: updatedApiKeys
      });
    }

    // Create alert if needed
    if (analysis.should_alert) {
      await base44.asServiceRole.entities.AlertEvent.create({
        service_id: gateway.architecture_id,
        severity: analysis.risk_level === 'critical' ? 'critical' : 'high',
        alert_type: 'rate_limit_adjustment',
        message: analysis.alert_message,
        status: 'active',
        metadata: {
          gateway_id,
          predicted_traffic: analysis.predicted_traffic_15min,
          adjustments_applied: analysis.recommended_adjustments
        }
      });
    }

    // Log the adjustment
    await base44.asServiceRole.entities.ApplicationLog.create({
      service_name: 'api_gateway',
      severity: 'info',
      message: `AI rate limit adjustment: ${analysis.health_trend} trend, ${analysis.risk_level} risk`,
      source: 'dynamic_rate_limiting',
      metadata: {
        gateway_id,
        adjustments: analysis.recommended_adjustments
      },
      timestamp: new Date().toISOString()
    });

    return Response.json(analysis);
  } catch (error) {
    console.error('Rate limit adjustment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});