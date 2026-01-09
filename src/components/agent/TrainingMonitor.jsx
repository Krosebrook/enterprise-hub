import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  queued: { 
    label: 'Queued', 
    color: 'bg-slate-100 text-slate-700', 
    icon: Clock 
  },
  preprocessing: { 
    label: 'Preprocessing', 
    color: 'bg-blue-100 text-blue-700', 
    icon: Loader2,
    animate: true
  },
  training: { 
    label: 'Training', 
    color: 'bg-purple-100 text-purple-700', 
    icon: Loader2,
    animate: true
  },
  validating: { 
    label: 'Validating', 
    color: 'bg-yellow-100 text-yellow-700', 
    icon: Loader2,
    animate: true
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-700', 
    icon: CheckCircle 
  },
  failed: { 
    label: 'Failed', 
    color: 'bg-red-100 text-red-700', 
    icon: XCircle 
  }
};

export default function TrainingMonitor({ agentId, onComplete }) {
  const { data: trainingJobs = [], isLoading } = useQuery({
    queryKey: ['training-jobs', agentId],
    queryFn: () => base44.entities.AgentTrainingJob.filter({ agent_id: agentId }),
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !!agentId,
    select: (data) => data.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )
  });

  const activeJob = trainingJobs.find(job => 
    ['queued', 'preprocessing', 'training', 'validating'].includes(job.status)
  );

  useEffect(() => {
    if (activeJob?.status === 'completed' && onComplete) {
      onComplete(activeJob);
    }
  }, [activeJob?.status]);

  const estimateTimeRemaining = (job) => {
    if (!job || job.status === 'queued') return 'Estimating...';
    
    const progress = job.progress_percent || 0;
    if (progress < 5) return 'Calculating...';
    
    const started = new Date(job.started_at);
    const now = new Date();
    const elapsed = now - started;
    const total = (elapsed / progress) * 100;
    const remaining = total - elapsed;
    
    const minutes = Math.ceil(remaining / 60000);
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '~1 minute';
    return `~${minutes} minutes`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!trainingJobs.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-slate-500 text-sm">
          No training jobs yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Training Job */}
      {activeJob && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Training in Progress</CardTitle>
              <Badge className={statusConfig[activeJob.status].color}>
                {statusConfig[activeJob.status].animate && (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                )}
                {statusConfig[activeJob.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700">Progress</span>
                <span className="font-medium text-blue-900">
                  {activeJob.progress_percent || 0}%
                </span>
              </div>
              <Progress value={activeJob.progress_percent || 0} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">Training Data</div>
                <div className="text-sm font-medium">
                  {activeJob.training_data_rows || 0} examples
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">Est. Remaining</div>
                <div className="text-sm font-medium">
                  {estimateTimeRemaining(activeJob)}
                </div>
              </div>
            </div>

            {/* Queue Position */}
            {activeJob.status === 'queued' && activeJob.queue_position > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white rounded-lg p-3">
                <Clock className="w-4 h-4" />
                <span>Position in queue: {activeJob.queue_position}</span>
              </div>
            )}

            {/* Started Time */}
            {activeJob.started_at && (
              <div className="text-xs text-slate-600">
                Started {formatDistanceToNow(new Date(activeJob.started_at), { addSuffix: true })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Training History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Training History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-64 overflow-y-auto">
          {trainingJobs.slice(0, 5).map((job) => {
            const StatusIcon = statusConfig[job.status].icon;
            const isActive = job.id === activeJob?.id;
            
            return (
              <div 
                key={job.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isActive ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <StatusIcon 
                    className={`w-4 h-4 ${
                      statusConfig[job.status].animate ? 'animate-spin' : ''
                    } ${job.status === 'completed' ? 'text-green-600' : 
                         job.status === 'failed' ? 'text-red-600' : 'text-slate-400'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {job.training_data_rows || 0} examples
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(job.created_date), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                {job.status === 'completed' && job.accuracy_after && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="font-medium text-green-700">
                      {job.accuracy_after}%
                    </span>
                  </div>
                )}

                {job.status === 'failed' && (
                  <Badge className="bg-red-100 text-red-700 text-xs">
                    Failed
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}