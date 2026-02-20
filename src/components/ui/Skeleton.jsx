import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect' }) => {
    const baseStyles = 'animate-pulse bg-gray-200 dark:bg-gray-700';
    const variants = {
        rect: 'rounded-2xl',
        circle: 'rounded-full',
        text: 'rounded-md h-4 w-full',
    };

    return <div className={`${baseStyles} ${variants[variant]} ${className}`} />;
};

export const DashboardSkeleton = () => {
    return (
        <div className="min-h-screen pb-24 bg-gradient-to-br from-white via-indigo-50 to-indigo-100 dark:from-gray-900 dark:via-indigo-950 dark:to-indigo-900">
            <header className="pt-32 pb-10 px-6">
                <div className="max-w-4xl mx-auto border-b border-gray-100 dark:border-gray-900 pb-8">
                    <Skeleton className="h-10 w-48 mb-4" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Skeleton className="md:col-span-2 h-64" />
                    <Skeleton className="h-64" />
                </div>

                <div className="mb-14">
                    <Skeleton className="h-6 w-40 mb-8 mx-1" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-40" />
                        ))}
                    </div>
                </div>

                <div>
                    <Skeleton className="h-6 w-48 mb-8 mx-1" />
                    <Skeleton className="h-96 rounded-[3rem]" />
                </div>
            </main>
        </div>
    );
};
