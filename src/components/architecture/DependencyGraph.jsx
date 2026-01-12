import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Database, Server, MessageSquare } from 'lucide-react';

const getServiceIcon = (service) => {
  if (service.database_type && service.database_type !== 'none') return Database;
  if (service.has_api) return Server;
  return MessageSquare;
};

export default function DependencyGraph({ services, connections }) {
  const dependencyMap = useMemo(() => {
    const map = new Map();
    services.forEach(service => {
      map.set(service.id, {
        service,
        outgoing: [],
        incoming: []
      });
    });

    connections.forEach(conn => {
      const source = map.get(conn.source_service_id);
      const target = map.get(conn.target_service_id);
      if (source && target) {
        source.outgoing.push({ connection: conn, target: target.service });
        target.incoming.push({ connection: conn, source: source.service });
      }
    });

    return map;
  }, [services, connections]);

  const sortedServices = useMemo(() => {
    return Array.from(dependencyMap.values()).sort((a, b) => {
      // Services with no incoming dependencies first
      if (a.incoming.length === 0 && b.incoming.length > 0) return -1;
      if (a.incoming.length > 0 && b.incoming.length === 0) return 1;
      // Then by number of outgoing connections
      return b.outgoing.length - a.outgoing.length;
    });
  }, [dependencyMap]);

  const getConnectionColor = (type) => {
    switch (type) {
      case 'sync': return 'bg-blue-500';
      case 'async': return 'bg-purple-500';
      case 'event': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <Card data-b44-sync="true" className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Dependency Graph</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {sortedServices.map(({ service, incoming, outgoing }) => {
          const Icon = getServiceIcon(service);
          return (
            <div key={service.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-sm">{service.name}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {incoming.length} in / {outgoing.length} out
                </Badge>
              </div>

              {outgoing.length > 0 && (
                <div className="space-y-1 ml-6">
                  <div className="text-xs text-slate-500 font-medium">Dependencies:</div>
                  {outgoing.map((dep, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-700">{dep.target.name}</span>
                      <Badge className={`${getConnectionColor(dep.connection.connection_type)} text-white text-xs`}>
                        {dep.connection.protocol}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {incoming.length > 0 && (
                <div className="space-y-1 ml-6 mt-2">
                  <div className="text-xs text-slate-500 font-medium">Used by:</div>
                  {incoming.map((dep, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-3 h-3 flex items-center justify-center">←</div>
                      <span>{dep.source.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {services.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No services added yet
          </div>
        )}

        {services.length > 0 && connections.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No connections defined yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}