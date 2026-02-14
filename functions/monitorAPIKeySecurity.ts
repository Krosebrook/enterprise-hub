import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { gateway_id } = await req.json();

    if (!gateway_id) {
      return Response.json({ error: 'Missing gateway_id' }, { status: 400 });
    }

    const gateway = await base44.asServiceRole.entities.APIGateway.get(gateway_id);

    // Fetch recent logs and metrics
    const logs = await base44.asServiceRole.entities.ApplicationLog.filter({
      service_name: 'api_gateway',
      metadata: { gateway_id }
    });

    const recentLogs = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);

    // Get all API keys for analysis
    const keyAnalysis = [];

    for (const key of gateway.api_keys || []) {
      // Filter logs for this specific key
      const keyLogs = recentLogs.filter(log => 
        log.metadata?.api_key_id === key.key_id
      );

      const prompt = `You are an advanced API security analyst. Analyze this API key's recent activity for security threats and anomalies.

API Key: ${key.key_id}
Name: ${key.name}
Tier: ${key.tier}
Rate Limit: ${key.rate_limit} req/min

Recent Activity (last 100 logs):
${JSON.stringify(keyLogs.slice(0, 30), null, 2)}

Gateway Stats:
Total Requests: ${gateway.total_requests || 0}
Total Blocked: ${gateway.total_blocked || 0}

Analyze for:
1. Suspicious traffic patterns (unusual spikes, DDoS indicators)
2. Geographic anomalies (requests from unexpected locations)
3. High error rates or failed authentication attempts
4. Abnormal request patterns (scraping, brute force)
5. Time-based anomalies (requests at unusual hours)

Return JSON with security assessment:
{
  "threat_level": "none|low|medium|high|critical",
  "confidence_score": <0-100>,
  "threats_detected": [
    {
      "type": "ddos|brute_force|geographic_anomaly|rate_abuse|suspicious_pattern",
      "severity": "low|medium|high|critical",
      "description": "<detailed description>",
      "evidence": "<specific evidence from logs>",
      "first_detected": "<timestamp or 'just now'>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "anomalies": [
    {
      "category": "traffic|geographic|timing|error_rate|authentication",
      "description": "<what's anomalous>",
      "normal_baseline": "<what's normal>",
      "current_value": "<what's observed>",
      "deviation_percentage": <number>
    }
  ],
  "traffic_analysis": {
    "requests_last_hour": <number>,
    "error_rate_percentage": <number>,
    "peak_request_time": "<time>",
    "geographic_spread": ["<country codes>"],
    "unusual_endpoints": ["<endpoints with high error rates>"]
  },
  "recommended_actions": [
    {
      "priority": "immediate|high|medium|low",
      "action": "block_key|rate_limit|alert_admin|investigate|monitor",
      "reason": "<why this action>"
    }
  ],
  "should_block_immediately": <boolean>,
  "summary": "<brief security summary>"
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            threat_level: { type: 'string' },
            confidence_score: { type: 'number' },
            threats_detected: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  description: { type: 'string' },
                  evidence: { type: 'string' },
                  first_detected: { type: 'string' },
                  recommendation: { type: 'string' }
                }
              }
            },
            anomalies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  description: { type: 'string' },
                  normal_baseline: { type: 'string' },
                  current_value: { type: 'string' },
                  deviation_percentage: { type: 'number' }
                }
              }
            },
            traffic_analysis: {
              type: 'object',
              properties: {
                requests_last_hour: { type: 'number' },
                error_rate_percentage: { type: 'number' },
                peak_request_time: { type: 'string' },
                geographic_spread: { type: 'array', items: { type: 'string' } },
                unusual_endpoints: { type: 'array', items: { type: 'string' } }
              }
            },
            recommended_actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: { type: 'string' },
                  action: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            },
            should_block_immediately: { type: 'boolean' },
            summary: { type: 'string' }
          }
        }
      });

      keyAnalysis.push({
        key_id: key.key_id,
        key_name: key.name,
        analysis
      });

      // Create alert if critical threat detected
      if (analysis.threat_level === 'critical' || analysis.should_block_immediately) {
        await base44.asServiceRole.entities.AlertEvent.create({
          service_id: gateway.architecture_id,
          severity: 'critical',
          alert_type: 'security_threat',
          message: `Critical security threat detected for API key ${key.name}`,
          status: 'active',
          metadata: {
            gateway_id,
            api_key_id: key.key_id,
            threat_level: analysis.threat_level,
            threats: analysis.threats_detected,
            should_block: analysis.should_block_immediately
          }
        });
      }

      // Auto-block if recommended and enabled
      if (analysis.should_block_immediately) {
        await base44.asServiceRole.entities.ApplicationLog.create({
          service_name: 'api_gateway',
          severity: 'critical',
          message: `API key ${key.name} blocked due to security threat`,
          source: 'security_monitor',
          metadata: {
            gateway_id,
            api_key_id: key.key_id,
            reason: analysis.summary,
            auto_blocked: true
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update gateway AI insights
    const criticalThreats = keyAnalysis.filter(k => k.analysis.threat_level === 'critical').length;
    const highThreats = keyAnalysis.filter(k => 
      k.analysis.threat_level === 'high' || k.analysis.threat_level === 'critical'
    ).length;

    await base44.asServiceRole.entities.APIGateway.update(gateway_id, {
      ai_insights: {
        ...gateway.ai_insights,
        last_security_scan: new Date().toISOString(),
        risk_level: criticalThreats > 0 ? 'critical' : 
                   highThreats > 0 ? 'high' : 
                   keyAnalysis.some(k => k.analysis.threat_level === 'medium') ? 'medium' : 'low'
      }
    });

    // Log the security scan
    await base44.asServiceRole.entities.ApplicationLog.create({
      service_name: 'api_gateway',
      severity: 'info',
      message: `Security scan completed for gateway ${gateway.name}`,
      source: 'security_monitor',
      metadata: {
        gateway_id,
        keys_analyzed: keyAnalysis.length,
        threats_found: keyAnalysis.reduce((sum, k) => sum + k.analysis.threats_detected.length, 0),
        critical_threats: criticalThreats
      },
      timestamp: new Date().toISOString()
    });

    return Response.json({
      gateway_id,
      scan_timestamp: new Date().toISOString(),
      keys_analyzed: keyAnalysis.length,
      overall_risk_level: criticalThreats > 0 ? 'critical' : 
                         highThreats > 0 ? 'high' : 'medium',
      analysis: keyAnalysis
    });
  } catch (error) {
    console.error('Security monitoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});