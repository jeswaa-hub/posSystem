import React from 'react';
import Skeleton from '../common/Skeleton';

const ReportSkeleton = () => {
  return (
    <div className="p-2 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center justify-between">
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
        <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center justify-between">
          <div>
            <Skeleton className="h-3 w-32 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl h-[400px]">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="w-full h-[300px] rounded-xl" />
      </div>
    </div>
  );
};

export default ReportSkeleton;
