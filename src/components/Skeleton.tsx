/**
 * Skeleton – a shimmer effect placeholder for premium loading states.
 */

"use client";

import { cn } from "@/components/BottomNav";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-800 rounded", className)} />
    );
}

export function DashboardSkeleton() {
    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex justify-between items-center bg-card p-6 rounded-[2rem] border border-border">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex flex-col gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                </div>
            </header>

            <Skeleton className="h-32 w-full rounded-[2rem]" />

            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="aspect-square rounded-[2rem]" />
                <div className="flex flex-col gap-4">
                    <Skeleton className="flex-1 rounded-[2rem]" />
                    <Skeleton className="flex-1 rounded-[2rem]" />
                </div>
            </div>

            <div className="bg-card border border-border rounded-[2rem] p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-2 w-16" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-2 w-16" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ListSkeleton() {
    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-4 pb-2 space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-32" />
            </header>
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
