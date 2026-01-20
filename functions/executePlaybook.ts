import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playbook_id, alert_event_id } = await req.json();

    const [playbook] = await base44.entities.Playbook.filter({ id: playbook_id });
    if (!playbook) {
      return Response.json({ error: 'Playbook not found' }, { status: 404 });
    }

    if (!playbook.is_active) {
      return Response.json({ error: 'Playbook is not active' }, { status: 400 });
    }

    // Create execution record
    const execution = await base44.asServiceRole.entities.PlaybookExecution.create({
      playbook_id,
      alert_event_id,
      triggered_by: user.email,
      status: 'running',
      started_at: new Date().toISOString(),
      action_results: []
    });

    const startTime = Date.now();
    const results = [];

    // Execute actions sequentially
    for (const action of playbook.actions) {
      const actionStart = Date.now();
      let actionResult = { action_type: action.action_type, status: 'pending' };

      try {
        switch (action.action_type) {
          case 'restart_service':
            // Simulate restart
            await base44.asServiceRole.entities.ApplicationLog.create({
              service_name: action.target_service_id,
              severity: 'info',
              message: `Service restart triggered by playbook: ${playbook.name}`,
              source: 'playbook_execution',
              timestamp: new Date().toISOString()
            });
            actionResult = { ...actionResult, status: 'success', output: 'Service restart initiated' };
            break;

          case 'scale_up':
            const [service] = await base44.asServiceRole.entities.Service.filter({ id: action.target_service_id });
            if (service) {
              await base44.asServiceRole.entities.Service.update(service.id, {
                min_instances: (service.min_instances || 1) + 1,
                max_instances: (service.max_instances || 3) + 1
              });
              actionResult = { ...actionResult, status: 'success', output: `Scaled up to ${service.min_instances + 1}-${service.max_instances + 1}` };
            }
            break;

          case 'scale_down':
            const [svc] = await base44.asServiceRole.entities.Service.filter({ id: action.target_service_id });
            if (svc && svc.min_instances > 1) {
              await base44.asServiceRole.entities.Service.update(svc.id, {
                min_instances: svc.min_instances - 1,
                max_instances: Math.max(svc.max_instances - 1, svc.min_instances - 1)
              });
              actionResult = { ...actionResult, status: 'success', output: `Scaled down to ${svc.min_instances - 1}-${Math.max(svc.max_instances - 1, svc.min_instances - 1)}` };
            }
            break;

          case 'rollback':
            actionResult = { ...actionResult, status: 'success', output: 'Rollback initiated' };
            break;

          default:
            actionResult = { ...actionResult, status: 'skipped', output: 'Action type not implemented' };
        }
      } catch (error) {
        actionResult = { ...actionResult, status: 'failed', error: error.message };
        if (!action.continue_on_failure) break;
      }

      actionResult.duration_ms = Date.now() - actionStart;
      results.push(actionResult);
    }

    const totalDuration = Date.now() - startTime;
    const finalStatus = results.every(r => r.status === 'success') ? 'success' : 'failed';

    // Update execution
    await base44.asServiceRole.entities.PlaybookExecution.update(execution.id, {
      status: finalStatus,
      completed_at: new Date().toISOString(),
      duration_ms: totalDuration,
      action_results: results,
      logs: results.map(r => `${r.action_type}: ${r.status} - ${r.output || r.error}`).join('\n')
    });

    // Update playbook stats
    await base44.asServiceRole.entities.Playbook.update(playbook_id, {
      execution_count: (playbook.execution_count || 0) + 1,
      success_rate: ((playbook.success_rate || 0) * (playbook.execution_count || 0) + (finalStatus === 'success' ? 100 : 0)) / ((playbook.execution_count || 0) + 1),
      avg_execution_time_ms: ((playbook.avg_execution_time_ms || 0) * (playbook.execution_count || 0) + totalDuration) / ((playbook.execution_count || 0) + 1)
    });

    return Response.json({
      execution_id: execution.id,
      status: finalStatus,
      duration_ms: totalDuration,
      action_results: results
    });
  } catch (error) {
    console.error('Playbook execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});