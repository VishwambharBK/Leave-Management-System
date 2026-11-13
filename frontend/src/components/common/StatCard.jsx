import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const iconBg = colorMap[color] || colorMap.blue;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
        {subtitle && <span className="text-xs text-slate-400 font-normal">{subtitle}</span>}
      </div>

      {trend && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{trend}</span>
        </p>
      )}
    </div>
  );
};

export default StatCard;

