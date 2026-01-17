import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      domain_description,
      requirements = [],
      architecture_id,
      include_openapi = true,
      include_migrations = true,
      include_cost_estimation = true,
      cloud_providers = ['aws', 'gcp']
    } = await req.json();

    if (!domain_description || !architecture_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `You are an expert microservices architect and DevOps engineer. Generate a comprehensive architecture with:
1. Detailed microservices blueprint
2. OpenAPI 3.0 specifications for each service
3. Database migration strategies
4. Cost estimation across cloud providers

Business Domain: ${domain_description}

Requirements:
${Array.isArray(requirements) ? requirements.map(r => `- ${r}`).join('\n') : '- Standard requirements'}

Please provide DETAILED JSON response with:
{
  "services": [...service definitions with API endpoints...],
  "connections": [...service connections...],
  "openapi_specs": {
    "service_name": {
      "openapi": "3.0.0",
      "info": {...},
      "paths": {...}
    }
  },
  "database_migrations": {
    "strategy": "blue_green|canary|rolling",
    "services": [
      {
        "service_name": "...",
        "database_type": "...",
        "migration_plan": "...",
        "rollback_plan": "..."
      }
    ]
  },
  "cost_estimation": {
    "aws": {"compute": 0, "storage": 0, "network": 0, "total_monthly": 0},
    "gcp": {...},
    "azure": {...}
  },
  "scaling_strategy": "...",
  "security_approach": "..."
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
                database_type: { type: 'string' },
                api_endpoints: { type: 'array', items: { type: 'object' } }
              }
            }
          },
          openapi_specs: { type: 'object' },
          database_migrations: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              services: { type: 'array' }
            }
          },
          cost_estimation: { type: 'object' },
          scaling_strategy: { type: 'string' },
          security_approach: { type: 'string' }
        }
      }
    });

    // Create services
    const serviceMap = {};
    for (const serviceData of response.services) {
      const service = await base44.entities.Service.create({
        architecture_id,
        name: serviceData.name,
        description: serviceData.description,
        language: serviceData.language || 'nodejs',
        database_type: serviceData.database_type || 'none',
        has_api: true,
        api_type: 'rest',
        canvas_position_x: (Object.keys(serviceMap).length % 3) * 300,
        canvas_position_y: Math.floor(Object.keys(serviceMap).length / 3) * 300
      });
      serviceMap[serviceData.name] = service;
    }

    // Store OpenAPI specs
    let openApiData = null;
    if (include_openapi && response.openapi_specs) {
      openApiData = response.openapi_specs;
    }

    // Store migration strategies
    let migrationData = null;
    if (include_migrations && response.database_migrations) {
      migrationData = response.database_migrations;
    }

    // Generate and store cost estimates
    const costEstimates = [];
    if (include_cost_estimation && response.cost_estimation) {
      for (const provider of cloud_providers) {
        const providerCosts = response.cost_estimation[provider] || {};
        const estimate = await base44.entities.CostEstimate.create({
          architecture_id,
          cloud_provider: provider,
          monthly_compute_cost: providerCosts.compute || 0,
          monthly_storage_cost: providerCosts.storage || 0,
          monthly_network_cost: providerCosts.network || 0,
          monthly_database_cost: providerCosts.database || 0,
          monthly_total: providerCosts.total_monthly || 0,
          yearly_total: (providerCosts.total_monthly || 0) * 12,
          instance_types: providerCosts.instance_types || {},
          assumptions: {
            services_count: response.services.length,
            replication_factor: 2,
            availability_zones: 3
          },
          generated_at: new Date().toISOString()
        });
        costEstimates.push(estimate);
      }
    }

    return Response.json({
      success: true,
      services_created: Object.keys(serviceMap).length,
      openapi_specs: openApiData,
      database_migrations: migrationData,
      cost_estimates: costEstimates,
      insights: {
        scaling_strategy: response.scaling_strategy,
        security_approach: response.security_approach
      }
    });
  } catch (error) {
    console.error('Advanced architecture generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});