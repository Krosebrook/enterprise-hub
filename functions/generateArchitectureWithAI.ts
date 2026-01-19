import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain_description, requirements, architecture_id, cost_optimization, generate_boilerplate } = await req.json();

    // Load service catalog for reuse
    const catalog = await base44.entities.ServiceCatalog.filter({ is_active: true });

    if (!domain_description || !architecture_id) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const costConstraint = cost_optimization?.max_monthly_cost_usd 
      ? `\nCOST CONSTRAINT: The architecture must not exceed $${cost_optimization.max_monthly_cost_usd}/month. Optimize for cost efficiency by:
- Using smaller instance types where possible
- Leveraging serverless for sporadic workloads
- Minimizing data transfer costs
- Using managed services when cost-effective
- Implementing auto-scaling to reduce idle capacity`
      : '';

    const cloudProvider = cost_optimization?.target_cloud_provider || 'aws';
    const cloudOptimization = `\nTARGET CLOUD PROVIDER: ${cloudProvider.toUpperCase()}
Optimize for ${cloudProvider}-specific services and pricing. Use native services like:
${cloudProvider === 'aws' ? '- Lambda, RDS, ElastiCache, SQS, SNS' : cloudProvider === 'gcp' ? '- Cloud Functions, Cloud SQL, Memorystore, Pub/Sub' : '- Azure Functions, Azure SQL, Azure Cache, Service Bus'}`;

    const catalogContext = catalog.length > 0 ? `\n\nSERVICE CATALOG (prefer these when applicable):
${catalog.map(item => `- ${item.name} (${item.category}): ${item.description} [Cost: ${item.cost_profile?.cost_tier}, Performance: ${item.performance_profile?.performance_tier}, Security: ${item.security_profile?.security_tier}]`).join('\n')}` : '';

    const prompt = `You are an expert microservices architect. Based on the following business domain and requirements, generate a detailed microservices architecture blueprint.

Business Domain: ${domain_description}

Requirements:
${Array.isArray(requirements) ? requirements.map(r => `- ${r}`).join('\n') : '- Standard requirements'}${costConstraint}${cloudOptimization}${catalogContext}

Please provide a JSON response with the following structure:
{
  "services": [
    {
      "name": "Service Name",
      "description": "What this service does",
      "language": "nodejs|python|go|java|rust|csharp",
      "framework": "Framework name",
      "database_type": "postgresql|mysql|mongodb|redis|elasticsearch|none",
      "has_api": true,
      "api_type": "rest|grpc|graphql|websocket",
      "auth_method": "jwt|api_key|oauth2|mtls|none",
      "auto_scaling": true,
      "min_instances": 2,
      "max_instances": 10
    }
  ],
  "connections": [
    {
      "source_service_name": "Service A",
      "target_service_name": "Service B",
      "connection_type": "sync|async|event",
      "protocol": "http|grpc|rabbitmq|kafka|redis|webhook",
      "description": "Why they communicate"
    }
  ],
  "rationale": "Explain the architecture choices",
  "scaling_strategy": "How this architecture scales",
  "security_approach": "Security measures implemented",
  "cost_estimate": {
    "monthly_total_usd": 0,
    "breakdown": "Cost breakdown explanation"
  }
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                language: { type: 'string' },
                framework: { type: 'string' },
                database_type: { type: 'string' },
                has_api: { type: 'boolean' },
                api_type: { type: 'string' },
                auth_method: { type: 'string' },
                auto_scaling: { type: 'boolean' },
                min_instances: { type: 'number' },
                max_instances: { type: 'number' }
              }
            }
          },
          connections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source_service_name: { type: 'string' },
                target_service_name: { type: 'string' },
                connection_type: { type: 'string' },
                protocol: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          rationale: { type: 'string' },
          scaling_strategy: { type: 'string' },
          security_approach: { type: 'string' },
          cost_estimate: {
            type: 'object',
            properties: {
              monthly_total_usd: { type: 'number' },
              breakdown: { type: 'string' }
            }
          }
        }
      }
    });

    // Create services in the architecture
    const serviceMap = {};
    const generatedCode = {};
    
    for (const serviceData of response.services) {
      // Check if this matches a catalog item
      const catalogMatch = catalog.find(c => 
        c.name.toLowerCase() === serviceData.name.toLowerCase() ||
        (c.category === serviceData.name.toLowerCase().split(' ')[0])
      );

      if (catalogMatch) {
        // Increment usage count
        await base44.entities.ServiceCatalog.update(catalogMatch.id, {
          usage_count: (catalogMatch.usage_count || 0) + 1
        });
      }

      const service = await base44.entities.Service.create({
        architecture_id,
        name: serviceData.name,
        description: serviceData.description,
        language: serviceData.language || 'nodejs',
        framework: serviceData.framework || 'Express',
        database_type: serviceData.database_type || 'none',
        has_api: serviceData.has_api !== false,
        api_type: serviceData.api_type || 'rest',
        auth_method: serviceData.auth_method || 'jwt',
        auto_scaling: serviceData.auto_scaling !== false,
        min_instances: serviceData.min_instances || 1,
        max_instances: serviceData.max_instances || 3,
        canvas_position_x: (Object.keys(serviceMap).length % 3) * 250,
        canvas_position_y: Math.floor(Object.keys(serviceMap).length / 3) * 250
      });
      serviceMap[serviceData.name] = service;

      // Generate code if requested
      if (generate_boilerplate) {
        const codeResponse = await base44.functions.invoke('generateServiceCode', {
          service: {
            ...service,
            description: serviceData.description
          }
        });
        generatedCode[service.id] = codeResponse.data;
      }
    }

    // Create connections
    for (const connData of response.connections) {
      const source = serviceMap[connData.source_service_name];
      const target = serviceMap[connData.target_service_name];

      if (source && target) {
        await base44.entities.ServiceConnection.create({
          architecture_id,
          source_service_id: source.id,
          target_service_id: target.id,
          connection_type: connData.connection_type || 'sync',
          protocol: connData.protocol || 'http',
          description: connData.description,
          is_authenticated: true,
          auth_method: 'jwt'
        });
      }
    }

    return Response.json({
      success: true,
      services_created: Object.keys(serviceMap).length,
      connections_created: response.connections.length,
      architecture_insights: {
        rationale: response.rationale,
        scaling_strategy: response.scaling_strategy,
        security_approach: response.security_approach
      },
      cost_estimate: response.cost_estimate,
      generated_code: generate_boilerplate ? generatedCode : null,
      catalog_items_used: catalog.filter(c => 
        response.services.some(s => c.name.toLowerCase() === s.name.toLowerCase())
      ).length
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});