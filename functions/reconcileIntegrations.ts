import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { integration_id, max_items = 3000, hard_timeout = 6900 } = await req.json();

    if (!integration_id) {
      return Response.json({ error: 'Missing integration_id' }, { status: 400 });
    }

    const startTime = Date.now();
    const run = await base44.entities.ReconcileRun.create({
      integration_id,
      started_at: new Date().toISOString(),
      status: 'running',
      checked: 0,
      drift_fixed: 0,
      api_calls: 0,
      rate_limited_429: 0,
      failures: 0
    });

    let checked = 0;
    let driftFixed = 0;
    let apiCalls = 0;
    let rateLimited = 0;
    let failures = 0;

    try {
      // Reconcile stuck items > 6 hours
      const stuckItems = await base44.entities.IntegrationOutbox.filter({
        integration_id,
        status: 'queued'
      });

      for (const item of stuckItems) {
        if (Date.now() - startTime > hard_timeout * 1000) {
          break; // Hard timeout
        }

        const createdAt = new Date(item.created_date);
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursOld > 6) {
          checked++;
          // Re-enqueue if still relevant
          driftFixed++;
          await base44.entities.IntegrationOutbox.update(item.id, {
            next_attempt_at: new Date().toISOString(),
            attempt_count: 0,
            status: 'queued'
          });
        }

        if (checked >= max_items) break;
      }

      // Update last reconcile time
      await base44.entities.IntegrationConfig.filter({
        integration_id
      }).then(async (configs) => {
        if (configs.length > 0) {
          await base44.entities.IntegrationConfig.update(configs[0].id, {
            last_reconcile_at: new Date().toISOString()
          });
        }
      });

      // Mark run as success
      await base44.entities.ReconcileRun.update(run.id, {
        status: 'success',
        finished_at: new Date().toISOString(),
        checked,
        drift_fixed: driftFixed,
        api_calls: apiCalls,
        rate_limited_429: rateLimited,
        failures
      });

      return Response.json({
        success: true,
        run_id: run.id,
        checked,
        drift_fixed: driftFixed,
        duration_ms: Date.now() - startTime
      });
    } catch (error) {
      await base44.entities.ReconcileRun.update(run.id, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        notes_json: { error: error.message }
      });

      return Response.json({ error: error.message }, { status: 500 });
    }
  }
});