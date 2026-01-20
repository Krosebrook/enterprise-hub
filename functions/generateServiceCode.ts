import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service } = await req.json();

    if (!service) {
      return Response.json({ error: 'Missing service data' }, { status: 400 });
    }

    const prompt = `You are an expert software developer. Generate production-ready code for this microservice:

Service Name: ${service.name}
Description: ${service.description || 'A microservice'}
Language: ${service.language}
Framework: ${service.framework}
Database: ${service.database_type}
API Type: ${service.api_type}

Generate the following:

1. **OpenAPI 3.0 Schema**: Complete API documentation
2. **CRUD Operations**: Full CRUD implementation for the primary data model
3. **Unit Tests**: Comprehensive test stubs with examples
4. **Integration Tests**: Tests for service-to-service communication
5. **Dockerfile**: Production-ready Dockerfile
6. **Kubernetes Manifests**: Deployment and Service YAML
7. **Client SDK**: TypeScript SDK for consuming the API

Return JSON:
{
  "openapi_schema": "<complete OpenAPI 3.0 YAML as string>",
  "crud_code": "<complete CRUD implementation code>",
  "test_code": "<complete unit test file>",
  "integration_test_code": "<complete integration test file>",
  "dockerfile": "<complete Dockerfile>",
  "kubernetes_deployment": "<complete K8s deployment YAML>",
  "kubernetes_service": "<complete K8s service YAML>",
  "client_sdk": "<complete TypeScript SDK code>",
  "setup_instructions": "<deployment and setup steps>",
  "data_model": {
    "name": "<model name>",
    "fields": [
      {"name": "<field>", "type": "<type>", "required": true}
    ]
  }
}

Make it production-ready with proper error handling, validation, and best practices.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          openapi_schema: { type: 'string' },
          crud_code: { type: 'string' },
          test_code: { type: 'string' },
          integration_test_code: { type: 'string' },
          dockerfile: { type: 'string' },
          kubernetes_deployment: { type: 'string' },
          kubernetes_service: { type: 'string' },
          client_sdk: { type: 'string' },
          setup_instructions: { type: 'string' },
          data_model: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Code generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});