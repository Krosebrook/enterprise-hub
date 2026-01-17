import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pipeline_id, commit_sha, commit_message, trigger_type } = await req.json();

    if (!pipeline_id) {
      return Response.json({ error: 'Missing pipeline_id' }, { status: 400 });
    }

    // Fetch pipeline
    const pipelines = await base44.entities.Pipeline.filter({ id: pipeline_id });
    if (!pipelines.length) {
      return Response.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    const pipeline = pipelines[0];

    // Create pipeline run
    const stages = pipeline.stages.map(stage => ({
      ...stage,
      status: 'pending',
      logs: ''
    }));

    const run = await base44.entities.PipelineRun.create({
      pipeline_id,
      architecture_id: pipeline.architecture_id,
      service_id: pipeline.service_id,
      status: 'running',
      trigger_type: trigger_type || 'manual',
      commit_sha: commit_sha || 'N/A',
      commit_message: commit_message || 'Manual trigger',
      triggered_by: user.email,
      stages,
      started_at: new Date().toISOString()
    });

    // Execute stages
    let allSuccess = true;
    let totalDuration = 0;
    const updatedStages = [];

    for (const stage of pipeline.stages.filter(s => s.enabled)) {
      const stageStartTime = Date.now();
      const stageIndex = stages.findIndex(s => s.name === stage.name);

      try {
        // Simulate stage execution
        const logs = await executeStage(stage.name, pipeline);
        const duration = Date.now() - stageStartTime;
        totalDuration += duration;

        updatedStages.push({
          name: stage.name,
          status: 'success',
          started_at: new Date(stageStartTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          logs
        });
      } catch (error) {
        allSuccess = false;
        const duration = Date.now() - stageStartTime;
        totalDuration += duration;

        updatedStages.push({
          name: stage.name,
          status: 'failed',
          started_at: new Date(stageStartTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          error_message: error.message,
          logs: error.logs || ''
        });

        // Stop pipeline on failure
        break;
      }
    }

    // Update run with final status
    const finalRun = await base44.entities.PipelineRun.update(run.id, {
      status: allSuccess ? 'success' : 'failed',
      stages: updatedStages,
      total_duration_ms: totalDuration,
      completed_at: new Date().toISOString()
    });

    return Response.json(finalRun);
  } catch (error) {
    console.error('Pipeline execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeStage(stageName, pipeline) {
  let logs = `[${stageName.toUpperCase()}] Starting...\n`;

  switch (stageName) {
    case 'lint':
      logs += '✓ Running ESLint...\n';
      logs += '✓ Checking code style...\n';
      logs += '✓ Linting passed\n';
      break;

    case 'test':
      logs += '✓ Installing dependencies...\n';
      logs += '✓ Running unit tests...\n';
      logs += '✓ Test coverage: 85%\n';
      logs += '✓ All tests passed\n';
      break;

    case 'build':
      logs += '✓ Building Docker image...\n';
      logs += '✓ Image: myrepo/service:latest\n';
      logs += '✓ Pushing to registry...\n';
      logs += '✓ Build successful\n';
      break;

    case 'deploy_staging':
      logs += '✓ Deploying to staging environment...\n';
      logs += '✓ Rolling out pods...\n';
      logs += '✓ Health checks passed\n';
      logs += '✓ Deployment successful\n';
      break;

    case 'deploy_prod':
      logs += '✓ Deploying to production...\n';
      logs += '✓ Running pre-deployment checks...\n';
      logs += '✓ Blue-green deployment started...\n';
      logs += '✓ Traffic switched\n';
      logs += '✓ Production deployment successful\n';
      break;
  }

  return logs;
}