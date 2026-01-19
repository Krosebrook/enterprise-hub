import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service, openapi_schema, crud_code, architectural_context } = await req.json();

    if (!service) {
      return Response.json({ error: 'Missing service data' }, { status: 400 });
    }

    const prompt = `Generate comprehensive documentation for this microservice:

Service Name: ${service.name}
Description: ${service.description || 'A microservice'}
Language: ${service.language}
Framework: ${service.framework}
Database: ${service.database_type}

${openapi_schema ? `OpenAPI Schema:\n${openapi_schema.substring(0, 500)}...` : ''}

${architectural_context ? `Architectural Context:\n${architectural_context}` : ''}

Create a production-ready README.md with:

1. **Overview**: Clear service description
2. **Quick Start**: Installation and setup instructions
3. **API Documentation**: Endpoint examples with curl/Node.js samples
4. **Data Models**: Core entities and relationships
5. **Architecture**: How it fits in the larger system
6. **Development**: Setup for local development
7. **Testing**: How to run tests
8. **Deployment**: Deployment instructions
9. **Troubleshooting**: Common issues and solutions
10. **Contributing**: Contribution guidelines

Format the output as a complete markdown file that's production-ready.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      readme: response,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Documentation generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});