"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StickyNote } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function FloatingNotes() {
    const pathname = usePathname();

    // Do not show on login screens or on the notes page itself (though floating is fine there too)
    if (pathname.startsWith('/login') || pathname.startsWith('/auto-login')) {
        return null;
    }

    const isActive = pathname === '/notes';

    return (
        <div className="fixed right-4 z-[60]" style={{ top: 'calc(1rem + var(--safe-area-inset-top))' }}>
            <Link
                href="/notes"
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 active:scale-95 group",
                    isActive
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900"
                )}
            >
                <div className={cn(
                    "p-1 rounded-lg transition-colors",
                    isActive ? "bg-white/20" : "bg-primary/5 dark:bg-primary/10 group-hover:bg-primary/20 text-primary"
                )}>
                    <StickyNote size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-xs font-bold tracking-tight uppercase">My Notes</span>

                {/* Visual pulse indicator when in active session */}
                {!isActive && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                )}
            </Link>
        </div>
    );
}
