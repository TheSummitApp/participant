"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import api from "@/lib/api";
import { User as UserIcon, MapPin, Loader2, Link as LinkIcon, Home, CheckCircle2, LogOut } from "lucide-react";
import QRCode from "react-qr-code";

export default function ParticipantProfile() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string; first_name: string; last_name: string; stake: string; token: string; lodging_name?: string; lodging_room?: string; bed_label?: string; email: string; gender?: string; status: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('summit_participant_token');
        router.push('/login');
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/participants/profile');
                setUser(res.data);
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" strokeWidth={2} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col h-[80vh] items-center justify-center p-6 text-center">
                <p className="text-rose-500 font-medium tracking-wide">Error loading profile data.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-4 pb-2 text-center">
                <h1 className="text-3xl font-black tracking-tight text-foreground">My Pass</h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">Housing & Credentials</p>
            </header>

            <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm text-center relative overflow-hidden flex flex-col items-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />

                <div className="w-20 h-20 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mb-4 rotate-3">
                    <UserIcon size={40} />
                </div>

                <h2 className="text-2xl font-black text-foreground">{user.first_name} {user.last_name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mt-1 mb-6">
                    <MapPin size={14} />
                    <span>{user.stake} Stake</span>
                </div>

                <div className="w-full flex justify-center p-6 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm mx-auto">
                    {/* The QR Code that an admin could scan to verify the participant */}
                    <QRCode
                        value={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000'}/participants/${user.id}`}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#002855"
                        level="Q"
                    />
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-400 tracking-widest uppercase">Unique Access Token</p>
                <div className="mt-2 text-[10px] font-mono bg-muted text-muted-foreground px-3 py-1.5 rounded flex items-center gap-2">
                    <LinkIcon size={12} />
                    {user.token}
                </div>
            </div>

            <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2rem] p-6">
                <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                    <Home size={20} strokeWidth={2.5} />
                    <h3 className="font-bold text-lg">Accommodation</h3>
                </div>

                {user.lodging_name ? (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 mt-1">Lodging Facility</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{user.lodging_name}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 mt-1">Room No.</p>
                                <p className="font-bold text-xl text-slate-900 dark:text-slate-100">{user.lodging_room}</p>
                            </div>
                            <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 mt-1">Bed No.</p>
                                <p className="font-bold text-xl text-slate-900 dark:text-slate-100">{user.bed_label}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm text-center">
                        <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">You have not been allocated a confirmed room yet.</p>
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 size={20} className="text-primary" />
                    <h3 className="font-bold text-lg">Personal Details</h3>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</span>
                        <span className="text-sm font-semibold text-foreground">{user.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gender</span>
                        <span className="text-sm font-semibold text-foreground">{user.gender || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Registration Status</span>
                        <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            {user.status}
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="w-full py-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold rounded-[2rem] border border-rose-200 dark:border-rose-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-rose-100 dark:hover:bg-rose-900/20"
            >
                <LogOut size={20} />
                Log Out of Summit
            </button>
        </div>
    );
}
