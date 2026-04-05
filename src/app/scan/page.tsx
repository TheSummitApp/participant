"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Camera, X, AlertCircle, Utensils, CheckCircle2, Star, Send } from "lucide-react";
import dynamic from "next/dynamic";
const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner), {
    ssr: false,
});

export default function ParticipantScan() {
    const [token, setToken] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scannedVendor, setScannedVendor] = useState<{ id: string; token: string; name: string } | null>(null);
    const [slotData, setSlotData] = useState<{ slot_id: string; meal_name: string; meal_type: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Rating State
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        // Grab token from local storage
        const storedToken = localStorage.getItem('summit_participant_token');
        if (storedToken) setToken(storedToken);

        // Check if we arrived here via a QR scan from an external camera
        const urlParams = new URLSearchParams(window.location.search);
        const vendorTokenFromUrl = urlParams.get('vendor_token');
        if (vendorTokenFromUrl) {
            handleDecode(vendorTokenFromUrl);
        }
    }, []);

    const handleDecode = async (result: string) => {
        if (!result) return;
        
        // Haptic Feedback (vibrate for 50ms)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }

        setScanning(false);
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let tokenToScan = result;

            if (result.includes('vendor_token=')) {
                try {
                    const url = new URL(result);
                    const param = url.searchParams.get('vendor_token');
                    if (param) tokenToScan = param;
                } catch (e) {
                    const match = result.match(/vendor_token=([^&]+)/);
                    if (match) tokenToScan = match[1];
                }
            }

            const res = await api.post('/meals/scan', { vendor_token: tokenToScan });
            setScannedVendor(res.data.vendor);
            setSlotData(res.data.slot);
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Error reading vendor pass.");
        } finally {
            setLoading(false);
        }
    };

    const confirmMeal = async () => {
        if (!scannedVendor || !slotData) return;
        
        // Optimistically show success
        setSuccess(true);
        setError(null);
        
        // Haptic Feedback (longer vibration on success)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        try {
            await api.post('/meals/confirm', {
                participant_token: token,
                vendor_token: scannedVendor.token,
                slot_id: slotData.slot_id
            });
        } catch (err: unknown) {
            // If it actually fails, roll back success state and show error
            setSuccess(false);
            setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to confirm meal.");
        }
    };

    const submitRating = async () => {
        if (!scannedVendor || rating === 0) return;
        setSubmittingRating(true);
        try {
            await api.post('/meals/rate', {
                participant_token: token,
                vendor_id: scannedVendor.id,
                score: rating,
                comment: comment
            });
            setRatingSubmitted(true);
        } catch (err) {
            console.error("Failed to rate", err);
        } finally {
            setSubmittingRating(false);
        }
    };

    const resetView = () => {
        setSuccess(false);
        setScannedVendor(null);
        setRating(0);
        setComment("");
        setRatingSubmitted(false);
    };

    return (
        <div className="p-4 space-y-6 pb-24 h-[85vh] flex flex-col">
            <header className="pt-4 pb-2 text-center">
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center justify-center gap-3">
                    <Camera className="text-primary" size={32} />
                    Food Pass
                </h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">Scan a vendor&apos;s code to claim your meal.</p>
            </header>

            {!scanning && !scannedVendor && !error && !success && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-48 h-48 bg-primary/5 rounded-[3rem] border-2 border-primary/20 border-dashed flex items-center justify-center relative shadow-sm group active:scale-95 transition-transform">
                        <div className="absolute inset-4 border-2 border-primary rounded-[2rem] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <Camera size={64} className="text-primary/50 group-hover:text-primary transition-colors" />
                    </div>

                    <button
                        onClick={() => setScanning(true)}
                        className="bg-primary text-primary-foreground font-black px-10 py-5 rounded-3xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest text-sm"
                    >
                        <Camera size={20} />
                        Open Scanner
                    </button>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center max-w-[200px] opacity-60">
                        Aim at the vendor&apos;s digital placard
                    </p>
                </div>
            )}

            {scanning && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 relative animate-in fade-in duration-300">
                    <div className="absolute top-0 w-full flex justify-end z-10 px-4">
                        <button
                            onClick={() => setScanning(false)}
                            className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full text-foreground border border-white/30 flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="w-full max-w-sm aspect-square bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl relative border-4 border-primary/10">
                        <Scanner
                            onScan={(result) => handleDecode(result[0].rawValue)}
                        />
                        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-primary/50 blur-[2px] animate-pulse"></div>
                    </div>
                </div>
            )}

            {loading && !scanning && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] border-2 border-rose-100 flex items-center justify-center shadow-lg shadow-rose-200">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-rose-600 tracking-tight">{error}</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-2 max-w-[250px] mx-auto">Please check with an administrator if you believe this is an error.</p>
                    </div>
                    <button
                        onClick={() => { setError(null); setScanning(true); }}
                        className="bg-slate-900 text-white font-black px-10 py-5 rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        Try Scanning Again
                    </button>
                </div>
            )}

            {scannedVendor && !success && !error && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-2 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-white border-2 border-slate-100 shadow-2xl rounded-[3rem] p-8 w-full max-w-sm text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

                        <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
                            <Utensils size={40} />
                        </div>

                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 leading-none">{scannedVendor.name}</p>
                        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">{slotData?.meal_name || "Food Listing"}</h2>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 inline-block w-full mb-10 text-left">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Active Assignment</span>
                            <span className="font-black text-slate-900 text-xl tracking-tight">{slotData?.meal_type}</span>
                        </div>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setScannedVendor(null)}
                                className="flex-1 py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmMeal}
                                className="flex-[2] py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-primary hover:bg-[#002855] shadow-lg shadow-primary/20 transition-all active:scale-95 translate-y-0"
                            >
                                Claim Meal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {success && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-4 animate-in fade-in duration-500">
                   {!ratingSubmitted ? (
                        <div className="bg-white border-2 border-emerald-100 shadow-2xl rounded-[3rem] p-8 w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto mb-6">
                                <CheckCircle2 size={40} className="text-white" strokeWidth={3} />
                            </div>
                            
                            <h2 className="text-3xl font-black text-emerald-600 tracking-tight mb-2">Success!</h2>
                            <p className="font-bold text-slate-400 text-sm mb-10">Meal logged. How was it?</p>
                            
                            <div className="flex justify-center gap-3 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star} 
                                        onClick={() => setRating(star)}
                                        className="transform transition-all active:scale-90"
                                    >
                                        <Star 
                                            size={36} 
                                            className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} 
                                            strokeWidth={star <= rating ? 0 : 2}
                                        />
                                    </button>
                                ))}
                            </div>
                            
                            <textarea 
                                placeholder="Any feedback for the vendor? (Optional)"
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none mb-6"
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <div className="flex flex-col gap-3">
                                <button
                                    disabled={rating === 0 || submittingRating}
                                    onClick={submitRating}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                                >
                                    {submittingRating ? <Loader2 size={18} className="animate-spin" /> : <>Share Feedback <Send size={14} /></>}
                                </button>
                                <button
                                    onClick={resetView}
                                    className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>
                   ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 px-4 animate-in zoom-in-95 duration-500">
                             <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/20">
                                <Star size={48} className="text-white fill-white" />
                             </div>
                             <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Thank You!</h2>
                                <p className="font-bold text-slate-400 mt-2">Your rating helps us improve the summit experience.</p>
                             </div>
                             <button
                                onClick={resetView}
                                className="bg-slate-900 text-white font-black px-12 py-5 rounded-3xl active:scale-95 transition-transform w-full max-w-[250px] uppercase text-xs tracking-widest shadow-xl"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                   )}
                </div>
            )}
        </div>
    );
}
