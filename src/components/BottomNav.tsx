"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ScanLine, User, Bell, StickyNote, Home as HomeIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Itinerary', href: '/itinerary', icon: Calendar },
    { label: 'Notes', href: '/notes', icon: StickyNote },
    { label: 'Scan', href: '/scan', icon: ScanLine, isCenter: true },
    { label: 'Alerts', href: '/notifications', icon: Bell },
    { label: 'Profile', href: '/profile', icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

    // Do not show tab bar on login screens
    if (pathname.startsWith('/login') || pathname.startsWith('/auto-login')) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
            <nav className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 relative">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname === '/' && item.href === '/itinerary');

                    if (item.isCenter) {
                        return (
                            <Link key={item.href} href={item.href} className="relative -top-5 flex flex-col items-center justify-center">
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 duration-200",
                                    isActive ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
                                )}>
                                    <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={cn(
                                    "text-[10px] mt-1 font-semibold",
                                    isActive ? "text-primary dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                                )}>{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-95 transition-transform"
                        >
                            <div className={cn(
                                "p-1.5 rounded-full mb-0.5",
                                isActive ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary" : "text-slate-400 dark:text-slate-500"
                            )}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium leading-none",
                                isActive ? "font-bold text-primary dark:text-foreground" : "text-slate-500 dark:text-slate-500"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    );
}
