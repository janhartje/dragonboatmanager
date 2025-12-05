import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <div className="h-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
           <div className="h-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-2 lg:row-span-2">
           <div className="h-[600px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
