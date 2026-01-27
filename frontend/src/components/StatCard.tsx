import { ReactNode } from "react";

export function StatCard({
  title,
  value,
  color,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  color?: string;
  icon?: ReactNode;
  trend?: { value: string; isPositive: boolean };
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg card-hover border border-slate-100 animate-fade-in relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          {icon && <span className="text-2xl opacity-50">{icon}</span>}
        </div>
        
        <div className="flex items-end justify-between">
          <p className={`text-4xl font-bold ${color || 'text-slate-900'} transition-all group-hover:scale-105`}>
            {value}
          </p>
          
          {trend && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
