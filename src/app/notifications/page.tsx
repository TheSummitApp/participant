"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Bell, Loader2, Megaphone } from "lucide-react";

interface Announcement {
    id: string;
    message: string;
    created_at: string;
}

export default function ParticipantNotifications() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const profileRes = await api.get('/participants/profile');
                const summitId = profileRes.data.summit_id;

                const res = await api.get(`/announcements/${summitId}`);
                setAnnouncements(res.data);
            } catch (err) {
                console.error("Failed to load announcements", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" strokeWidth={2} />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-4 pb-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <Bell className="text-primary" size={32} />
                    Alerts
                </h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">Official event announcements.</p>
            </header>

            {announcements.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-sm">
                    <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" strokeWidth={1.5} />
                    <p className="font-semibold text-foreground">No new announcements.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => {
                        const date = new Date(announcement.created_at);
                        const isRecent = (new Date().getTime() - date.getTime()) < 24 * 60 * 60 * 1000;

                        return (
                            <div key={announcement.id} className={`bg-card border ${isRecent ? 'border-primary/50 shadow-md shadow-primary/5' : 'border-border shadow-sm'} rounded-[1.5rem] p-5 active:scale-[0.98] transition-all relative overflow-hidden`}>
                                {isRecent && (
                                    <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
                                )}
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isRecent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <Megaphone size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground text-[15px] leading-snug whitespace-pre-wrap">{announcement.message}</p>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-3">
                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
