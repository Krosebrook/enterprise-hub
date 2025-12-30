import React from 'react';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PolicyEnforcementBanner({ 
  policy, 
  violation, 
  onRequestException, 
  onCancel 
}) {
  const enforcementConfig = {
    block: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      title: 'Action Blocked by Policy'
    },
    warn: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      title: 'Policy Warning'
    },
    audit_only: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      title: 'Policy Violation Logged'
    }
  };

  const config = enforcementConfig[policy.enforcement_level] || enforcementConfig.warn;
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-white`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${config.textColor}`}>{config.title}</h3>
          <p className={`text-sm ${config.textColor} mt-1`}>
            {policy.name}: {policy.description}
          </p>
          {violation && (
            <div className="mt-2 p-2 bg-white rounded text-xs">
              <p className="font-medium">Violation Details:</p>
              <pre className="mt-1 text-slate-600">
                {JSON.stringify(violation, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {policy.enforcement_level === 'block' && onRequestException && (
            <Button size="sm" variant="outline" onClick={onRequestException}>
              Request Exception
            </Button>
          )}
          {policy.enforcement_level !== 'block' && onCancel && (
            <Button size="sm" variant="outline" onClick={onCancel}>
              Continue Anyway
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {policy.enforcement_level === 'block' ? 'Go Back' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );
}