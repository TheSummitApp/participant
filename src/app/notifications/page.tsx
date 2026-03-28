"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Bell, Loader2, Megaphone, UserCircle, Inbox, Mail, CheckCircle2 } from "lucide-react";

interface Announcement {
    id: string;
    message: string;
    created_at: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function ParticipantNotifications() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [personalNotifications, setPersonalNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'global'>('personal');

    const fetchData = async () => {
        setLoading(true);
        try {
            const profileRes = await api.get('/participants/profile');
            const summitId = profileRes.data.summit_id;

            const [annRes, notifRes] = await Promise.all([
                api.get(`/announcements/${summitId}`),
                api.get('/notifications/me')
            ]);

            setAnnouncements(annRes.data || []);
            setPersonalNotifications(notifRes.data || []);
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/me/${id}/read`);
            setPersonalNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={3} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Communications...</p>
            </div>
        );
    }

    const unreadCount = personalNotifications.filter(n => !n.is_read).length;

    return (
        <div className="p-4 space-y-8 pb-24 animate-in fade-in duration-500">
            <header className="pt-6 pb-2">
                <div className="flex items-center justify-between mb-2">
                     <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Inbox className="text-primary" size={32} />
                        Inbox
                    </h1>
                </div>
                <p className="text-slate-500 text-sm font-semibold ml-1">Messages and announcements from organizers.</p>
            </header>

            <div className="flex p-1.5 bg-slate-100 rounded-3xl border border-slate-200">
                <button 
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-white text-primary shadow-lg shadow-primary/5' : 'text-slate-400'}`}
                >
                    <Mail size={16} />
                    Personal
                    {unreadCount > 0 && (
                        <span className="w-5 h-5 flex items-center justify-center bg-rose-500 text-white rounded-full text-[9px] font-black shadow-lg shadow-rose-200 animate-in zoom-in-50 duration-300">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('global')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'global' ? 'bg-white text-primary shadow-lg shadow-primary/5' : 'text-slate-400'}`}
                >
                    <Megaphone size={16} />
                    Global
                </button>
            </div>

            <div className="space-y-4">
                {activeTab === 'personal' ? (
                    personalNotifications.length === 0 ? (
                        <div className="py-20 text-center animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Mail size={32} />
                            </div>
                            <h3 className="font-black text-slate-900 tracking-tight">Zero personal messages</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1 px-10 leading-relaxed uppercase tracking-widest">You have a clean inbox. Direct messages will appear here.</p>
                        </div>
                    ) : (
                        personalNotifications.map((n) => (
                            <div 
                                key={n.id} 
                                onClick={() => !n.is_read && markAsRead(n.id)}
                                className={`bg-white border-2 p-6 rounded-[2rem] transition-all relative overflow-hidden group active:scale-95 shadow-sm ${!n.is_read ? 'border-primary shadow-xl shadow-primary/10' : 'border-slate-50'}`}
                            >
                                <div className="flex items-start gap-5">
                                    <div className={`w-12 h-12 rounded-3xl flex items-center justify-center shrink-0 border transition-all ${!n.is_read ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        {n.is_read ? <CheckCircle2 size={24} /> : <Mail size={24} />}
                                    </div>
                                    <div className="space-y-1 pr-6">
                                        <h4 className={`text-lg font-black tracking-tight ${!n.is_read ? 'text-slate-900' : 'text-slate-400'}`}>{n.title}</h4>
                                        <p className={`text-sm leading-relaxed font-bold ${!n.is_read ? 'text-slate-600' : 'text-slate-400'}`}>{n.message}</p>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    
                                    {!n.is_read && (
                                        <div className="absolute top-6 right-6 w-3 h-3 bg-rose-500 rounded-full shadow-lg shadow-rose-200" />
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    announcements.length === 0 ? (
                        <div className="py-20 text-center animate-in zoom-in-95 duration-500">
                             <div className="w-16 h-16 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Megaphone size={32} />
                            </div>
                            <h3 className="font-black text-slate-900 tracking-tight">All quiet on global</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1 px-10 leading-relaxed uppercase tracking-widest">No summit-wide announcements yet. Check back later.</p>
                        </div>
                    ) : (
                        announcements.map((ann) => (
                            <div key={ann.id} className="bg-slate-50 border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm active:scale-95 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                                        <Megaphone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-slate-800 leading-snug">{ann.message}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">
                                            {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
