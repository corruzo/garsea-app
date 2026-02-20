import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect' }) => {
    const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-800';
    const variants = {
        rect: 'rounded-2xl',
        circle: 'rounded-full',
        text: 'rounded-md h-4 w-full',
    };

    return <div className={`${baseStyles} ${variants[variant]} ${className}`} />;
};

export const DashboardSkeleton = () => {
    return (
        <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950">
            <header className="px-6 py-10">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <Skeleton className="h-10 w-56 mb-3" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="hidden sm:block h-10 w-44 rounded-2xl" />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="md:col-span-2 h-72 rounded-[2.5rem]" />
                    <Skeleton className="h-72 rounded-[2.5rem]" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-[2rem]" />
                    ))}
                </div>

                <div className="space-y-6">
                    <Skeleton className="h-6 w-48 ml-2" />
                    <Skeleton className="h-[400px] rounded-[3rem]" />
                </div>
            </main>
        </div>
    );
};
