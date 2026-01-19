import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function runs periodically to check for performance issues
    // and create alerts

    const metrics = await base44.asServiceRole.entities.ServiceMetrics.list();
    const recentMetrics = metrics
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);

    const services = await base44.asServiceRole.entities.Service.list();
    const alerts = [];

    // Check each service for performance degradation
    for (const service of services) {
      const serviceMetrics = recentMetrics.filter(m => m.service_id === service.id);
      
      if (serviceMetrics.length === 0) continue;

      const avgLatency = serviceMetrics.reduce((sum, m) => sum + (m.request_latency_ms || 0), 0) / serviceMetrics.length;
      const avgErrorRate = serviceMetrics.reduce((sum, m) => sum + (m.error_rate_percent || 0), 0) / serviceMetrics.length;
      const avgCpu = serviceMetrics.reduce((sum, m) => sum + (m.cpu_percent || 0), 0) / serviceMetrics.length;
      const avgMemory = serviceMetrics.reduce((sum, m) => sum + (m.memory_percent || 0), 0) / serviceMetrics.length;

      // High Latency Alert
      if (avgLatency > 500) {
        const existingAlert = await base44.asServiceRole.entities.AlertEvent.filter({
          service_id: service.id,
          metric_type: 'latency',
          status: 'firing'
        });

        if (existingAlert.length === 0) {
          await base44.asServiceRole.entities.AlertEvent.create({
            alert_rule_id: 'system-latency',
            service_id: service.id,
            service_name: service.name,
            metric_type: 'latency',
            current_value: avgLatency,
            threshold: 500,
            status: 'firing',
            severity: avgLatency > 1000 ? 'critical' : 'high',
            message: `High latency detected: ${avgLatency.toFixed(0)}ms (threshold: 500ms)`,
            fired_at: new Date().toISOString()
          });

          alerts.push({
            service: service.name,
            type: 'latency',
            value: avgLatency
          });
        }
      }

      // High Error Rate Alert
      if (avgErrorRate > 1) {
        const existingAlert = await base44.asServiceRole.entities.AlertEvent.filter({
          service_id: service.id,
          metric_type: 'error_rate',
          status: 'firing'
        });

        if (existingAlert.length === 0) {
          await base44.asServiceRole.entities.AlertEvent.create({
            alert_rule_id: 'system-error-rate',
            service_id: service.id,
            service_name: service.name,
            metric_type: 'error_rate',
            current_value: avgErrorRate,
            threshold: 1,
            status: 'firing',
            severity: avgErrorRate > 5 ? 'critical' : 'high',
            message: `High error rate detected: ${avgErrorRate.toFixed(2)}% (threshold: 1%)`,
            fired_at: new Date().toISOString()
          });

          alerts.push({
            service: service.name,
            type: 'error_rate',
            value: avgErrorRate
          });
        }
      }

      // High CPU Alert
      if (avgCpu > 80) {
        const existingAlert = await base44.asServiceRole.entities.AlertEvent.filter({
          service_id: service.id,
          metric_type: 'cpu',
          status: 'firing'
        });

        if (existingAlert.length === 0) {
          await base44.asServiceRole.entities.AlertEvent.create({
            alert_rule_id: 'system-cpu',
            service_id: service.id,
            service_name: service.name,
            metric_type: 'cpu',
            current_value: avgCpu,
            threshold: 80,
            status: 'firing',
            severity: 'medium',
            message: `High CPU usage: ${avgCpu.toFixed(0)}% (threshold: 80%)`,
            fired_at: new Date().toISOString()
          });

          alerts.push({
            service: service.name,
            type: 'cpu',
            value: avgCpu
          });
        }
      }
    }

    // Check for security violations from recent scans
    const securityScans = await base44.asServiceRole.entities.SecurityScan.filter({
      status: 'completed'
    });

    for (const scan of securityScans.slice(0, 10)) {
      if (scan.critical_count > 0) {
        await base44.asServiceRole.entities.ApplicationLog.create({
          service_name: 'Security Scanner',
          severity: 'critical',
          message: `Critical security vulnerabilities detected: ${scan.critical_count} critical, ${scan.high_count} high`,
          source: 'security_scan',
          metadata: {
            scan_id: scan.id,
            scan_type: scan.scan_type,
            critical: scan.critical_count,
            high: scan.high_count
          },
          timestamp: new Date().toISOString()
        });

        alerts.push({
          service: 'Security',
          type: 'security_violation',
          value: scan.critical_count
        });
      }
    }

    return Response.json({
      success: true,
      alerts_created: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Alert creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});