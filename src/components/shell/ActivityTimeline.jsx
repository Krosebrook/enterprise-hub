import React from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export default function ActivityTimeline({ activities, emptyMessage = 'No activity yet' }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => (
        <div key={activity.id || idx} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full ${
              activity.color === 'blue' ? 'bg-blue-500' :
              activity.color === 'green' ? 'bg-green-500' :
              activity.color === 'yellow' ? 'bg-yellow-500' :
              activity.color === 'red' ? 'bg-red-500' :
              'bg-slate-300'
            }`} />
            {idx < activities.length - 1 && (
              <div className="w-px h-full bg-slate-200 mt-2" />
            )}
          </div>
          
          <div className="flex-1 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-sm text-slate-600 mt-1">
                    {activity.description}
                  </p>
                )}
                {activity.user_name && (
                  <p className="text-xs text-slate-500 mt-1">
                    by {activity.user_name}
                  </p>
                )}
              </div>
              <time className="text-xs text-slate-500 whitespace-nowrap">
                {format(new Date(activity.created_date), 'MMM d, h:mm a')}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}