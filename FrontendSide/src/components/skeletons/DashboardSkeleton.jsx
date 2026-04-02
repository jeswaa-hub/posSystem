import React from 'react';
import Skeleton from '../common/Skeleton';

const DashboardSkeleton = () => {
  return (
    <div className="p-2 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-dark-800 rounded-3xl border border-dark-700 p-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="w-12 h-12 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="xl:col-span-2 bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6 h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
          <Skeleton className="w-full h-[300px] rounded-xl" />
        </div>

        {/* Top Products */}
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6 h-[400px]">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6 h-[400px]">
          <Skeleton className="h-5 w-48 mb-6" />
          <div className="flex items-center justify-center h-full pb-6">
             <Skeleton className="w-64 h-64 rounded-full" />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6 h-[400px]">
          <Skeleton className="h-5 w-48 mb-6" />
          <div className="flex items-center justify-center h-full pb-6">
             <Skeleton className="w-64 h-64 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
