import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MetricCard({ title, value, unit, trend, icon: Icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    slate: "bg-slate-50 text-slate-600",
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === "up") return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend.direction === "down") return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.direction === "up") return "text-green-600";
    if (trend.direction === "down") return "text-red-600";
    return "text-slate-500";
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300"
      data-b44-sync="component-metric-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            {unit && <span className="text-sm text-slate-500">{unit}</span>}
          </div>

          {trend && (
            <div className={`flex items-center gap-1.5 mt-3 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="font-medium">
                {trend.value > 0 ? "+" : ""}
                {trend.value}
                {trend.percent ? "%" : ""}
              </span>
              <span className="text-slate-500">{trend.label}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
