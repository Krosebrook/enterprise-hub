import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { discovered_apis, gateway_id, service_name, version = '1.0.0' } = await req.json();

    if (!discovered_apis || !gateway_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const gateway = await base44.asServiceRole.entities.APIGateway.get(gateway_id);

    const prompt = `You are an OpenAPI specification expert. Generate a complete, valid OpenAPI 3.0 specification from the discovered API endpoints.

Service: ${service_name || gateway.name}
Version: ${version}

Discovered APIs:
${JSON.stringify(discovered_apis, null, 2)}

Generate a complete OpenAPI 3.0 specification that includes:
- Info section with title, description, version
- Servers section
- Paths with all operations, parameters, request/response schemas
- Components for reusable schemas
- Security schemes
- Tags for organization

Return a valid OpenAPI 3.0 JSON object:
{
  "openapi": "3.0.0",
  "info": {
    "title": "<service name>",
    "description": "<service description>",
    "version": "${version}",
    "contact": {
      "name": "API Support"
    }
  },
  "servers": [
    {
      "url": "https://api.example.com",
      "description": "Production"
    }
  ],
  "paths": {
    "/endpoint": {
      "get": {
        "summary": "<operation summary>",
        "description": "<detailed description>",
        "tags": ["<tag>"],
        "parameters": [],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {},
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key"
      }
    }
  },
  "tags": []
}`;

    const openApiSpec = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          openapi: { type: 'string' },
          info: { type: 'object' },
          servers: { type: 'array' },
          paths: { type: 'object' },
          components: { type: 'object' },
          tags: { type: 'array' }
        }
      }
    });

    // Create activity
    await base44.asServiceRole.entities.Activity.create({
      organization_id: gateway.organization_id,
      user_email: user.email,
      user_name: user.full_name,
      activity_type: 'code_generated',
      title: 'OpenAPI Specification Generated',
      description: `Generated OpenAPI spec for ${discovered_apis.length} endpoints`,
      resource_type: 'api_gateway',
      resource_id: gateway_id,
      resource_name: gateway.name,
      icon: 'file-text',
      color: 'blue'
    });

    return Response.json({
      gateway_id,
      service_name: service_name || gateway.name,
      spec_version: version,
      endpoints_documented: discovered_apis.length,
      openapi_spec: openApiSpec,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('OpenAPI generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});