"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useCache } from "@/lib/useCache";
import { Bell, Loader2, Megaphone } from "lucide-react";

interface Announcement {
    id: string;
    message: string;
    created_at: string;
}

export default function ParticipantNotifications() {
    const { data: profile } = useCache("profile", () =>
        api.get("/participants/profile").then((r) => r.data)
    );

    const { data: announcementsData, loading } = useCache(
        "announcements",
        () => {
            if (!profile?.summit_id) return Promise.resolve([]);
            return api
                .get(`/announcements/${profile.summit_id}`)
                .then((r) => r.data);
        },
        { enabled: !!profile?.summit_id }
    );

    const announcements = announcementsData || [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={3} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Syncing Communications...</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8 pb-24 animate-in fade-in duration-500">
            <header className="pt-6 pb-2">
                <div className="flex items-center justify-between mb-2">
                     <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Bell className="text-primary" size={32} />
                        Alerts
                    </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold ml-1">Global announcements and updates from organizers.</p>
            </header>

            <div className="space-y-4">
                {announcements.length === 0 ? (
                        <div className="py-20 text-center animate-in zoom-in-95 duration-500">
                             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                                <Megaphone size={32} />
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight">All quiet on global</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 px-10 leading-relaxed uppercase tracking-widest">No summit-wide announcements yet. Check back later.</p>
                        </div>
                    ) : (
                        announcements.map((ann: Announcement) => (
                            <div key={ann.id} className="bg-slate-50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm active:scale-95 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                        <Megaphone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-snug">{ann.message}</p>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-3">
                                            {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                )}
            </div>
        </div>
    );
}
