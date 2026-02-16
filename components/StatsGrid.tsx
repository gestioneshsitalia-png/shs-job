
import React from 'react';

interface StatItem {
  label: string;
  value: string | number;
  trend?: string;
  trendColor?: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
            {stat.trend && (
              <span className={`text-xs font-bold ${stat.trendColor || 'text-slate-400'} bg-slate-50 px-2 py-0.5 mb-1`}>
                {stat.trend}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
