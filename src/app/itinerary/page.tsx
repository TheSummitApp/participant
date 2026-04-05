"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useCache } from "@/lib/useCache";
import { ListSkeleton } from "@/components/Skeleton";
import { Calendar, MapPin, Clock, Loader2 } from "lucide-react";

interface ItineraryItem {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
}

export default function ParticipantItinerary() {
    const { data: profile } = useCache("profile", () =>
        api.get("/participants/profile").then((r) => r.data)
    );

    const {
        data: items,
        loading,
        error: fetchError,
    } = useCache<ItineraryItem[]>(
        "itinerary",
        () => {
            if (!profile?.summit_id) return Promise.resolve([]);
            return api.get(`/itinerary/${profile.summit_id}`).then((r) => r.data);
        },
        { enabled: !!profile?.summit_id }
    );

    const error = fetchError ? "Failed to load itinerary. Please try again." : null;

    if (loading) return <ListSkeleton />;

    if (error) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6 text-center">
                <p className="text-rose-500 font-medium">{error}</p>
            </div>
        );
    }

    // Group items by date
    const groupedItems = (items || []).reduce((acc: Record<string, ItineraryItem[]>, item: ItineraryItem) => {
        const dateStr = new Date(item.start_time).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric'
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(item);
        return acc;
    }, {} as Record<string, ItineraryItem[]>);

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-4 pb-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground">Schedule</h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">Official Summit Itinerary</p>
            </header>

            {Object.keys(groupedItems).length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-sm">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" strokeWidth={1.5} />
                    <p className="font-semibold text-foreground">No events scheduled.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedItems).map(([date, dayItems]) => (
                        <div key={date}>
                            <h2 className="sticky top-0 bg-background/95 backdrop-blur z-10 py-3 text-sm font-bold tracking-wider uppercase text-primary border-b border-border/50 mb-4">
                                {date}
                            </h2>
                            <div className="space-y-4">
                                {dayItems.map((item) => {
                                    const start = new Date(item.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                    const end = new Date(item.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                    return (
                                        <div key={item.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-foreground text-lg leading-tight pr-4">{item.title}</h3>
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
                                            )}
                                            <div className="flex flex-col gap-2 mt-auto text-xs font-semibold text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-primary" />
                                                    <span>{start} - {end}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-rose-500" />
                                                    <span>{item.location || 'TBA'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
