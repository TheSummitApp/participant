"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";

export default function AutoLoginCallback({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const validateToken = async () => {
            try {
                // Ensure the token exists
                const res = await api.get(`/participants/identifier/${unwrappedParams.token}`);
                if (res.data) {
                    localStorage.setItem("summit_participant_token", unwrappedParams.token);
                    // Redirect to dashboard explicitly instead of reload
                    window.location.href = "/";
                }
            } catch (err: unknown) {
                console.error("Auto login failed:", err);
                setError("This login link is invalid or has expired.");
                setTimeout(() => router.push("/login"), 3000);
            }
        };

        if (unwrappedParams.token) {
            validateToken();
        }
    }, [unwrappedParams.token, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            {!error ? (
                <>
                    <Loader2 className="w-12 h-12 text-[#002855] animate-spin mb-6 mx-auto" strokeWidth={1.5} />
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Authenticating</h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">Connecting you to the YSA Summit...</p>
                </>
            ) : (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl w-full max-w-sm">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-rose-900 leading-tight">Link Expired</h2>
                    <p className="text-sm text-rose-600 font-medium mt-2">{error}</p>
                    <p className="text-xs text-rose-400 mt-4 tracking-wide">Redirecting to login manually...</p>
                </div>
            )}
        </div>
    );
}
