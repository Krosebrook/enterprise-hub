import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download } from 'lucide-react';

export default function SequenceDiagram({ services, connections }) {
  const [selectedFlow, setSelectedFlow] = useState(null);

  const flows = useMemo(() => {
    if (!services.length || !connections.length) return [];

    // Find entry point services (services with no incoming connections)
    const entryPoints = services.filter(s => 
      !connections.some(c => c.target_service_id === s.id)
    );

    // Generate flows from each entry point
    const generatedFlows = [];
    
    entryPoints.forEach(entry => {
      const flow = { name: `Flow: ${entry.name}`, steps: [] };
      const visited = new Set();
      
      const traverse = (service, depth = 0) => {
        if (visited.has(service.id) || depth > 10) return;
        visited.add(service.id);

        const outgoing = connections.filter(c => c.source_service_id === service.id);
        
        outgoing.forEach(conn => {
          const target = services.find(s => s.id === conn.target_service_id);
          if (target) {
            flow.steps.push({
              from: service.name,
              to: target.name,
              type: conn.connection_type,
              protocol: conn.protocol,
              description: conn.description || `${conn.protocol.toUpperCase()} call`
            });
            traverse(target, depth + 1);
          }
        });
      };

      traverse(entry);
      if (flow.steps.length > 0) {
        generatedFlows.push(flow);
      }
    });

    return generatedFlows;
  }, [services, connections]);

  const displayFlow = selectedFlow !== null ? flows[selectedFlow] : flows[0];

  const getTypeColor = (type) => {
    switch (type) {
      case 'sync': return 'bg-blue-100 text-blue-700';
      case 'async': return 'bg-purple-100 text-purple-700';
      case 'event': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const exportDiagram = () => {
    if (!displayFlow) return;
    
    let mermaidCode = 'sequenceDiagram\n';
    const participants = new Set();
    
    displayFlow.steps.forEach(step => {
      participants.add(step.from);
      participants.add(step.to);
    });
    
    participants.forEach(p => {
      mermaidCode += `  participant ${p.replace(/\s/g, '_')}\n`;
    });
    
    displayFlow.steps.forEach((step, idx) => {
      const arrow = step.type === 'async' ? '-)' : '->';
      mermaidCode += `  ${step.from.replace(/\s/g, '_')}${arrow}${step.to.replace(/\s/g, '_')}: ${step.description}\n`;
    });

    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sequence-diagram.mmd';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card data-b44-sync="true" className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Sequence Diagram</CardTitle>
          {displayFlow && (
            <Button variant="ghost" size="sm" onClick={exportDiagram}>
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {flows.length > 0 ? (
          <>
            {flows.length > 1 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {flows.map((flow, idx) => (
                  <Button
                    key={idx}
                    variant={selectedFlow === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFlow(idx)}
                  >
                    {flow.name}
                  </Button>
                ))}
              </div>
            )}

            {displayFlow && (
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-500 mb-3">
                    Interaction Flow ({displayFlow.steps.length} steps)
                  </div>
                  
                  {displayFlow.steps.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Service boxes */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-sm font-medium">
                          {step.from}
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          <Badge className={`${getTypeColor(step.type)} text-xs`}>
                            {step.protocol}
                          </Badge>
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-sm font-medium">
                          {step.to}
                        </div>
                      </div>
                      
                      {/* Description */}
                      {step.description && (
                        <div className="text-xs text-slate-600 ml-4 mb-3">
                          {step.description}
                        </div>
                      )}

                      {/* Connector line */}
                      {idx < displayFlow.steps.length - 1 && (
                        <div className="flex justify-center mb-2">
                          <div className="w-px h-4 bg-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            {connections.length === 0 
              ? 'Add connections between services to generate sequence diagrams'
              : 'No interaction flows detected'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}