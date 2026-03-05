"use client";
import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import {
    Loader2,
    Calendar,
    Users,
    AlertCircle,
    Star,
    ChefHat,
    Utensils
} from "lucide-react";
import QRCode from 'react-qr-code';
import { format } from 'date-fns';

export default function VendorDashboard({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [data, setData] = useState<{
        vendor: { id: string; name: string; token: string };
        active_meal_id: string | null;
        schedule: { meal_id: string; slot_id: string; meal_date: string; meal_type: string; served_count: number; meal_name?: string }[];
        stats: { total_served: number; average_rating: number }
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get(`/vendors/dashboard/${token}`);
            setData(res.data);
        } catch (err: unknown) {
            console.error(err);
            setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to load dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Set up polling for real-time updates every 15 seconds
        const interval = setInterval(fetchDashboardData, 15000);
        return () => clearInterval(interval);
    }, [token]);

    const handleActivateMeal = async (mealId: string) => {
        if (!data) return;
        try {
            const response = await api.post('/vendors/active-meal', {
                vendor_id: data.vendor.id,
                meal_id: mealId
            });
            if (response.data.success) {
                await fetchDashboardData();
            }
        } catch (error) {
            console.error("Failed to activate meal:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-[#002855] animate-spin" strokeWidth={2} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-slate-50">
                <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
                <p className="text-slate-500 font-medium">{error || "Vendor not found"}</p>
            </div>
        );
    }

    const { vendor, schedule, stats } = data;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-[#002855] text-white pt-12 pb-6 px-4 rounded-b-[2rem] shadow-lg sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <ChefHat size={14} /> Official Provider
                        </p>
                        <h1 className="text-2xl font-black tracking-tight">{vendor.name}</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6 -mt-4 relative z-20">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                        <Users className="text-emerald-500 mb-2" size={24} />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Served</p>
                        <p className="text-2xl font-black text-slate-900">{stats.total_served}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                        <Star className="text-amber-500 mb-2 fill-amber-500" size={24} />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rating</p>
                        <p className="text-2xl font-black text-slate-900">{stats.average_rating > 0 ? stats.average_rating.toFixed(1) : 'N/A'}</p>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#002855]/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Your Provider Pass</h2>
                    <p className="text-sm text-slate-500 mb-6 font-medium">Participants will scan this to claim their meal.</p>

                    <div className="inline-block p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-sm mb-4">
                        <QRCode
                            value={`${(process.env.NEXT_PUBLIC_PARTICIPANT_APP_URL || window.location.origin).replace(/\/$/, '')}/scan?vendor_token=${vendor.token}`}
                            size={200}
                            bgColor={"#ffffff"}
                            fgColor={"#002855"}
                            level={"Q"}
                        />
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Display this prominently at your station.</p>
                </div>

                {/* Schedule Items */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 px-2 flex items-center gap-2">
                        <Calendar size={20} className="text-[#002855]" />
                        Your Schedule
                    </h2>

                    {schedule.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                            <p className="text-slate-500 font-medium tracking-wide">No slots assigned yet.</p>
                        </div>
                    ) : (
                        schedule.map((slot) => {
                            const dateObj = new Date(slot.meal_date);
                            const isActive = slot.meal_id === data.active_meal_id;

                            return (
                                <div key={slot.slot_id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${isActive ? 'border-red-400 ring-2 ring-red-500/10' : 'border-slate-100'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-slate-900">{slot.meal_type}</h3>
                                                {isActive && (
                                                    <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                        LIVE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">
                                                {format(dateObj, 'EEEE, MMM do')}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleActivateMeal(slot.meal_id)}
                                            disabled={isActive}
                                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${isActive
                                                ? 'bg-emerald-500 text-white cursor-default'
                                                : 'bg-[#002855] text-white hover:bg-[#002855]/90 active:scale-95 shadow-md shadow-[#002855]/20'
                                                }`}
                                        >
                                            {isActive ? 'Active' : 'Activate'}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Utensils size={18} className="text-[#002855]" />
                                            <span className="font-semibold text-slate-700 text-sm">
                                                {slot.meal_name || "Standard Meal"}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900">{slot.served_count}</div>
                                            <div className="text-[8px] uppercase font-bold text-slate-400 tracking-wider leading-none">Served</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
