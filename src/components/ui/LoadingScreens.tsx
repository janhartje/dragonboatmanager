import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="max-w-7xl mx-auto mb-6 mt-4">
        <div className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
          {/* Header Actions */}
          <div className="flex items-center gap-2">
             <div className="hidden md:block h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
             <div className="hidden md:block h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
             <div className="h-10 w-10 md:w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton: Event List */}
        <div className="lg:col-span-1 flex flex-col gap-4 order-2 lg:order-1">
           {/* Section Header */}
           <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-2 ml-1"></div>
           {/* Event Cards */}
           {[1, 2, 3].map((i) => (
             <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
               <div className="flex justify-between mb-4">
                 <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                 <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
               </div>
               <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
               <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
               <div className="mt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
                 <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                 <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
               </div>
             </div>
           ))}
        </div>

        {/* Right Column Skeleton: Paddler Grid */}
        <div className="lg:col-span-2 flex flex-col gap-4 order-1 lg:order-2">
            {/* Grid Container */}
           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 h-full min-h-[600px]">
             <div className="flex justify-between items-center mb-6">
               <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
               <div className="flex gap-2">
                 <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                 <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                 <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
               </div>
             </div>
             
             {/* Paddler Cards Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                 <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <div className="space-y-2">
                       <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                       <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                     </div>
                     <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
