import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ChevronRight } from 'lucide-react';

export default function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = 'blue' 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    yellow: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100',
    red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
    slate: 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
  };

  return (
    <Link 
      data-b44-sync="true"
      to={createPageUrl(href)}
      className="group block p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
      data-b44-sync="component-quick-action-card"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]} transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}