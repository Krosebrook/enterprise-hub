import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { architecture_id, simulation_config_id } = await req.json();

    if (!architecture_id || !simulation_config_id) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch architecture, services, connections, and simulation config
    const [architecture, services, connections, simConfig] = await Promise.all([
      base44.entities.Architecture.filter({ id: architecture_id }).then(data => data[0]),
      base44.entities.Service.filter({ architecture_id }),
      base44.entities.ServiceConnection.filter({ architecture_id }),
      base44.entities.SimulationConfig.filter({ id: simulation_config_id }).then(data => data[0])
    ]);

    if (!architecture || !simConfig) {
      return Response.json({ error: 'Architecture or simulation config not found' }, { status: 404 });
    }

    // Build dependency graph
    const dependencyMap = {};
    services.forEach(service => {
      dependencyMap[service.id] = {
        service,
        inbound: [],
        outbound: []
      };
    });

    connections.forEach(conn => {
      if (dependencyMap[conn.source_service_id]) {
        dependencyMap[conn.source_service_id].outbound.push(conn.target_service_id);
      }
      if (dependencyMap[conn.target_service_id]) {
        dependencyMap[conn.target_service_id].inbound.push(conn.source_service_id);
      }
    });

    // Calculate service metrics
    const serviceMetrics = [];
    let maxLatency = 0;
    const cpuUtilizations = [];
    const memoryUtilizations = [];

    services.forEach(service => {
      const baseLatency = simConfig.avg_response_time_ms;
      const inboundConnections = dependencyMap[service.id].inbound.length;
      
      // Add latency for each inbound connection
      const responseTime = baseLatency + (inboundConnections * 10);
      maxLatency = Math.max(maxLatency, responseTime);

      // Calculate required instances based on RPS and latency
      const rps = simConfig.expected_rps / Math.max(1, services.length);
      const requiredInstances = Math.ceil((rps * (responseTime / 1000)) / 100);

      // CPU/Memory utilization
      const cpuUtilization = Math.min(95, (requiredInstances * 25) + Math.random() * 20);
      const memoryUtilization = Math.min(90, (requiredInstances * 20) + Math.random() * 15);

      cpuUtilizations.push(cpuUtilization);
      memoryUtilizations.push(memoryUtilization);

      serviceMetrics.push({
        service_id: service.id,
        service_name: service.name,
        response_time_ms: Math.round(responseTime),
        cpu_percent: Math.round(cpuUtilization),
        memory_percent: Math.round(memoryUtilization),
        required_instances: requiredInstances,
        throughput_rps: Math.round(rps)
      });
    });

    // Identify bottlenecks
    const bottlenecks = [];
    
    serviceMetrics.forEach(metric => {
      if (metric.cpu_percent > 80) {
        bottlenecks.push({
          service_id: metric.service_id,
          service_name: metric.service_name,
          type: 'cpu',
          severity: metric.cpu_percent > 90 ? 'critical' : 'high',
          message: `High CPU utilization: ${metric.cpu_percent}%`,
          utilization_percent: metric.cpu_percent
        });
      }
      if (metric.memory_percent > 80) {
        bottlenecks.push({
          service_id: metric.service_id,
          service_name: metric.service_name,
          type: 'memory',
          severity: metric.memory_percent > 90 ? 'critical' : 'high',
          message: `High memory utilization: ${metric.memory_percent}%`,
          utilization_percent: metric.memory_percent
        });
      }
      if (metric.response_time_ms > simConfig.latency_tolerance_ms) {
        bottlenecks.push({
          service_id: metric.service_id,
          service_name: metric.service_name,
          type: 'latency',
          severity: metric.response_time_ms > simConfig.latency_tolerance_ms * 2 ? 'critical' : 'high',
          message: `Latency exceeds tolerance: ${metric.response_time_ms}ms > ${simConfig.latency_tolerance_ms}ms`,
          utilization_percent: (metric.response_time_ms / simConfig.latency_tolerance_ms) * 100
        });
      }
    });

    // Calculate total cost (rough estimation)
    const totalInstances = serviceMetrics.reduce((sum, m) => sum + m.required_instances, 0);
    const estimatedCostPerMonth = (totalInstances * 100) + (simConfig.data_volume_gb * 0.023); // Rough AWS estimate

    // Generate recommendations
    const recommendations = [];
    
    if (bottlenecks.filter(b => b.type === 'cpu').length > 0) {
      recommendations.push('Consider adding caching layers to reduce CPU load');
    }
    if (bottlenecks.filter(b => b.type === 'memory').length > 0) {
      recommendations.push('Optimize memory usage or increase instance memory allocation');
    }
    if (maxLatency > simConfig.latency_tolerance_ms) {
      recommendations.push('Add message queues for asynchronous communication to reduce latency');
    }
    if (services.length < 5) {
      recommendations.push('Consider breaking down monolithic services for better scalability');
    }
    if (connections.filter(c => c.connection_type !== 'async').length / connections.length > 0.8) {
      recommendations.push('Increase use of asynchronous communication patterns');
    }

    // Create simulation result
    const result = await base44.entities.SimulationResult.create({
      architecture_id,
      simulation_config_id,
      simulation_name: simConfig.name,
      overall_latency_ms: Math.round(maxLatency),
      cpu_utilization_percent: Math.round(cpuUtilizations.reduce((a, b) => a + b, 0) / cpuUtilizations.length),
      memory_utilization_percent: Math.round(memoryUtilizations.reduce((a, b) => a + b, 0) / memoryUtilizations.length),
      bandwidth_mbps: Math.round((simConfig.expected_rps * 10) / 1024),
      bottlenecks,
      service_metrics: serviceMetrics,
      total_estimated_cost_per_month: Math.round(estimatedCostPerMonth),
      recommendations,
      simulated_at: new Date().toISOString()
    });

    return Response.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});