import React from 'react';
import Skeleton from '../common/Skeleton';

const UsersSkeleton = () => {
  return (
    <div className="p-2 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>

      {/* Search Section */}
      <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl">
        <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
      </div>

      {/* Users Table */}
      <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-dark-900/50 border-b border-dark-700 p-4 grid grid-cols-4 gap-4">
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
        </div>

        {/* Rows */}
        <div className="p-4 space-y-4">
           {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="flex items-center gap-4 py-2 border-b border-dark-700/50 last:border-0">
               <div className="flex items-center gap-4 flex-1">
                 <Skeleton className="w-10 h-10 rounded-full" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-4 w-32" />
                   <Skeleton className="h-3 w-48" />
                 </div>
               </div>
               <Skeleton className="h-6 w-20 rounded-lg" />
               <Skeleton className="h-6 w-20 rounded-lg" />
               <div className="flex justify-end gap-2">
                 <Skeleton className="h-8 w-8 rounded-lg" />
                 <Skeleton className="h-8 w-8 rounded-lg" />
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default UsersSkeleton;
