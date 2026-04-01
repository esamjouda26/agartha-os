import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  className?: string;
}

export function KpiCard({ title, value, icon, trend, trendLabel, sparklineData, className }: KpiCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className={cn("overflow-hidden group hover:border-[#d4af37]/50 transition-colors", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-[0.2em] font-bold">
          {title}
        </CardTitle>
        {icon && <div className="text-[#d4af37]">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-widest" style={{ fontFamily: "var(--font-orbitron, Orbitron, sans-serif)" }}>
          {value}
        </div>
        
        {(trend !== undefined || sparklineData) && (
          <div className="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-white/5 pt-4 transition-colors">
            {trend !== undefined && (
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                {isPositive && <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />}
                {isNegative && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />}
                {trend === 0 && <Minus className="h-4 w-4 text-gray-500" />}
                <span className={cn(
                  isPositive ? "text-emerald-600 dark:text-emerald-500" : isNegative ? "text-red-600 dark:text-red-500" : "text-gray-500"
                )}>
                  {Math.abs(trend)}%
                </span>
                {trendLabel && <span className="text-gray-500">{trendLabel}</span>}
              </div>
            )}
            
            {sparklineData && (
              <div className="ml-auto">
                <Sparkline 
                  data={sparklineData} 
                  color={isPositive ? "#10b981" : isNegative ? "#ef4444" : "#d4af37"}
                  className="w-16 h-6"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
