import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gateway_id, api_key_id } = await req.json();

    if (!gateway_id) {
      return Response.json({ error: 'Missing gateway_id' }, { status: 400 });
    }

    const gateway = await base44.asServiceRole.entities.APIGateway.get(gateway_id);

    // Analyze specific key or all keys
    const keysToAnalyze = api_key_id 
      ? gateway.api_keys.filter(k => k.key_id === api_key_id)
      : gateway.api_keys || [];

    if (keysToAnalyze.length === 0) {
      return Response.json({ error: 'No API keys found' }, { status: 404 });
    }

    // Fetch usage logs (simulated - would come from actual gateway logs)
    const logs = await base44.asServiceRole.entities.ApplicationLog.filter({
      service_name: 'api_gateway',
      metadata: { gateway_id }
    });

    const recentLogs = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);

    const results = [];

    for (const key of keysToAnalyze) {
      const prompt = `You are an API security and usage analyst. Analyze this API key's usage patterns and provide recommendations.

API Key: ${key.key_id}
Name: ${key.name}
Current Tier: ${key.tier}
Rate Limit: ${key.rate_limit} req/min
Created: ${key.created_at}

Recent Usage Patterns (last 50 logs):
${JSON.stringify(recentLogs.slice(0, 20), null, 2)}

Gateway Stats:
Total Requests: ${gateway.total_requests || 0}
Total Blocked: ${gateway.total_blocked || 0}

Analyze and provide:
1. Usage pattern classification
2. Tier recommendation (should they upgrade/downgrade?)
3. Security risk assessment
4. Anomaly detection
5. Cost optimization suggestions

Return JSON:
{
  "usage_pattern": "light|moderate|heavy|bursty|anomalous",
  "requests_per_day_estimate": <number>,
  "recommended_tier": "free|basic|premium|enterprise",
  "tier_change_reason": "<explanation>",
  "security_risk_score": <0-100>,
  "security_issues": [
    {
      "issue": "<description>",
      "severity": "low|medium|high|critical",
      "recommendation": "<what to do>"
    }
  ],
  "anomalies_detected": [
    {
      "type": "spike|unusual_pattern|geographic|timing",
      "description": "<details>",
      "risk_level": "low|medium|high"
    }
  ],
  "cost_optimization": {
    "current_tier_cost_estimate": <number>,
    "recommended_tier_cost_estimate": <number>,
    "potential_savings": <number>,
    "suggestions": ["<optimization tips>"]
  },
  "performance_insights": {
    "avg_response_time": <number>,
    "error_rate_percentage": <number>,
    "peak_usage_time": "<time>",
    "usage_efficiency": <0-100>
  }
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            usage_pattern: { type: 'string' },
            requests_per_day_estimate: { type: 'number' },
            recommended_tier: { type: 'string' },
            tier_change_reason: { type: 'string' },
            security_risk_score: { type: 'number' },
            security_issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  severity: { type: 'string' },
                  recommendation: { type: 'string' }
                }
              }
            },
            anomalies_detected: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  risk_level: { type: 'string' }
                }
              }
            },
            cost_optimization: {
              type: 'object',
              properties: {
                current_tier_cost_estimate: { type: 'number' },
                recommended_tier_cost_estimate: { type: 'number' },
                potential_savings: { type: 'number' },
                suggestions: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            performance_insights: {
              type: 'object',
              properties: {
                avg_response_time: { type: 'number' },
                error_rate_percentage: { type: 'number' },
                peak_usage_time: { type: 'string' },
                usage_efficiency: { type: 'number' }
              }
            }
          }
        }
      });

      results.push({
        key_id: key.key_id,
        key_name: key.name,
        analysis
      });
    }

    // Log the analysis
    await base44.asServiceRole.entities.ApplicationLog.create({
      service_name: 'api_gateway',
      severity: 'info',
      message: `API key analysis completed for ${results.length} key(s)`,
      source: 'api_key_analysis',
      metadata: {
        gateway_id,
        keys_analyzed: results.length,
        high_risk_keys: results.filter(r => r.analysis.security_risk_score > 70).length
      },
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      gateway_id,
      analysis_timestamp: new Date().toISOString(),
      results 
    });
  } catch (error) {
    console.error('API key analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});