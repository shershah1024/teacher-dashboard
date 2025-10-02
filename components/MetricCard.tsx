import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  variant?: "default" | "accent" | "minimal";
  className?: string;
}

/**
 * Clean, minimal metric card component - no gradients
 * Inspired by modern SaaS dashboards like Every.com
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className
}: MetricCardProps) {

  // Accent variant - single solid color accent
  if (variant === "accent") {
    return (
      <Card className={cn("border border-gray-900 bg-gray-900 hover:shadow-xl transition-shadow", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Icon className="h-6 w-6 text-white" />
            {trend && (
              <Badge className={cn(
                "text-xs font-medium",
                trend.isPositive === false ? "bg-red-500" : "bg-green-500"
              )}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </Badge>
            )}
          </div>
          <div className="text-sm font-medium text-gray-400 mb-1">{title}</div>
          <div className="text-4xl font-semibold text-white mb-2">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-400">{subtitle}</div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Minimal variant - super clean
  if (variant === "minimal") {
    return (
      <Card className={cn("border border-gray-200 bg-white hover:border-gray-300 transition-all", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon className="h-5 w-5 text-gray-700" />
            </div>
            {trend && (
              <Badge variant="outline" className={cn(
                "text-xs font-medium",
                trend.isPositive === false ? "text-red-600 border-red-200" : "text-green-600 border-green-200"
              )}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </Badge>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500">{subtitle}</div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant - balanced
  return (
    <Card className={cn("border border-gray-200 bg-white hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{value}</div>
            {subtitle && (
              <div className="text-sm text-gray-500">{subtitle}</div>
            )}
          </div>
          {trend && (
            <Badge className={cn(
              "text-xs font-medium",
              trend.isPositive === false ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
