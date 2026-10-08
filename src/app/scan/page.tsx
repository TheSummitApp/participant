"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useCache } from "@/lib/useCache";
import {
    Loader2,
    Camera,
    X,
    AlertCircle,
    Utensils,
    CheckCircle2,
    Star,
    Send,
    QrCode,
    ScanLine,
    User as UserIcon,
    Sparkles,
    Check,
    Copy,
    ChevronRight,
    SunMedium
} from "lucide-react";
import QRCode from "react-qr-code";
import dynamic from "next/dynamic";

const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner), {
    ssr: false,
});

export default function ParticipantScan() {
    const [token, setToken] = useState<string | null>(null);
    const [mode, setMode] = useState<"show-pass" | "scan-vendor">("show-pass");
    const [scanning, setScanning] = useState(false);
    const [scannedVendor, setScannedVendor] = useState<{ id: string; token: string; name: string } | null>(null);
    const [slotData, setSlotData] = useState<{ slot_id: string; meal_name: string; meal_type: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [scannerKey, setScannerKey] = useState(0); // incremented on reset to remount Scanner
    const [copiedToken, setCopiedToken] = useState(false);

    // Ref-based lock — prevents duplicate fires from the QR camera before state settles
    const scanLockRef = useRef(false);

    // Participant Profile Cache
    const { data: user, loading: userLoading } = useCache("profile", () =>
        api.get("/participants/profile").then((res) => res.data)
    );

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
            setMode("scan-vendor");
            handleDecode(vendorTokenFromUrl);
        }
    }, []);

    const handleDecode = async (result: string) => {
        if (!result || scanLockRef.current) return;
        scanLockRef.current = true; // lock — prevents duplicate fires from camera frames

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
                } catch {
                    const match = result.match(/vendor_token=([^&]+)/);
                    if (match) tokenToScan = match[1];
                }
            }

            const res = await api.post('/meals/scan', { vendor_token: tokenToScan });
            setScannedVendor(res.data.vendor);
            setSlotData(res.data.slot);
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Error reading vendor pass.");
            scanLockRef.current = false; // release on error so participant can retry
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
        // Release lock and remount Scanner so the same vendor QR can be re-scanned
        scanLockRef.current = false;
        setScannerKey(k => k + 1);
        setMode("show-pass");
    };

    const handleCopyToken = () => {
        if (!user?.token) return;
        navigator.clipboard.writeText(user.token);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    const qrValue = user
        ? `${(process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.summit.org').replace(/\/$/, '')}/participants/${user.token || user.id}`
        : "";

    // If showing vendor claim confirmation or success screens
    const isInteractingWithVendor = scannedVendor || success || error;

    return (
        <div className="p-4 space-y-6 pb-24 min-h-[85vh] flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <header className="pt-3 pb-1 text-center space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center justify-center gap-2.5">
                    <Utensils className="text-emerald-500" size={28} />
                    Food Pass
                </h1>
                <p className="text-muted-foreground text-xs font-semibold max-w-xs mx-auto">
                    Two ways to claim: show your pass to the vendor, or scan their station placard.
                </p>
            </header>

            {/* Clear Mode Switcher: "Show My Pass" vs "Scan Vendor" */}
            {!isInteractingWithVendor && (
                <div className="grid grid-cols-2 p-1.5 bg-muted rounded-2xl border border-border shrink-0">
                    <button
                        onClick={() => { setScanning(false); setMode("show-pass"); }}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            mode === "show-pass"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <QrCode size={16} className={mode === "show-pass" ? "text-emerald-500" : ""} />
                        Show My Pass
                    </button>
                    <button
                        onClick={() => setMode("scan-vendor")}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            mode === "scan-vendor"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Camera size={16} className={mode === "scan-vendor" ? "text-emerald-500" : ""} />
                        Scan Vendor
                    </button>
                </div>
            )}

            {/* ============================================================ */}
            {/* OPTION 1: SHOW MY PASS (VENDOR SCANS PARTICIPANT)            */}
            {/* ============================================================ */}
            {!isInteractingWithVendor && mode === "show-pass" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-full max-w-sm bg-card border-2 border-border rounded-[2.5rem] p-6 shadow-xl text-center relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full -translate-y-12 translate-x-12 blur-2xl pointer-events-none" />

                        {/* Top Badge */}
                        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-4">
                            <Sparkles size={12} />
                            Vendor Scans This Pass
                        </div>

                        {/* Participant QR Code Box */}
                        <div className="w-full flex justify-center p-5 bg-white rounded-3xl border border-slate-200 shadow-sm mx-auto">
                            {userLoading || !qrValue ? (
                                <div className="w-[190px] h-[190px] flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <QRCode
                                    value={qrValue}
                                    size={190}
                                    bgColor="#ffffff"
                                    fgColor="#002855"
                                    level="Q"
                                />
                            )}
                        </div>

                        {/* Participant Details */}
                        <div className="mt-4 space-y-1">
                            <h2 className="text-xl font-black text-foreground">
                                {user ? `${user.first_name} ${user.last_name || ''}` : "Participant"}
                            </h2>
                            <p className="text-xs font-semibold text-muted-foreground">
                                {user?.company_name ? `${user.company_name} • ` : ""}
                                {user?.stake ? `${user.stake} Stake` : "Summit Participant"}
                            </p>
                        </div>

                        {/* 6-digit access code / token badge */}
                        {user?.token && (
                            <button
                                onClick={handleCopyToken}
                                className="mt-3 inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border border-border/80 transition-colors"
                                title="Tap to copy access code"
                            >
                                <span>Code: {user.token}</span>
                                {copiedToken ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-muted-foreground" />}
                            </button>
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-4 pt-3 border-t border-border/60 w-full justify-center">
                            <SunMedium size={13} className="text-amber-500 shrink-0" />
                            <span>Hold up screen for vendor to scan</span>
                        </div>
                    </div>

                    {/* Secondary Action: Switch to Scanner */}
                    <button
                        onClick={() => setMode("scan-vendor")}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-2 px-4 rounded-full bg-muted/60 border border-border/40 transition-colors"
                    >
                        <span>Does the vendor have a QR placard instead?</span>
                        <span className="text-primary font-black flex items-center">
                            Scan Vendor <ChevronRight size={13} />
                        </span>
                    </button>
                </div>
            )}

            {/* ============================================================ */}
            {/* OPTION 2: SCAN VENDOR (PARTICIPANT SCANS VENDOR PLACARD)     */}
            {/* ============================================================ */}
            {!isInteractingWithVendor && mode === "scan-vendor" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!scanning ? (
                        <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-6 text-center">
                            <div
                                onClick={() => setScanning(true)}
                                className="w-48 h-48 bg-primary/5 rounded-[3rem] border-2 border-primary/20 border-dashed flex flex-col items-center justify-center relative shadow-sm group active:scale-95 transition-transform cursor-pointer"
                            >
                                <div className="absolute inset-4 border-2 border-primary rounded-[2rem] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <Camera size={56} className="text-primary/60 group-hover:text-primary transition-colors mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Tap to Start</span>
                            </div>

                            <button
                                onClick={() => setScanning(true)}
                                className="bg-primary text-primary-foreground font-black px-8 py-4 rounded-3xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2.5 uppercase tracking-widest text-xs w-full max-w-xs justify-center"
                            >
                                <Camera size={18} />
                                Open Camera Scanner
                            </button>

                            <p className="text-xs font-medium text-muted-foreground max-w-[260px]">
                                Point your camera at the vendor&apos;s printed placard or digital screen at their station.
                            </p>

                            <button
                                onClick={() => setMode("show-pass")}
                                className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-2 px-4 rounded-full bg-muted/60 border border-border/40 transition-colors pt-2"
                            >
                                <span>Vendor wants to scan you instead?</span>
                                <span className="text-primary font-black flex items-center">
                                    Show My Pass <ChevronRight size={13} />
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4 relative">
                            <div className="w-full flex justify-between items-center max-w-sm px-2">
                                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Aim at vendor code</span>
                                <button
                                    onClick={() => setScanning(false)}
                                    className="w-10 h-10 bg-muted text-foreground rounded-full flex items-center justify-center active:scale-90 transition-transform shadow"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="w-full max-w-sm aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-primary/20">
                                <Scanner
                                    key={scannerKey}
                                    onScan={(result) => handleDecode(result[0].rawValue)}
                                />
                                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400/70 blur-[2px] animate-pulse"></div>
                            </div>

                            <button
                                onClick={() => { setScanning(false); setMode("show-pass"); }}
                                className="text-xs font-bold text-muted-foreground hover:text-foreground pt-2"
                            >
                                Switch to Show My Pass QR
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Spinner when querying scanned vendor */}
            {loading && !scanning && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verifying Vendor Pass...</p>
                </div>
            )}

            {/* Error View */}
            {error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-[2rem] border-2 border-rose-100 dark:border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-rose-600 dark:text-rose-500 tracking-tight">{error}</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-2 max-w-[260px] mx-auto">
                            Please check with the vendor or event organizers if you believe this is an error.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <button
                            onClick={() => { setError(null); setMode("scan-vendor"); setScanning(true); }}
                            className="bg-primary text-primary-foreground font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                        >
                            Try Scanning Again
                        </button>
                        <button
                            onClick={() => { setError(null); setMode("show-pass"); }}
                            className="text-muted-foreground font-bold text-xs py-3 hover:text-foreground transition-colors"
                        >
                            Or Show My Pass QR Instead
                        </button>
                    </div>
                </div>
            )}

            {/* Scanned Vendor Modal / Claim Meal Confirmation */}
            {scannedVendor && !success && !error && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-2 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-card border-2 border-border shadow-2xl rounded-[3rem] p-8 w-full max-w-sm text-center relative overflow-hidden group dark:shadow-none">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

                        <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
                            <Utensils size={40} />
                        </div>

                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 leading-none">{scannedVendor.name}</p>
                        <h2 className="text-3xl font-black text-card-foreground mb-8 tracking-tighter">{slotData?.meal_name || "Food Listing"}</h2>

                        <div className="bg-muted p-6 rounded-2xl border border-border inline-block w-full mb-10 text-left">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Active Assignment</span>
                            <span className="font-black text-foreground text-xl tracking-tight">{slotData?.meal_type}</span>
                        </div>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setScannedVendor(null)}
                                className="flex-1 py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmMeal}
                                className="flex-[2] py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest text-primary-foreground bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                Claim Meal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success & Feedback View */}
            {success && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-4 animate-in fade-in duration-500">
                   {!ratingSubmitted ? (
                        <div className="bg-card border-2 border-emerald-100 dark:border-emerald-500/20 shadow-2xl dark:shadow-none rounded-[3rem] p-8 w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto mb-6">
                                <CheckCircle2 size={40} className="text-white" strokeWidth={3} />
                            </div>
                            
                            <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight mb-2">Success!</h2>
                            <p className="font-bold text-muted-foreground text-sm mb-10">Meal logged. How was it?</p>
                            
                            <div className="flex justify-center gap-3 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star} 
                                        onClick={() => setRating(star)}
                                        className="transform transition-all active:scale-90"
                                    >
                                        <Star 
                                            size={36} 
                                            className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"} 
                                            strokeWidth={star <= rating ? 0 : 2}
                                        />
                                    </button>
                                ))}
                            </div>
                            
                            <textarea 
                                placeholder="Any feedback for the vendor? (Optional)"
                                className="w-full p-4 bg-muted border border-border text-foreground placeholder:text-muted-foreground rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none mb-6"
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <div className="flex flex-col gap-3">
                                <button
                                    disabled={rating === 0 || submittingRating}
                                    onClick={submitRating}
                                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                                >
                                    {submittingRating ? <Loader2 size={18} className="animate-spin" /> : <>Share Feedback <Send size={14} /></>}
                                </button>
                                <button
                                    onClick={resetView}
                                    className="w-full py-4 text-muted-foreground font-bold text-sm hover:text-foreground transition-colors"
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
                                <h2 className="text-3xl font-black text-foreground tracking-tighter">Thank You!</h2>
                                <p className="font-bold text-muted-foreground mt-2">Your rating helps us improve the summit experience.</p>
                             </div>
                             <button
                                onClick={resetView}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-12 py-5 rounded-3xl active:scale-95 transition-transform w-full max-w-[250px] uppercase text-xs tracking-widest shadow-xl"
                            >
                                Back to Food Pass
                            </button>
                        </div>
                   )}
                </div>
            )}
        </div>
    );
}
