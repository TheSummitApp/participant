"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useCache } from "@/lib/useCache";
import { Bell, BellRing, CheckCircle2, Loader2, Megaphone } from "lucide-react";
import { subscribeToPushNotifications } from "@/lib/push";

interface Announcement {
    id: string;
    title?: string;
    message: string;
    target_type?: string;
    created_at: string;
}

export default function ParticipantNotifications() {
    const [pushStatus, setPushStatus] = useState<"granted" | "denied" | "default" | "unsupported">("default");
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!("Notification" in window) || !("serviceWorker" in navigator)) {
                setPushStatus("unsupported");
            } else {
                setPushStatus(Notification.permission);
            }
        }
    }, []);

    const handleEnablePush = async () => {
        setSubscribing(true);
        try {
            const success = await subscribeToPushNotifications();
            if (success) {
                setPushStatus("granted");
            } else if (typeof window !== "undefined" && "Notification" in window) {
                setPushStatus(Notification.permission);
            }
        } catch (e) {
            console.error("Push subscribe error:", e);
        } finally {
            setSubscribing(false);
        }
    };

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
                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold ml-1">Announcements, direct notices, and summit updates.</p>
            </header>

            {/* Push notification banner if not granted */}
            {pushStatus === "default" && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <BellRing size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground">Turn on Push Notifications</p>
                            <p className="text-[11px] text-muted-foreground font-medium">Get instant updates even when the app is closed</p>
                        </div>
                    </div>
                    <button
                        onClick={handleEnablePush}
                        disabled={subscribing}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {subscribing ? <Loader2 size={14} className="animate-spin" /> : "Enable"}
                    </button>
                </div>
            )}

            {pushStatus === "granted" && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <p className="text-[11px] font-semibold">Push notifications enabled on this device</p>
                </div>
            )}

            <div className="space-y-4">
                {announcements.length === 0 ? (
                        <div className="py-20 text-center animate-in zoom-in-95 duration-500">
                             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                                <Megaphone size={32} />
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight">All quiet on alerts</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 px-10 leading-relaxed uppercase tracking-widest">No announcements yet. Check back later.</p>
                        </div>
                    ) : (
                        announcements.map((ann: Announcement) => (
                            <div key={ann.id} className="bg-slate-50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm active:scale-95 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                        <Megaphone size={18} />
                                    </div>
                                    <div className="flex-1">
                                        {ann.title && (
                                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight mb-1">{ann.title}</h4>
                                        )}
                                        <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200 leading-snug">{ann.message}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {ann.target_type && ann.target_type !== 'all' && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    {ann.target_type === 'individual' ? 'Direct' : ann.target_type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                )}
            </div>
        </div>
    );
}
