import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { approval_id, status, rejection_reason } = await req.json();

    if (!approval_id || !['approved', 'rejected'].includes(status)) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Update approval
    const approval = await base44.entities.DeploymentApproval.update(approval_id, {
      status,
      approved_by: user.email,
      approved_at: new Date().toISOString(),
      rejection_reason: status === 'rejected' ? rejection_reason : null
    });

    // If approved, enqueue deployment to outbox
    if (status === 'approved') {
      const pipelineRun = await base44.entities.PipelineRun.filter({
        id: approval.pipeline_run_id
      }).then(data => data[0]);

      if (pipelineRun) {
        await base44.functions.invoke('enqueueOutbox', {
          integration_id: 'slack',
          operation: 'deploy_notification',
          stable_resource_id: `deployment_${approval.pipeline_run_id}`,
          payload_json: {
            status: 'approved',
            environment: approval.environment,
            approved_by: user.email,
            pipeline_run_id: approval.pipeline_run_id
          }
        });
      }
    }

    return Response.json({ success: true, approval });
  } catch (error) {
    console.error('Approval error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});