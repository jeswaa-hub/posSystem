import React from 'react';
import Skeleton from '../common/Skeleton';

const TableSkeleton = ({ 
  headers = 5, 
  rows = 8,
  hasSearch = true,
  hasFilter = true,
  title = "Loading...",
  subtitle = "Please wait"
}) => {
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

      {/* Table Container */}
      <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-dark-700 flex flex-col sm:flex-row justify-between gap-4">
          {hasSearch && (
            <div className="relative max-w-md flex-1">
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          )}
          {hasFilter && (
            <div className="flex gap-2">
               <Skeleton className="h-12 w-32 rounded-2xl" />
               <Skeleton className="h-12 w-32 rounded-2xl" />
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="bg-dark-900/50 border-b border-dark-700 p-4 flex justify-between gap-4">
           {Array.from({ length: headers }).map((_, i) => (
             <Skeleton key={i} className="h-4 flex-1" />
           ))}
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {Array.from({ length: rows }).map((_, i) => (
             <div key={i} className="flex items-center gap-4 py-2 border-b border-dark-700/50 last:border-0">
               {Array.from({ length: headers }).map((_, j) => (
                 <Skeleton key={j} className="h-4 flex-1" />
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

export default TableSkeleton;
