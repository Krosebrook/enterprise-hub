import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function TraceFlow({ trace }) {
  const buildSpanTree = (spans) => {
    const spanMap = {};
    const roots = [];

    spans.forEach(span => {
      spanMap[span.span_id] = { ...span, children: [] };
    });

    Object.values(spanMap).forEach(span => {
      if (span.parent_span_id && spanMap[span.parent_span_id]) {
        spanMap[span.parent_span_id].children.push(span);
      } else {
        roots.push(span);
      }
    });

    return roots;
  };

  const SpanNode = ({ span, depth = 0 }) => (
    <div className="mb-2">
      <div className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-200 ml-4" style={{ marginLeft: `${depth * 20}px` }}>
        {span.status === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-xs text-slate-900">{span.operation}</span>
            <Badge variant="outline" className="text-xs">{span.service_name}</Badge>
            <span className="text-xs text-slate-600">{span.duration_ms}ms</span>
          </div>
          {span.logs && span.logs.length > 0 && (
            <div className="text-xs text-slate-600 space-y-0.5">
              {span.logs.slice(0, 3).map((log, idx) => (
                <div key={idx}>{log.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      {span.children?.map(child => (
        <SpanNode key={child.span_id} span={child} depth={depth + 1} />
      ))}
    </div>
  );

  const spanTree = buildSpanTree(trace.spans || []);
  const maxDuration = Math.max(...(trace.spans || []).map(s => s.duration_ms), trace.duration_ms);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Trace Flow</span>
          <Badge variant={trace.error ? 'destructive' : 'default'}>
            {trace.error ? 'Error' : 'Success'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Overview */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50 rounded text-xs">
          <div>
            <span className="text-slate-600">Total Duration:</span>
            <p className="font-semibold">{trace.duration_ms}ms</p>
          </div>
          <div>
            <span className="text-slate-600">Spans:</span>
            <p className="font-semibold">{trace.spans?.length || 0}</p>
          </div>
        </div>

        {/* Critical Path */}
        <div className="p-2 bg-slate-50 rounded">
          <p className="text-xs font-medium text-slate-600 mb-2">Critical Path</p>
          <div className="space-y-1">
            {spanTree.map(span => (
              <SpanNode key={span.span_id} span={span} />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-2 bg-slate-50 rounded">
          <p className="text-xs font-medium text-slate-600 mb-2">Timeline</p>
          <div className="space-y-1">
            {(trace.spans || []).map(span => {
              const width = (span.duration_ms / maxDuration) * 100;
              return (
                <div key={span.span_id}>
                  <div className="text-xs text-slate-600 mb-1">{span.operation}</div>
                  <div className="h-6 bg-slate-200 rounded overflow-hidden">
                    <div
                      className={span.status === 'error' ? 'bg-red-500' : 'bg-green-500'}
                      style={{ width: `${width}%`, height: '100%' }}
                      title={`${span.duration_ms}ms`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Details */}
        {trace.error && trace.error_message && (
          <div className="p-2 bg-red-50 rounded border border-red-200">
            <p className="text-xs font-medium text-red-900 mb-1">Error</p>
            <p className="text-xs text-red-700 break-words">{trace.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}