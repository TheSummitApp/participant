"use client";
import React, { useState } from "react";
import api from "@/lib/api";
import { Loader2, Fingerprint, Info, AlertCircle } from "lucide-react";

export default function ParticipantLogin() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!code || code.length < 5) {
            setError("Please enter a valid login code.");
            return;
        }

        try {
            setLoading(true);
            const res = await api.get(`/participants/identifier/${code}`);
            if (res.data && res.data.token) {
                localStorage.setItem("summit_participant_token", res.data.token);
                window.location.href = "/";
            }
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Login failed. Please check your code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-6 py-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#002855]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

            <div className="w-full max-w-sm mx-auto relative z-10">
                <div className="mb-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#002855] text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#002855]/20 rotate-3">
                        <Fingerprint size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">YSA Summit</h1>
                    <p className="text-sm font-medium text-slate-500 text-center">Enter your unique 6-digit access code to view your itinerary, food pass, and housing.</p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-[#002855] ml-1">Access Code</label>
                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="000000"
                                className="w-full text-center text-3xl font-black text-slate-900 py-4 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-[#002855]/10 tracking-[0.2em] transition-all bg-slate-50 placeholder-slate-300"
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-semibold flex gap-3 items-center">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-[#002855] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#002855]/30 hover:bg-[#002855]/90 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-[#002855]/20 flex items-center justify-center gap-2 text-lg"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Login
                        </button>
                    </form>
                </div>

                <div className="mt-8 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-white rounded-full shrink-0 shadow-sm">
                        <Info size={16} className="text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-900/70 font-medium leading-relaxed">
                        Your login code was sent to the email address you registered with. If you cannot find it, please contact your Stake Representative.
                    </p>
                </div>
            </div>
        </div>
    );
}
