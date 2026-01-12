import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  GitBranch, 
  Bot, 
  Shield, 
  DollarSign, 
  Rocket, 
  CheckCircle,
  AlertCircle,
  UserPlus,
  Code
} from 'lucide-react';

const activityIcons = {
  architecture_created: GitBranch,
  architecture_deployed: Rocket,
  architecture_validated: CheckCircle,
  agent_created: Bot,
  agent_deployed: Bot,
  agent_trained: Bot,
  compliance_violation: AlertCircle,
  compliance_resolved: Shield,
  budget_alert: DollarSign,
  user_joined: UserPlus,
  code_generated: Code
};

const activityColors = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-slate-100 text-slate-600'
};

export default function ActivityFeed({ activities = [], maxItems = 5 }) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-1"
      data-b44-sync="component-activity-feed"
    >
      {displayActivities.map((activity, index) => {
        const Icon = activityIcons[activity.activity_type] || GitBranch;
        const colorClass = activityColors[activity.color] || activityColors.blue;
        
        return (
          <div 
            key={activity.id || index}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900">
                {activity.user_name && (
                  <span className="font-medium">{activity.user_name} </span>
                )}
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-sm text-slate-500 truncate">{activity.description}</p>
              )}
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {activity.created_date 
                ? formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })
                : 'Just now'
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}