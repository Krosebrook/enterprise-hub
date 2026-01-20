import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_id } = await req.json();

    if (!service_id) {
      return Response.json({ error: 'Missing service_id' }, { status: 400 });
    }

    // Get service and recent metrics
    const [services] = await base44.entities.Service.filter({ id: service_id });
    if (!services) {
      return Response.json({ error: 'Service not found' }, { status: 404 });
    }

    const metrics = await base44.entities.ServiceMetrics.filter({ 
      service_id 
    }).then(data => data.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    ).slice(0, 50));

    // Get cost records
    const costs = await base44.entities.CostRecord.filter({
      resource_id: service_id
    }).then(data => data.slice(0, 30));

    const prompt = `Analyze this service and recommend optimal scaling parameters.

Service: ${services.name}
Current Config:
- Min Instances: ${services.min_instances}
- Max Instances: ${services.max_instances}
- Auto Scaling: ${services.auto_scaling}

Recent Metrics (last 50):
${metrics.slice(0, 10).map(m => `- CPU: ${m.cpu_usage}%, Memory: ${m.memory_usage}%, Latency: ${m.avg_latency_ms}ms, Errors: ${m.error_rate}%`).join('\n')}

Cost History:
- Average daily cost: $${costs.reduce((sum, c) => sum + c.cost_usd, 0) / costs.length || 0}

Analyze:
1. Current load patterns and trends
2. Resource utilization efficiency
3. Cost optimization opportunities
4. Predicted traffic based on patterns
5. Optimal min/max instances

Return JSON:
{
  "current_status": "underutilized|optimal|overloaded",
  "recommendation": {
    "min_instances": <number>,
    "max_instances": <number>,
    "reasoning": "<explanation>"
  },
  "predicted_load": {
    "next_hour": "<low|medium|high>",
    "next_day": "<low|medium|high>",
    "confidence": <0-100>
  },
  "cost_impact": {
    "current_monthly": <number>,
    "optimized_monthly": <number>,
    "savings_percent": <number>
  },
  "insights": [
    "<key insight>"
  ],
  "action": "scale_up|scale_down|maintain|optimize_config"
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          current_status: { type: 'string' },
          recommendation: {
            type: 'object',
            properties: {
              min_instances: { type: 'number' },
              max_instances: { type: 'number' },
              reasoning: { type: 'string' }
            }
          },
          predicted_load: {
            type: 'object',
            properties: {
              next_hour: { type: 'string' },
              next_day: { type: 'string' },
              confidence: { type: 'number' }
            }
          },
          cost_impact: {
            type: 'object',
            properties: {
              current_monthly: { type: 'number' },
              optimized_monthly: { type: 'number' },
              savings_percent: { type: 'number' }
            }
          },
          insights: {
            type: 'array',
            items: { type: 'string' }
          },
          action: { type: 'string' }
        }
      }
    });

    // Auto-apply if action is clear and savings are significant
    if (analysis.action === 'scale_down' && analysis.cost_impact.savings_percent > 20) {
      await base44.entities.Service.update(service_id, {
        min_instances: analysis.recommendation.min_instances,
        max_instances: analysis.recommendation.max_instances
      });
      
      await base44.entities.Activity.create({
        activity_type: 'architecture_validated',
        title: `Auto-scaled ${services.name}`,
        description: `AI reduced instances: ${services.min_instances}-${services.max_instances} → ${analysis.recommendation.min_instances}-${analysis.recommendation.max_instances}. Savings: ${analysis.cost_impact.savings_percent.toFixed(1)}%`,
        icon: 'trending-down',
        color: 'green'
      });

      analysis.auto_applied = true;
    }

    return Response.json(analysis);
  } catch (error) {
    console.error('Scaling analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});