import React from 'react';

export const Badge = ({ status, size = 'md' }) => {
  const normalized = (status || '').toLowerCase();

  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const dots = {
    pending: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-rose-500',
    cancelled: 'bg-slate-400',
    active: 'bg-emerald-500',
    inactive: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-medium',
  };

  const styleClass = styles[normalized] || 'bg-slate-50 text-slate-700 border-slate-200';
  const dotClass = dots[normalized] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${styleClass} ${sizeClasses[size]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default Badge;

