import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  action,
  backButton = false,
  backTo,
  breadcrumbs,
  children,
}) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="px-6 py-4">
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                {crumb.href ? (
                  <button
                    onClick={() => navigate(crumb.href)}
                    className="hover:text-slate-900 transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-slate-900">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => backTo ? navigate(backTo) : navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}