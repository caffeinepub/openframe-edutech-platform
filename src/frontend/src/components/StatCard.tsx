import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  color?: "teal" | "blue" | "green" | "purple" | "orange";
  "data-ocid"?: string;
}

const colorMap = {
  teal: "bg-teal-50 text-teal-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  purple: "bg-purple-50 text-purple-700",
  orange: "bg-orange-50 text-orange-700",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  color = "teal",
  "data-ocid": dataOcid,
}: StatCardProps) {
  return (
    <div
      className="bg-card rounded-xl p-5 shadow-card border border-border"
      data-ocid={dataOcid}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}% from last week
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
