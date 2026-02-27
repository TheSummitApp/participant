"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Camera, X, AlertCircle, Utensils, CheckCircle2 } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function ParticipantScan() {
    const [token, setToken] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scannedVendor, setScannedVendor] = useState<{ token: string; name: string } | null>(null);
    const [slotData, setSlotData] = useState<{ slot_id: string; meal_name: string; meal_type: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Grab token from local storage (or from profile endpoint if we need to guarantee it's fresh)
        // But local storage is faster.
        const storedToken = localStorage.getItem('summit_participant_token');
        if (storedToken) setToken(storedToken);
    }, []);

    const handleDecode = async (result: string) => {
        if (!result) return;
        setScanning(false);
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // result should be the vendor token
            const res = await api.post('/meals/scan', { vendor_token: result });
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
        setLoading(true);
        setError(null);
        try {
            await api.post('/meals/confirm', {
                participant_token: token,
                vendor_token: scannedVendor.token, // Need to make sure the endpoint returns vendor.token or we use the raw scan string
                slot_id: slotData.slot_id
            });
            setSuccess(true);
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to confirm meal.");
        } finally {
            setLoading(false);
        }
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
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                    <div className="w-48 h-48 bg-primary/5 rounded-[3rem] border-2 border-primary/20 border-dashed flex items-center justify-center relative shadow-sm">
                        <div className="absolute inset-4 border-2 border-primary rounded-[2rem]"></div>
                        <Camera size={64} className="text-primary/50" />
                    </div>

                    <button
                        onClick={() => setScanning(true)}
                        className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center gap-2"
                    >
                        <Camera size={20} />
                        Tap to Scan QR Code
                    </button>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center max-w-[200px]">
                        Point your camera at the vendor&apos;s digital or printed pass
                    </p>
                </div>
            )}

            {scanning && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 relative">
                    <div className="absolute top-0 w-full flex justify-end z-10 px-4">
                        <button
                            onClick={() => setScanning(false)}
                            className="w-10 h-10 bg-black/50 backdrop-blur rounded-full text-white flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="w-full max-w-sm aspect-square bg-black rounded-[3rem] overflow-hidden shadow-2xl relative">
                        <Scanner
                            onScan={(result) => handleDecode(result[0].rawValue)}
                        />
                        <div className="absolute inset-0 pointer-events-none border-[6px] border-primary/50 rounded-[3rem] mix-blend-overlay"></div>
                    </div>
                    <p className="font-medium text-foreground text-center animate-pulse">Position QR Code in frame...</p>
                </div>
            )}

            {loading && !scanning && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" strokeWidth={2} />
                </div>
            )}

            {error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4 border-2 border-rose-500/20 bg-rose-500/5 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-rose-600 dark:text-rose-400">{error}</h3>
                    <p className="text-sm font-medium text-muted-foreground">You may have already scanned for this meal, or the vendor is not active.</p>
                    <button
                        onClick={() => { setError(null); setScanning(true); }}
                        className="mt-4 bg-muted text-foreground font-bold px-6 py-3 rounded-full active:scale-95 transition-transform"
                    >
                        Scan Again
                    </button>
                </div>
            )}

            {scannedVendor && !success && !error && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-2">
                    <div className="bg-card border-2 border-primary/20 shadow-xl rounded-[2rem] p-8 w-full max-w-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />

                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <Utensils size={32} />
                        </div>

                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{scannedVendor.name}</p>
                        <h2 className="text-2xl font-black text-foreground mb-6">{slotData?.meal_name || "Standard Meal"}</h2>

                        <div className="bg-muted p-4 rounded-xl border border-border inline-block min-w-[200px] mb-8">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Current Slot</span>
                            <span className="font-bold text-foreground text-lg">{slotData?.meal_type}</span>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setScannedVendor(null)}
                                className="flex-1 py-3 px-4 rounded-full font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmMeal}
                                className="flex-[2] py-3 px-4 rounded-full font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
                            >
                                Confirm Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {success && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-300">
                        <CheckCircle2 size={48} className="text-white" strokeWidth={3} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">Meal Claimed!</h2>
                        <p className="font-medium text-muted-foreground mt-2">Enjoy your food from {scannedVendor?.name}.</p>
                    </div>

                    <button
                        onClick={() => { setSuccess(false); setScannedVendor(null); }}
                        className="mt-8 bg-muted text-foreground font-bold px-8 py-4 rounded-full active:scale-95 transition-transform w-full max-w-[250px]"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}
