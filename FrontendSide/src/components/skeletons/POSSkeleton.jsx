import React from 'react';
import Skeleton from '../common/Skeleton';

const POSSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-2 relative overflow-hidden animate-fade-in">
      {/* Product Section (Left) */}
      <div className="flex-1 flex flex-col min-w-0 bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
        {/* Header & Search */}
        <div className="p-6 border-b border-dark-700 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
               <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="bg-dark-900 rounded-2xl p-3 border border-dark-700 flex flex-col gap-3">
                <Skeleton className="w-full aspect-square rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section (Right) */}
      <div className="hidden lg:flex w-[400px] flex-col bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
        {/* Cart Header */}
        <div className="p-6 border-b border-dark-700 flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-dark-900 p-3 rounded-2xl flex gap-3 border border-dark-700">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="flex flex-col justify-between items-end py-1">
                 <Skeleton className="h-4 w-12" />
                 <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="p-6 bg-dark-900 border-t border-dark-700 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /></div>
            <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /></div>
            <div className="border-t border-dark-700 pt-2 flex justify-between">
               <Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <Skeleton className="h-12 w-full rounded-xl" />
             <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default POSSkeleton;
