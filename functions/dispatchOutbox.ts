import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RATE_LIMITS = {
  google_sheets: { rpm: 300, rps: 5 },
  google_drive: { rpm: 300, rps: 5 },
  google_docs: { rpm: 300, rps: 5 },
  google_slides: { rpm: 300, rps: 5 },
  google_calendar: { rpm: 300, rps: 5 },
  slack: { rpm: 60, rps: 1 },
  notion: { rpm: 300, rps: 3 },
  resend: { rpm: 120, rps: 2 },
  twilio: { rpm: 60, rps: 1 },
  openai_tts: { rpm: 200, rps: 1 },
  elevenlabs: { rpm: 100, rps: 1 },
  fal_ai: { rpm: 100, rps: 1 },
  brightdata: { rpm: 60, rps: 1 },
  x_twitter: { rpm: 300, rps: 1 },
  hubspot: { rpm: 300, rps: 3 },
  monday: { rpm: 100, rps: 1 },
  zapier: { rpm: 60, rps: 1 },
  linkedin: { rpm: 100, rps: 1 },
  tiktok: { rpm: 60, rps: 1 },
  custom_api: { rpm: 100, rps: 1 }
};

const MAX_ATTEMPTS = 5;
const BACKOFF_MULTIPLIER = 2;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { batchSize = 50 } = await req.json();

    // Fetch queued items
    const queued = await base44.entities.IntegrationOutbox.filter({
      status: 'queued'
    });

    const toBatch = queued
      .filter(item => !item.next_attempt_at || new Date(item.next_attempt_at) <= new Date())
      .slice(0, batchSize);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      dead_letter: 0,
      rate_limited: 0
    };

    // Group by integration for rate limiting
    const byIntegration = {};
    toBatch.forEach(item => {
      if (!byIntegration[item.integration_id]) {
        byIntegration[item.integration_id] = [];
      }
      byIntegration[item.integration_id].push(item);
    });

    for (const [integrationId, items] of Object.entries(byIntegration)) {
      const limits = RATE_LIMITS[integrationId] || RATE_LIMITS.custom_api;
      const minIntervalMs = (60000 / limits.rpm);

      for (const item of items) {
        results.processed++;

        try {
          // Call dispatcher function for this integration
          const dispatchFn = `dispatch${integrationId.replace(/(_)/g, (m) => m[1].toUpperCase())}`;
          
          // Mock dispatch - in production this would call real integration
          const response = await mockDispatchProvider(integrationId, item);

          if (response.status === 429) {
            // Rate limited
            results.rate_limited++;
            const retryAfter = parseInt(response.headers?.['retry-after'] || '60');
            await base44.entities.IntegrationOutbox.update(item.id, {
              status: 'queued',
              rate_limited_at: new Date().toISOString(),
              next_attempt_at: new Date(Date.now() + retryAfter * 1000).toISOString()
            });
          } else if (response.ok) {
            // Success
            results.sent++;
            await base44.entities.IntegrationOutbox.update(item.id, {
              status: 'sent',
              provider_response_json: response.data,
              attempt_count: item.attempt_count + 1
            });
          } else {
            throw new Error(`Provider returned ${response.status}`);
          }
        } catch (error) {
          const nextAttempt = item.attempt_count + 1;

          if (nextAttempt >= MAX_ATTEMPTS) {
            // Dead letter
            results.dead_letter++;
            await base44.entities.IntegrationOutbox.update(item.id, {
              status: 'dead_letter',
              last_error: error.message,
              attempt_count: nextAttempt
            });
          } else {
            // Retry with backoff
            results.failed++;
            const backoffMs = Math.pow(BACKOFF_MULTIPLIER, nextAttempt) * 1000;
            await base44.entities.IntegrationOutbox.update(item.id, {
              status: 'queued',
              last_error: error.message,
              attempt_count: nextAttempt,
              next_attempt_at: new Date(Date.now() + backoffMs).toISOString()
            });
          }
        }

        // Rate limit delay
        await new Promise(r => setTimeout(r, minIntervalMs));
      }
    }

    return Response.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('dispatchOutbox error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function mockDispatchProvider(integrationId, item) {
  // In production, this would call the actual provider API
  // For now, return success response
  return {
    ok: true,
    status: 200,
    data: {
      provider_id: item.integration_id,
      resource_id: item.stable_resource_id,
      timestamp: new Date().toISOString()
    }
  };
}