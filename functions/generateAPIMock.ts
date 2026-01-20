import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { openapi_schema, service_name } = await req.json();

    if (!openapi_schema) {
      return Response.json({ error: 'Missing OpenAPI schema' }, { status: 400 });
    }

    const prompt = `Generate a mock API server based on this OpenAPI schema.

Service: ${service_name || 'API Mock'}

OpenAPI Schema:
${openapi_schema.substring(0, 1000)}...

Generate a complete mock server implementation that:
1. Responds to all defined endpoints
2. Returns realistic mock data matching the schema
3. Supports all HTTP methods
4. Includes proper error responses
5. Is production-ready for development/testing

Use Node.js with Express. Return complete, runnable code.`;

    const mockCode = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      mock_server_code: mockCode,
      setup_instructions: "Run: npm install express && node mock-server.js",
      port: 3000
    });
  } catch (error) {
    console.error('Mock generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});