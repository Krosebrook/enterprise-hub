import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { architecture_id } = await req.json();

    if (!architecture_id) {
      return Response.json({ error: 'Missing architecture_id' }, { status: 400 });
    }

    // Fetch architecture services
    const services = await base44.entities.Service.filter({ architecture_id });
    const connections = await base44.entities.ServiceConnection.filter({ architecture_id });

    const violations = [];

    // OWASP Top 10 for Cloud Architectures - Security Checks
    
    // 1. Broken Authentication & Authorization
    const unauthenticatedServices = services.filter(s => !s.auth_method || s.auth_method === 'none');
    if (unauthenticatedServices.length > 0) {
      violations.push({
        severity: 'high',
        category: 'authentication',
        rule: 'OWASP-A01: Broken Authentication',
        message: `${unauthenticatedServices.length} service(s) lack authentication`,
        affected_services: unauthenticatedServices.map(s => s.name),
        remediation: 'Implement JWT, OAuth2, or mTLS authentication for all services'
      });
    }

    // 2. Insecure Connections
    const insecureConnections = connections.filter(c => !c.is_authenticated);
    if (insecureConnections.length > 0) {
      violations.push({
        severity: 'critical',
        category: 'network_security',
        rule: 'OWASP-A02: Cryptographic Failures',
        message: `${insecureConnections.length} connection(s) are not authenticated`,
        affected_services: insecureConnections.map(c => {
          const source = services.find(s => s.id === c.source_service_id);
          const target = services.find(s => s.id === c.target_service_id);
          return `${source?.name} → ${target?.name}`;
        }),
        remediation: 'Enable authentication and TLS/mTLS for all inter-service connections'
      });
    }

    // 3. Weak Security Configuration
    const weakAuthServices = services.filter(s => 
      s.auth_method === 'api_key' && s.has_api
    );
    if (weakAuthServices.length > 0) {
      violations.push({
        severity: 'medium',
        category: 'configuration',
        rule: 'OWASP-A05: Security Misconfiguration',
        message: `${weakAuthServices.length} service(s) using weak API key authentication`,
        affected_services: weakAuthServices.map(s => s.name),
        remediation: 'Upgrade to OAuth2 or JWT-based authentication with short-lived tokens'
      });
    }

    // 4. Missing Database Encryption
    const databaseServices = services.filter(s => 
      s.database_type && s.database_type !== 'none'
    );
    databaseServices.forEach(service => {
      violations.push({
        severity: 'high',
        category: 'data_protection',
        rule: 'OWASP-A02: Cryptographic Failures',
        message: `Database service requires encryption at rest verification`,
        affected_services: [service.name],
        remediation: 'Ensure database encryption at rest and in transit. Use cloud provider managed encryption.'
      });
    });

    // 5. No Rate Limiting
    const apiServices = services.filter(s => s.has_api && !s.rate_limit);
    if (apiServices.length > 0) {
      violations.push({
        severity: 'medium',
        category: 'availability',
        rule: 'OWASP-A04: Insecure Design',
        message: `${apiServices.length} API service(s) lack rate limiting`,
        affected_services: apiServices.map(s => s.name),
        remediation: 'Implement rate limiting to prevent DoS attacks (e.g., 1000 req/min per user)'
      });
    }

    // 6. Single Point of Failure
    const singleInstanceServices = services.filter(s => 
      (!s.auto_scaling || s.min_instances < 2) && !s.is_serverless
    );
    if (singleInstanceServices.length > 0) {
      violations.push({
        severity: 'medium',
        category: 'availability',
        rule: 'High Availability Best Practice',
        message: `${singleInstanceServices.length} service(s) may have single point of failure`,
        affected_services: singleInstanceServices.map(s => s.name),
        remediation: 'Enable auto-scaling with minimum 2 instances for production services'
      });
    }

    // 7. Missing Input Validation
    const graphqlOrRestServices = services.filter(s => 
      s.has_api && (s.api_type === 'rest' || s.api_type === 'graphql')
    );
    if (graphqlOrRestServices.length > 0) {
      violations.push({
        severity: 'high',
        category: 'input_validation',
        rule: 'OWASP-A03: Injection',
        message: `${graphqlOrRestServices.length} API service(s) require input validation`,
        affected_services: graphqlOrRestServices.map(s => s.name),
        remediation: 'Implement input validation, sanitization, and parameterized queries'
      });
    }

    // 8. Logging and Monitoring
    const servicesWithoutMonitoring = services.filter(s => !s.health_check_enabled);
    if (servicesWithoutMonitoring.length > 0) {
      violations.push({
        severity: 'low',
        category: 'monitoring',
        rule: 'OWASP-A09: Security Logging Failures',
        message: `${servicesWithoutMonitoring.length} service(s) lack health monitoring`,
        affected_services: servicesWithoutMonitoring.map(s => s.name),
        remediation: 'Enable health checks, logging, and monitoring for all services'
      });
    }

    // 9. Network Segmentation
    const publicFacingServices = services.filter(s => s.has_api && s.api_type === 'rest');
    if (publicFacingServices.length > 2) {
      violations.push({
        severity: 'medium',
        category: 'network_security',
        rule: 'Network Segmentation Best Practice',
        message: 'Multiple services exposed publicly - consider API Gateway',
        affected_services: publicFacingServices.map(s => s.name),
        remediation: 'Use API Gateway as single entry point. Place services in private subnets.'
      });
    }

    // 10. Compliance - PCI/HIPAA
    const paymentOrHealthServices = services.filter(s => 
      s.name.toLowerCase().includes('payment') || 
      s.name.toLowerCase().includes('billing') ||
      s.name.toLowerCase().includes('health') ||
      s.name.toLowerCase().includes('medical')
    );
    if (paymentOrHealthServices.length > 0) {
      violations.push({
        severity: 'critical',
        category: 'compliance',
        rule: 'PCI-DSS / HIPAA Compliance',
        message: `${paymentOrHealthServices.length} service(s) handle sensitive data - compliance review required`,
        affected_services: paymentOrHealthServices.map(s => s.name),
        remediation: 'Ensure PCI-DSS/HIPAA compliance: encryption, audit logs, access controls, data retention policies'
      });
    }

    // Calculate security score
    const totalChecks = 10;
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;
    const mediumCount = violations.filter(v => v.severity === 'medium').length;
    const lowCount = violations.filter(v => v.severity === 'low').length;

    const securityScore = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2));

    return Response.json({
      security_score: securityScore,
      total_violations: violations.length,
      violations_by_severity: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount
      },
      violations,
      recommendation: securityScore < 50 
        ? 'Critical security issues found. Address immediately before deployment.'
        : securityScore < 70
        ? 'Multiple security issues found. Recommended to fix before production.'
        : securityScore < 90
        ? 'Minor security improvements recommended.'
        : 'Architecture follows security best practices.'
    });
  } catch (error) {
    console.error('Security validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});