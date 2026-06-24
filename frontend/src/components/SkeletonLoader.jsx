import React from 'react';

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-800 rounded ${className}`}></div>
);

export const SkeletonCard = () => (
  <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <div className="flex items-center space-x-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </div>
);

export const PropertyDetailSkeleton = () => (
  <div className="min-h-screen bg-[#0b0f19] py-12 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">
    {/* Hero Skeleton */}
    <div className="w-full h-[60vh] rounded-2xl overflow-hidden relative">
      <Skeleton className="w-full h-full" />
      <div className="absolute bottom-8 left-8 space-y-4 w-2/3 z-20">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-8">
        {/* Quick Overview Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 rounded-lg space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            ))}
          </div>
        </div>

        {/* About Section Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Gallery Section Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Form Skeleton */}
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);
