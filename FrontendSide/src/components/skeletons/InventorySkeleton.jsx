import React from 'react';
import Skeleton from '../common/Skeleton';

const InventorySkeleton = () => {
  return (
    <div className="p-2 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
           <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-40 mt-2" />
            </div>
            <Skeleton className="absolute right-0 top-0 p-6 w-24 h-24 rounded-full opacity-5" />
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-dark-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <div className="flex gap-2">
             <Skeleton className="h-12 w-12 rounded-2xl" />
             <Skeleton className="h-12 w-40 rounded-2xl" />
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-dark-900/50 border-b border-dark-700 p-4 grid grid-cols-6 gap-4">
           {[1, 2, 3, 4, 5, 6].map((i) => (
             <Skeleton key={i} className="h-4 w-full" />
           ))}
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="flex items-center gap-4 py-2 border-b border-dark-700/50 last:border-0">
               {Array.from({ length: 6 }).map((_, j) => (
                 <Skeleton key={j} className="h-4 w-full" />
               ))}
             </div>
           ))}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-dark-700 flex justify-between items-center">
           <Skeleton className="h-4 w-32" />
           <div className="flex gap-2">
             <Skeleton className="h-8 w-8 rounded-lg" />
             <Skeleton className="h-8 w-8 rounded-lg" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySkeleton;
