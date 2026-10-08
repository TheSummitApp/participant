"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useCache } from "@/lib/useCache";
import { ListSkeleton } from "@/components/Skeleton";
import {
    Utensils,
    UtensilsCrossed,
    Clock,
    Calendar,
    ChevronLeft,
    ScanLine,
    Sunrise,
    Sun,
    Moon,
    Coffee,
    Store,
    CheckCircle2,
    Sparkles,
    AlertCircle
} from "lucide-react";

interface MealItem {
    id: string;
    name: string;
    vendor_id: string | null;
    is_locked: boolean;
    vendor_name: string | null;
}

interface FoodSlot {
    id: string;
    summit_id: string;
    meal_date: string;
    meal_type: string;
    start_time?: string | null;
    end_time?: string | null;
    sort_order?: number;
    meals: MealItem[];
}

function formatTime(timeStr?: string | null): string {
    if (!timeStr) return "";
    if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        }
    }
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
            const period = hours >= 12 ? "PM" : "AM";
            const h = hours % 12 || 12;
            const m = minutes.toString().padStart(2, "0");
            return `${h}:${m} ${period}`;
        }
    }
    return timeStr;
}

function getMealIcon(type: string) {
    const lower = type.toLowerCase();
    if (lower.includes("breakfast")) return Sunrise;
    if (lower.includes("lunch")) return Sun;
    if (lower.includes("dinner")) return Moon;
    if (lower.includes("snack") || lower.includes("tea") || lower.includes("coffee")) return Coffee;
    return Utensils;
}

function getMealBadgeColor(type: string) {
    const lower = type.toLowerCase();
    if (lower.includes("breakfast")) {
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
    }
    if (lower.includes("lunch")) {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
    }
    if (lower.includes("dinner")) {
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30";
    }
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
}

