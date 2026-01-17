import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      integration_id,
      operation,
      stable_resource_id,
      payload_json
    } = await req.json();

    if (!integration_id || !operation || !stable_resource_id || !payload_json) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate deterministic idempotency key
    const payloadStr = JSON.stringify(payload_json);
    const idempotencyKey = createHash('sha256')
      .update(`${integration_id}:${operation}:${stable_resource_id}:${payloadStr}`)
      .digest('hex');

    // Check if already exists
    const existing = await base44.entities.IntegrationOutbox.filter({
      idempotency_key: idempotencyKey
    });

    if (existing.length > 0) {
      // Return existing record (idempotent)
      return Response.json(existing[0]);
    }

    // Create new outbox item
    const item = await base44.entities.IntegrationOutbox.create({
      integration_id,
      operation,
      stable_resource_id,
      payload_json,
      idempotency_key,
      status: 'queued',
      attempt_count: 0,
      next_attempt_at: new Date().toISOString()
    });

    return Response.json(item);
  } catch (error) {
    console.error('enqueueOutbox error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});