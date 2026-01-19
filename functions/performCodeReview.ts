import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code_diff, language, service_name, file_path } = await req.json();

    if (!code_diff) {
      return Response.json({ error: 'Missing code diff' }, { status: 400 });
    }

    const prompt = `You are an expert code reviewer. Analyze this code diff and provide detailed feedback.

Language: ${language}
Service: ${service_name || 'unknown'}
File: ${file_path || 'unknown'}

Code Diff:
\`\`\`${language}
${code_diff}
\`\`\`

Analyze for:
1. **Bugs & Logic Issues**: Potential runtime errors, infinite loops, race conditions
2. **Security Vulnerabilities**: SQL injection, XSS, insecure authentication, exposed secrets
3. **Performance Issues**: N+1 queries, memory leaks, inefficient algorithms, blocking operations
4. **Best Practices**: Code style, naming conventions, error handling, testing
5. **Maintainability**: Code complexity, duplication, documentation

Return JSON:
{
  "summary": "<overall assessment>",
  "severity": "critical|high|medium|low",
  "issues": [
    {
      "type": "bug|security|performance|best_practice",
      "severity": "critical|high|medium|low",
      "line": <approximate line number>,
      "title": "<issue title>",
      "description": "<detailed description>",
      "suggestion": "<how to fix it>",
      "code_example": "<fixed code snippet>"
    }
  ],
  "positive_aspects": ["<what's good about the code>"],
  "approval_status": "approved|needs_review|rejected"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          severity: { type: 'string' },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string' },
                line: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                suggestion: { type: 'string' },
                code_example: { type: 'string' }
              }
            }
          },
          positive_aspects: {
            type: 'array',
            items: { type: 'string' }
          },
          approval_status: { type: 'string' }
        }
      }
    });

    // Log the code review
    await base44.entities.ApplicationLog.create({
      service_name: service_name || 'code_review',
      severity: 'info',
      message: `Code review completed: ${response.approval_status}`,
      source: 'ai_code_review',
      metadata: {
        issues_count: response.issues?.length || 0,
        severity: response.severity,
        file: file_path
      },
      timestamp: new Date().toISOString()
    });

    return Response.json(response);
  } catch (error) {
    console.error('Code review error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});