function isSlotHappeningNow(slot: FoodSlot): boolean {
    if (!slot.meal_date || !slot.start_time || !slot.end_time) return false;
    const now = new Date();
    const [year, month, day] = slot.meal_date.split("T")[0].split("-").map(Number);
    if (now.getFullYear() !== year || now.getMonth() + 1 !== month || now.getDate() !== day) {
        return false;
    }

    const [sH, sM] = slot.start_time.split(":").map(Number);
    const [eH, eM] = slot.end_time.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sH * 60 + sM;
    const endMinutes = eH * 60 + eM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function formatDateHeading(dateStr: string): { title: string; subtitle: string; isToday: boolean } {
    const dateObj = new Date(dateStr.split("T")[0] + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday =
        dateObj.getFullYear() === today.getFullYear() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getDate() === today.getDate();

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow =
        dateObj.getFullYear() === tomorrow.getFullYear() &&
        dateObj.getMonth() === tomorrow.getMonth() &&
        dateObj.getDate() === tomorrow.getDate();

    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const fullDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    if (isToday) {
        return { title: `Today (${weekday})`, subtitle: fullDate, isToday: true };
    }
    if (isTomorrow) {
        return { title: `Tomorrow (${weekday})`, subtitle: fullDate, isToday: false };
    }
    return { title: weekday, subtitle: fullDate, isToday: false };
}

export default function MealTimetablePage() {
    const { data: profile } = useCache("profile", () =>
        api.get("/participants/profile").then((r) => r.data)
    );

    const {
        data: slots,
        loading,
        error: fetchError,
    } = useCache<FoodSlot[]>(
        "food_slots",
        () => {
            if (!profile?.summit_id) return Promise.resolve([]);
            return api.get(`/food-slots/${profile.summit_id}`).then((r) => r.data);
        },
        { enabled: !!profile?.summit_id }
    );

    const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");

    // Group slots by date
    const groupedSlots = useMemo(() => {
        if (!slots || slots.length === 0) return {};
        return slots.reduce((acc: Record<string, FoodSlot[]>, slot) => {
            if (!slot.meal_date) return acc;
            const dateKey = slot.meal_date.split("T")[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(slot);
            return acc;
        }, {});
    }, [slots]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedSlots).sort();
    }, [groupedSlots]);

    // Active or upcoming meal highlight
    const activeSlot = useMemo(() => {
        if (!slots) return null;
        return slots.find(isSlotHappeningNow) || null;
    }, [slots]);

    const upcomingSlot = useMemo(() => {
        if (!slots || activeSlot) return null;
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const todayStr = now.toISOString().split("T")[0];

        // Find today's next slot
        const todaySlots = (slots || []).filter((s) => s.meal_date && s.meal_date.startsWith(todayStr));
        const nextToday = todaySlots
            .filter((s) => {
                if (!s.start_time) return false;
                const [sH, sM] = s.start_time.split(":").map(Number);
                return sH * 60 + sM > nowMinutes;
            })
            .sort((a, b) => {
                const [aH, aM] = (a.start_time || "00:00").split(":").map(Number);
                const [bH, bM] = (b.start_time || "00:00").split(":").map(Number);
                return aH * 60 + aM - (bH * 60 + bM);
            })[0];

        if (nextToday) return nextToday;

        // If none left today, find earliest slot tomorrow or upcoming
        const futureSlots = (slots || [])
            .filter((s) => s.meal_date && s.meal_date.split("T")[0] > todayStr)
            .sort((a, b) => a.meal_date.localeCompare(b.meal_date));

        return futureSlots[0] || null;
    }, [slots, activeSlot]);

    if (loading) return <ListSkeleton />;

    if (fetchError) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 opacity-80" />
                <p className="text-rose-500 font-medium">Failed to load meal timetable. Please check your connection and try again.</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full"
                >
                    <ChevronLeft size={16} /> Return Home
                </Link>
            </div>
        );
    }

    const datesToDisplay = selectedDateFilter === "all" ? sortedDates : [selectedDateFilter].filter((d) => groupedSlots[d]);

    return (
        <div className="p-4 space-y-6 pb-24 animate-in fade-in duration-300">
            {/* Header */}
            <header className="pt-2 pb-1 space-y-4">
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-card border border-border px-3 py-1.5 rounded-full active:scale-95"
                    >
                        <ChevronLeft size={14} /> Back
                    </Link>

                    <Link
                        href="/scan"
                        className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-500 text-white px-3.5 py-1.5 rounded-full shadow-sm hover:bg-emerald-600 transition-colors active:scale-95"
                    >
                        <ScanLine size={14} /> Food Pass
                    </Link>
                </div>

                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                        <UtensilsCrossed className="text-amber-500" size={28} />
                        Meal Timetable
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Official Summit Food Schedule & Menus</p>
                </div>
            </header>

            {/* Currently Serving or Up Next Highlight Banner */}
            {activeSlot ? (
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-[2rem] shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-2.5 py-1 rounded-full">
                                Serving Now
                            </span>
                        </div>
                        <span className="text-xs font-bold text-white/90">
                            {formatTime(activeSlot.start_time)} - {formatTime(activeSlot.end_time)}
                        </span>
                    </div>

                    <h2 className="text-2xl font-black tracking-tight mb-2">{activeSlot.meal_type}</h2>

                    {activeSlot.meals && activeSlot.meals.length > 0 ? (
                        <div className="space-y-1.5 mb-4">
                            {activeSlot.meals.map((meal) => (
                                <div key={meal.id} className="text-sm font-medium text-emerald-50 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
                                    <span>{meal.name}</span>
                                    {meal.vendor_name && (
                                        <span className="text-xs text-white/70 italic">({meal.vendor_name})</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-emerald-100 font-medium mb-4">Meal window is open. Ready for redemption.</p>
                    )}

                    <Link
                        href="/scan"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-white text-emerald-800 px-5 py-2.5 rounded-full shadow hover:bg-emerald-50 active:scale-95 transition-all"
                    >
                        <ScanLine size={16} /> Scan Food Pass
                    </Link>
                </div>
            ) : upcomingSlot ? (
                <div className="bg-card border border-border p-5 rounded-[2rem] shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <Sparkles size={11} className="text-amber-500" />
                                Up Next
                            </div>
                            <h3 className="font-bold text-foreground text-base leading-tight mt-0.5">
                                {upcomingSlot.meal_type}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {upcomingSlot.start_time ? formatTime(upcomingSlot.start_time) : "Scheduled"}{" "}
                                {upcomingSlot.meal_date && `• ${formatDateHeading(upcomingSlot.meal_date).title}`}
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/scan"
                        className="text-xs font-bold text-primary hover:underline shrink-0"
                    >
                        View Pass →
                    </Link>
                </div>
            ) : null}

            {/* Date Filter Tabs (if more than 1 day) */}
            {sortedDates.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => setSelectedDateFilter("all")}
                        className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                            selectedDateFilter === "all"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card border border-border text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        All Days ({slots?.length || 0})
                    </button>
                    {sortedDates.map((dateKey) => {
                        const heading = formatDateHeading(dateKey);
                        const isSelected = selectedDateFilter === dateKey;
                        return (
                            <button
                                key={dateKey}
                                onClick={() => setSelectedDateFilter(dateKey)}
                                className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                                    isSelected
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-card border border-border text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {heading.title}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {sortedDates.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-sm space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <UtensilsCrossed size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">No Meal Schedule Posted</h3>
                        <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">
                            The organizers have not yet published the meal timetable for this summit. Please check back soon!
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
                    >
                        <ChevronLeft size={14} /> Back to Dashboard
                    </Link>
                </div>
            ) : (
                /* Grouped Day Schedules */
                <div className="space-y-8">
                    {datesToDisplay.map((dateKey) => {
                        const daySlots = groupedSlots[dateKey] || [];
                        const heading = formatDateHeading(dateKey);

                        return (
                            <section key={dateKey} className="space-y-4">
                                <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-2.5 border-b border-border/60 flex items-baseline justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={15} className="text-primary" />
                                        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                                            {heading.title}
                                        </h2>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            • {heading.subtitle}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        {daySlots.length} {daySlots.length === 1 ? "meal" : "meals"}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {daySlots.map((slot) => {
                                        const MealIcon = getMealIcon(slot.meal_type);
                                        const badgeColor = getMealBadgeColor(slot.meal_type);
                                        const isServing = isSlotHappeningNow(slot);
                                        const hasTime = !!(slot.start_time && slot.end_time);

                                        return (
                                            <div
                                                key={slot.id}
                                                className={`bg-card border rounded-[1.75rem] p-5 shadow-sm transition-all duration-200 ${
                                                    isServing
                                                        ? "border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-emerald-500/10"
                                                        : "border-border hover:border-border/80"
                                                }`}
                                            >
                                                {/* Slot Header */}
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${badgeColor}`}
                                                        >
                                                            <MealIcon size={20} strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-extrabold text-foreground text-lg leading-tight capitalize">
                                                                    {slot.meal_type}
                                                                </h3>
                                                                {isServing && (
                                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                        Serving
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {hasTime ? (
                                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mt-1">
                                                                    <Clock size={12} className="text-primary" />
                                                                    <span>
                                                                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground font-medium mt-1 block">
                                                                    Time to be announced
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Quick link to Scan if active */}
                                                    {isServing && (
                                                        <Link
                                                            href="/scan"
                                                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-colors shrink-0"
                                                        >
                                                            Redeem →
                                                        </Link>
                                                    )}
                                                </div>

                                                {/* Meals & Menus */}
                                                <div className="mt-4 pt-3.5 border-t border-border/60">
                                                    {slot.meals && slot.meals.length > 0 ? (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                                                Menu Options
                                                            </p>
                                                            {slot.meals.map((meal) => (
                                                                <div
                                                                    key={meal.id}
                                                                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40"
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <CheckCircle2
                                                                            size={15}
                                                                            className="text-primary shrink-0"
                                                                        />
                                                                        <span className="text-sm font-bold text-foreground truncate">
                                                                            {meal.name}
                                                                        </span>
                                                                    </div>

                                                                    {meal.vendor_name && (
                                                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground shrink-0 bg-background/80 px-2 py-0.5 rounded-md border border-border/50">
                                                                            <Store size={11} className="text-slate-400" />
                                                                            <span>{meal.vendor_name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium py-1">
                                                            <Utensils size={13} className="text-muted-foreground/60" />
                                                            <span>Menu options will be posted by catering.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
