import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { pipeline_run_id, scan_types = ['sast', 'dependency'] } = await req.json();

    if (!pipeline_run_id) {
      return Response.json({ error: 'Missing pipeline_run_id' }, { status: 400 });
    }

    const scanResults = [];

    for (const scanType of scan_types) {
      const scan = await base44.entities.SecurityScan.create({
        pipeline_run_id,
        scan_type: scanType,
        status: 'running',
        scan_started_at: new Date().toISOString()
      });

      // Simulate security scan
      const vulnerabilities = simulateScan(scanType);

      const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
      const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
      const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
      const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

      await base44.entities.SecurityScan.update(scan.id, {
        status: 'completed',
        vulnerabilities_found: vulnerabilities.length,
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        vulnerabilities_json: vulnerabilities,
        scan_completed_at: new Date().toISOString()
      });

      scanResults.push({
        scan_type: scanType,
        vulnerabilities: vulnerabilities.length,
        critical: criticalCount,
        high: highCount
      });
    }

    return Response.json({
      success: true,
      scan_results: scanResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Security scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function simulateScan(scanType) {
  const commonVulnerabilities = [
    {
      id: 'CVE-2024-0001',
      type: 'sql_injection',
      severity: 'critical',
      description: 'SQL Injection in user input handler',
      remediation: 'Use parameterized queries and prepared statements',
      file: 'services/api/controllers/user.js',
      line: 145
    },
    {
      id: 'npm-1234',
      type: 'dependency_vulnerability',
      severity: 'high',
      description: 'Vulnerable dependency: lodash <4.17.21',
      remediation: 'Update lodash to version 4.17.21 or higher',
      file: 'package.json',
      line: 25
    },
    {
      id: 'SAST-0042',
      type: 'hardcoded_secret',
      severity: 'critical',
      description: 'Hardcoded API key in source code',
      remediation: 'Move secrets to environment variables',
      file: 'functions/api.js',
      line: 8
    }
  ];

  if (scanType === 'sast') {
    return [commonVulnerabilities[0], commonVulnerabilities[2]];
  } else if (scanType === 'dependency') {
    return [commonVulnerabilities[1]];
  } else {
    return commonVulnerabilities;
  }
}