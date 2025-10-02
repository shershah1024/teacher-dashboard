/**
 * Loading skeleton components for teacher dashboard
 * Provides clean, minimal loading states for various UI elements
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Skeleton component for MetricCard
 */
export function MetricCardSkeleton({ variant = "default" }: { variant?: "accent" | "minimal" | "default" }) {
  const isAccent = variant === "accent";

  return (
    <Card className={cn(
      "border animate-pulse",
      isAccent ? "border-gray-900 bg-gray-900" : "border-gray-200 bg-white"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "h-6 w-6 rounded",
            isAccent ? "bg-gray-800" : "bg-gray-200"
          )} />
        </div>
        <div className={cn(
          "h-3 w-20 rounded mb-2",
          isAccent ? "bg-gray-800" : "bg-gray-200"
        )} />
        <div className={cn(
          "h-8 w-16 rounded mb-2",
          isAccent ? "bg-gray-800" : "bg-gray-200"
        )} />
        <div className={cn(
          "h-3 w-24 rounded",
          isAccent ? "bg-gray-800" : "bg-gray-200"
        )} />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton component for Target Performance Cards
 */
export function TargetCardSkeleton({ isAccent = false }: { isAccent?: boolean }) {
  return (
    <Card className={cn(
      "border animate-pulse",
      isAccent ? "border-gray-900 bg-gray-900" : "border-gray-200 bg-white"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "h-5 w-5 rounded",
            isAccent ? "bg-gray-800" : "bg-gray-200"
          )} />
          <div className={cn(
            "h-5 w-12 rounded-full",
            isAccent ? "bg-gray-800" : "bg-gray-200"
          )} />
        </div>
        <div className={cn(
          "h-3 w-16 rounded mb-2",
          isAccent ? "bg-gray-800" : "bg-gray-200"
        )} />
        <div className={cn(
          "h-8 w-12 rounded mb-1",
          isAccent ? "bg-gray-800" : "bg-gray-200"
        )} />
        <div className={cn(
          "h-3 w-24 rounded",
          isAccent ? "bg-gray-800" : "bg-gray-200"
        )} />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton component for Key Insights banner
 */
export function InsightsBannerSkeleton() {
  return (
    <Card className="border border-gray-200 bg-white animate-pulse">
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="h-6 w-32 rounded bg-gray-200" />
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded bg-gray-200 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded bg-gray-200 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded bg-gray-200 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-4/5 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="h-10 w-36 rounded-md bg-gray-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton component for Student Cards
 */
export function StudentCardSkeleton() {
  return (
    <Card className="border border-gray-200 bg-white animate-pulse">
      <CardContent className="p-6">
        {/* Hero Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gray-200" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-gray-200" />
              <div className="h-4 w-12 rounded bg-gray-200" />
            </div>
            <div className="h-3 w-40 rounded bg-gray-200" />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="h-7 w-12 rounded bg-gray-200 mb-2 mx-auto" />
              <div className="h-3 w-16 rounded bg-gray-200 mb-2 mx-auto" />
              <div className="h-1 w-full rounded bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-200" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="h-3 w-8 rounded bg-gray-200" />
                  </div>
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Targets */}
        <div className="bg-white rounded-xl p-4 mb-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-12 rounded bg-gray-200" />
                </div>
                <div className="h-2 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-9 rounded-md bg-gray-200" />
          <div className="h-9 w-9 rounded-md bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for Filter Pills
 */
export function FilterPillsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-8 rounded-lg bg-gray-200"
          style={{ width: `${80 + (i * 20)}px` }}
        />
      ))}
    </div>
  );
}
