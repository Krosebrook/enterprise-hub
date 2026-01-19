import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { services, metrics } = await req.json();

    if (!services || services.length === 0) {
      return Response.json({ error: 'No services provided' }, { status: 400 });
    }

    // Analyze resource utilization
    const serviceAnalysis = services.map(service => {
      const serviceMetrics = metrics.filter(m => m.service_id === service.id);
      const avgCpu = serviceMetrics.reduce((s, m) => s + (m.cpu_percent || 0), 0) / (serviceMetrics.length || 1);
      const avgMemory = serviceMetrics.reduce((s, m) => s + (m.memory_percent || 0), 0) / (serviceMetrics.length || 1);
      
      return {
        name: service.name,
        cpu: avgCpu,
        memory: avgMemory,
        language: service.language,
        database_type: service.database_type,
        auto_scaling: service.auto_scaling,
        min_instances: service.min_instances,
        max_instances: service.max_instances
      };
    });

    const prompt = `You are a cloud cost optimization expert. Analyze the following microservices resource utilization and provide cost-saving recommendations.

Services:
${JSON.stringify(serviceAnalysis, null, 2)}

Provide specific, actionable recommendations to reduce costs while maintaining performance. Consider:
- Rightsizing instances for underutilized services (CPU < 30% or Memory < 40%)
- Spot instances for non-critical workloads
- Serverless alternatives for sporadic usage patterns
- Reserved instances for predictable workloads
- Database optimization (managed vs self-hosted)
- Auto-scaling configurations

Return a JSON response with:
{
  "potential_savings": <number in USD per month>,
  "summary": "<brief overall assessment>",
  "recommendations": [
    {
      "service": "<service name>",
      "title": "<recommendation title>",
      "description": "<detailed recommendation>",
      "savings": <estimated monthly savings in USD>,
      "implementation": "<how to implement>"
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          potential_savings: { type: 'number' },
          summary: { type: 'string' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                service: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                savings: { type: 'number' },
                implementation: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Cost analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});