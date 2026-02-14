import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gateway_id, analyze_traces = true } = await req.json();

    if (!gateway_id) {
      return Response.json({ error: 'Missing gateway_id' }, { status: 400 });
    }

    const gateway = await base44.asServiceRole.entities.APIGateway.get(gateway_id);
    
    // Collect traffic data
    const [logs, traces] = await Promise.all([
      base44.asServiceRole.entities.ApplicationLog.filter({
        service_name: 'api_gateway',
        metadata: { gateway_id }
      }),
      analyze_traces ? base44.asServiceRole.entities.Trace.list('-start_time', 200) : []
    ]);

    const prompt = `You are an API discovery expert. Analyze the network traffic and identify all API endpoints.

Gateway: ${gateway.name}
Known Routes: ${gateway.routes?.length || 0}
${JSON.stringify(gateway.routes || [], null, 2)}

Application Logs (sample):
${JSON.stringify(logs.slice(0, 50), null, 2)}

${analyze_traces ? `Request Traces (sample):
${JSON.stringify(traces.slice(0, 50), null, 2)}` : ''}

Analyze the traffic patterns and discover all API endpoints, their methods, parameters, and responses.

Return JSON:
{
  "discovered_apis": [
    {
      "path": "<endpoint path>",
      "method": "GET|POST|PUT|DELETE|PATCH",
      "service_name": "<originating service>",
      "call_count": <number of times called>,
      "avg_response_time_ms": <average response time>,
      "error_rate": <0-100>,
      "request_schema": {
        "parameters": [
          {
            "name": "<param name>",
            "type": "string|number|boolean|object|array",
            "location": "path|query|header|body",
            "required": <boolean>,
            "example": "<example value>"
          }
        ],
        "body_schema": {
          "type": "object",
          "properties": {}
        }
      },
      "response_schema": {
        "status_codes": [200, 400, 500],
        "success_schema": {},
        "error_schema": {}
      },
      "authentication": "none|api_key|bearer|oauth",
      "rate_limit_observed": <number or null>,
      "common_consumers": ["<service names>"],
      "tags": ["<categorization tags>"]
    }
  ],
  "statistics": {
    "total_endpoints_discovered": <number>,
    "total_requests_analyzed": <number>,
    "services_identified": <number>,
    "authentication_methods": ["<methods found>"]
  },
  "recommendations": [
    {
      "type": "missing_documentation|rate_limit|security|performance",
      "endpoint": "<path>",
      "suggestion": "<what to do>",
      "priority": "low|medium|high|critical"
    }
  ]
}`;

    const discovery = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          discovered_apis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                method: { type: 'string' },
                service_name: { type: 'string' },
                call_count: { type: 'number' },
                avg_response_time_ms: { type: 'number' },
                error_rate: { type: 'number' },
                request_schema: { type: 'object' },
                response_schema: { type: 'object' },
                authentication: { type: 'string' },
                rate_limit_observed: { type: 'number' },
                common_consumers: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          statistics: {
            type: 'object',
            properties: {
              total_endpoints_discovered: { type: 'number' },
              total_requests_analyzed: { type: 'number' },
              services_identified: { type: 'number' },
              authentication_methods: { type: 'array', items: { type: 'string' } }
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                endpoint: { type: 'string' },
                suggestion: { type: 'string' },
                priority: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Log discovery
    await base44.asServiceRole.entities.ApplicationLog.create({
      service_name: 'api_gateway',
      severity: 'info',
      message: `API discovery completed: ${discovery.statistics.total_endpoints_discovered} endpoints found`,
      source: 'api_discovery',
      metadata: {
        gateway_id,
        endpoints_discovered: discovery.statistics.total_endpoints_discovered,
        requests_analyzed: discovery.statistics.total_requests_analyzed
      },
      timestamp: new Date().toISOString()
    });

    return Response.json({
      gateway_id,
      discovery_timestamp: new Date().toISOString(),
      ...discovery
    });
  } catch (error) {
    console.error('API discovery error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});