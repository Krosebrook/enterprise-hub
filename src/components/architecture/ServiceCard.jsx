import React from "react";
import { Database, Globe, Server } from "lucide-react";

const languageColors = {
  go: "bg-cyan-500",
  nodejs: "bg-green-500",
  python: "bg-blue-500",
  java: "bg-orange-500",
  rust: "bg-red-500",
  csharp: "bg-purple-500",
};

const languageLabels = {
  go: "Go",
  nodejs: "Node.js",
  python: "Python",
  java: "Java",
  rust: "Rust",
  csharp: "C#",
};

const databaseIcons = {
  postgresql: Database,
  mysql: Database,
  mongodb: Database,
  redis: Server,
  elasticsearch: Server,
  none: null,
};

const healthColors = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  unhealthy: "bg-red-500",
  unknown: "bg-slate-400",
};

export default function ServiceCard({
  service,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  style,
}) {
  const DbIcon = databaseIcons[service.database_type];

  return (
    <div
      data-b44-sync="true"
      className={`
        absolute cursor-move bg-white rounded-lg shadow-md border-2 transition-all duration-200
        ${isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-400"}
      `}
      style={{
        left: service.canvas_position_x || 100,
        top: service.canvas_position_y || 100,
        width: 200,
        minHeight: 130,
        ...style,
      }}
      draggable
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Title Bar */}
      <div
        className={`${languageColors[service.language] || "bg-slate-500"} text-white px-4 py-2 rounded-t-md flex items-center justify-between`}
      >
        <span className="font-semibold text-sm truncate">{service.name}</span>
        <Globe className="w-4 h-4 flex-shrink-0" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Language:</span>
          <span className="font-medium">
            {languageLabels[service.language] || service.language}
          </span>
        </div>

        {service.framework && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Framework:</span>
            <span className="font-medium">{service.framework}</span>
          </div>
        )}

        {service.database_type && service.database_type !== "none" && DbIcon && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Database:</span>
            <div className="flex items-center gap-1 font-medium">
              <DbIcon className="w-4 h-4" />
              <span className="capitalize">{service.database_type}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
          <span className="text-slate-600">Status:</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${healthColors[service.health_status] || healthColors.unknown}`}
            />
            <span className="font-medium capitalize">{service.health_status || "unknown"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}