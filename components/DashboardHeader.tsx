import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  showBackButton?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

/**
 * Clean, minimal header component for all dashboard pages
 * Inspired by modern SaaS design - no gradients, generous spacing
 */
export function DashboardHeader({
  title,
  description,
  icon: Icon,
  showBackButton = false,
  onRefresh,
  actions
}: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-8 py-10 max-w-7xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-6 -ml-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}

            <div className="flex items-center gap-4 mb-3">
              {Icon && (
                <div className="p-2.5 bg-gray-900 rounded-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              )}
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">{title}</h1>
            </div>

            <p className="text-lg text-gray-600 max-w-3xl">{description}</p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
