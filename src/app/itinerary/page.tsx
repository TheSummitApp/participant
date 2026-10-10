"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useCache } from "@/lib/useCache";
import { ListSkeleton } from "@/components/Skeleton";
import { Calendar, MapPin, Clock, Loader2, Star, X, CheckCircle2, Send, ChevronRight, ListOrdered } from "lucide-react";

interface AgendaItem {
    label: string;
    value: string;
}

interface ItineraryItem {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    user_rating?: number | null;
    user_comment?: string | null;
    agenda?: AgendaItem[] | string | null;
}

function parseAgenda(agenda: any): AgendaItem[] {
    if (!agenda) return [];
    if (Array.isArray(agenda)) return agenda;
    if (typeof agenda === "string") {
        try {
            const parsed = JSON.parse(agenda);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];

export default function ParticipantItinerary() {
    const { data: profile } = useCache("profile", () =>
        api.get("/participants/profile").then((r) => r.data)
    );

    const {
        data: items,
        loading,
        error: fetchError,
        refresh: refreshItinerary,
    } = useCache<ItineraryItem[]>(
        "itinerary",
        () => {
            if (!profile?.summit_id) return Promise.resolve([]);
            return api.get(`/itinerary/${profile.summit_id}`).then((r) => r.data);
        },
        { enabled: !!profile?.summit_id }
    );

    // Event details modal state (view agenda on click)
    const [activeDetailItem, setActiveDetailItem] = useState<ItineraryItem | null>(null);

    // Rating modal state
    const [activeRatingItem, setActiveRatingItem] = useState<ItineraryItem | null>(null);
    const [ratingScore, setRatingScore] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingStatus, setRatingStatus] = useState<"idle" | "submitting" | "done">("idle");
    const [ratingError, setRatingError] = useState<string | null>(null);
    const submittingRating = ratingStatus === "submitting";

    const openRatingModal = (item: ItineraryItem) => {
        setActiveRatingItem(item);
        setRatingScore(item.user_rating || 0);
        setRatingComment(item.user_comment || "");
        setRatingStatus("idle");
        setRatingError(null);
    };

    const closeRatingModal = () => {
        if (!submittingRating) setActiveRatingItem(null);
    };

    const submitRating = async () => {
        if (!activeRatingItem || ratingScore === 0) return;
        setRatingStatus("submitting");
        setRatingError(null);
        try {
            await api.post(`/itinerary/${activeRatingItem.id}/rate`, {
                score: ratingScore,
                comment: ratingComment.trim()
            });
            setRatingStatus("done");
            refreshItinerary();
            setTimeout(() => setActiveRatingItem(null), 1200);
        } catch (err: unknown) {
            setRatingStatus("idle");
            setRatingError(
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                "Failed to submit rating. Please try again."
            );
        }
    };

    const error = fetchError ? "Failed to load itinerary. Please try again." : null;

    if (loading) return <ListSkeleton />;

    if (error) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6 text-center">
                <p className="text-rose-500 font-medium">{error}</p>
            </div>
        );
    }

    const now = new Date();

    // Group items by date
    const groupedItems = (items || []).reduce((acc: Record<string, ItineraryItem[]>, item: ItineraryItem) => {
        const dateStr = new Date(item.start_time).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(item);
        return acc;
    }, {} as Record<string, ItineraryItem[]>);

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-4 pb-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground">Schedule</h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">Official Summit Itinerary</p>
            </header>

            {Object.keys(groupedItems).length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-sm">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" strokeWidth={1.5} />
                    <p className="font-semibold text-foreground">No events scheduled.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedItems).map(([date, dayItems]) => (
                        <div key={date}>
                            <h2 className="sticky top-0 bg-background/95 backdrop-blur z-10 py-3 text-sm font-bold tracking-wider uppercase text-primary border-b border-border/50 mb-4">
                                {date}
                            </h2>
                            <div className="space-y-4">
                                {dayItems.map((item) => {
                                    const startDate = new Date(item.start_time);
                                    const endDate = new Date(item.end_time);
                                    const isPassed = endDate <= now;
                                    const isHappeningNow = startDate <= now && endDate > now;
                                    const agendaList = parseAgenda(item.agenda);

                                    const start = startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                    const end = endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setActiveDetailItem(item)}
                                            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-all space-y-4 cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-foreground text-lg leading-tight pr-4">
                                                    {item.title}
                                                </h3>
                                            </div>

                                            {item.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}

                                            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-primary shrink-0" />
                                                    <span>{start} - {end}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-rose-500 shrink-0" />
                                                    <span>{item.location || "TBA"}</span>
                                                </div>
                                            </div>

                                            {/* Agenda Items Count Prompt */}
                                            {agendaList.length > 0 && (
                                                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span className="font-semibold text-primary">{agendaList.length} Program items</span>
                                                    <span className="text-[11px] font-medium">Click to view program agenda →</span>
                                                </div>
                                            )}

                                            {/* Status & Rating Bar */}
                                            {isHappeningNow && (
                                                <div className="pt-2 border-t border-border/50 flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    Happening Now
                                                </div>
                                            )}

                                            {isPassed && (
                                                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                        Ended
                                                    </span>

                                                    {item.user_rating ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRatingModal(item);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                                        >
                                                            <Star size={13} className="fill-amber-400 text-amber-500" strokeWidth={0} />
                                                            <span>Rated {item.user_rating}/5</span>
                                                            <span className="text-[10px] opacity-75 underline ml-0.5">Edit</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRatingModal(item);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                                                        >
                                                            <Star size={13} className="text-primary fill-primary/30" />
                                                            <span>Rate Event</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Event Details & Agenda Modal */}
            {activeDetailItem && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setActiveDetailItem(null)}
                >
                    <div
                        className="bg-card border border-border shadow-2xl rounded-t-[2.5rem] sm:rounded-[2rem] p-6 w-full max-w-lg max-h-[88vh] flex flex-col text-left animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
                            <div className="space-y-1 pr-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                    {new Date(activeDetailItem.start_time).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                                    {activeDetailItem.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setActiveDetailItem(null)}
                                className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors cursor-pointer shrink-0"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 -mr-1">
                            {/* Time & Location Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold">
                                <div className="flex items-center gap-2 text-foreground">
                                    <Clock size={15} className="text-primary shrink-0" />
                                    <span>
                                        {new Date(activeDetailItem.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - {new Date(activeDetailItem.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground">
                                    <MapPin size={15} className="text-rose-500 shrink-0" />
                                    <span className="truncate">{activeDetailItem.location || "ASCON Main Campus"}</span>
                                </div>
                            </div>

                            {/* Status Pill */}
                            {(() => {
                                const s = new Date(activeDetailItem.start_time);
                                const e = new Date(activeDetailItem.end_time);
                                if (s <= now && e > now) {
                                    return (
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>Happening Right Now</span>
                                        </div>
                                    );
                                }
                                if (e <= now) {
                                    return (
                                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                <span>Session Ended</span>
                                            </span>
                                            {activeDetailItem.user_rating && (
                                                <span className="text-amber-500 font-bold flex items-center gap-1">
                                                    <Star size={12} className="fill-amber-400" />
                                                    Your rating: {activeDetailItem.user_rating}/5
                                                </span>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Session Description */}
                            {activeDetailItem.description && (
                                <div className="space-y-1.5">
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                        Session Overview
                                    </h4>
                                    <p className="text-sm text-foreground/90 leading-relaxed font-normal bg-card">
                                        {activeDetailItem.description}
                                    </p>
                                </div>
                            )}

                            {/* Program Agenda List */}
                            {(() => {
                                const agendaList = parseAgenda(activeDetailItem.agenda);
                                return (
                                    <div className="space-y-3 pt-2 border-t border-border/50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                                                <ListOrdered size={14} />
                                                Detailed Program Agenda
                                            </h4>
                                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                                                {agendaList.length} {agendaList.length === 1 ? "Item" : "Items"}
                                            </span>
                                        </div>

                                        {agendaList.length > 0 ? (
                                            <div className="space-y-2.5 relative before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-0.5 before:bg-border/60">
                                                {agendaList.map((ag, idx) => (
                                                    <div key={idx} className="relative flex items-start gap-3 pl-1">
                                                        {/* Numbered bullet */}
                                                        <div className="w-7 h-7 rounded-full bg-card border-2 border-primary/40 text-primary flex items-center justify-center text-[10px] font-black shrink-0 z-10 shadow-xs">
                                                            {idx + 1}
                                                        </div>
                                                        {/* Content card */}
                                                        <div className="flex-1 p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors space-y-1">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2 py-0.5 rounded-md bg-primary/10 inline-block">
                                                                {ag.label}
                                                            </span>
                                                            <p className="text-xs text-foreground font-semibold leading-snug">
                                                                {ag.value}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic py-2">
                                                No minute-by-minute breakdown listed for this session.
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                            {new Date(activeDetailItem.end_time) <= now && (
                                <button
                                    onClick={() => {
                                        const itemToRate = activeDetailItem;
                                        setActiveDetailItem(null);
                                        openRatingModal(itemToRate);
                                    }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-md shadow-primary/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Star size={14} className="fill-amber-400 text-amber-400" />
                                    <span>{activeDetailItem.user_rating ? "Edit Rating" : "Rate This Session"}</span>
                                </button>
                            )}
                            <button
                                onClick={() => setActiveDetailItem(null)}
                                className="flex-1 py-3 px-4 rounded-xl border border-border text-foreground font-bold text-xs uppercase tracking-wider hover:bg-muted transition-colors cursor-pointer text-center"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {activeRatingItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closeRatingModal}
                >
                    <div
                        className="bg-card border border-border shadow-2xl rounded-[2rem] p-6 w-full max-w-sm text-center animate-in zoom-in-95 duration-200 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={closeRatingModal}
                            disabled={submittingRating}
                            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>

                        {ratingStatus !== "done" ? (
                            <>
                                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                                    <Star size={28} className="text-amber-500 fill-amber-500" />
                                </div>

                                <h2 className="text-xl font-black text-foreground tracking-tight mb-1">
                                    Rate Event
                                </h2>
                                <p className="text-xs font-bold text-primary truncate px-4 mb-1">
                                    {activeRatingItem.title}
                                </p>
                                <p className="text-xs text-muted-foreground mb-6">
                                    How was your experience during this session?
                                </p>

                                {/* Star Selector */}
                                <div className="flex justify-center gap-2 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const isFilled = star <= ratingScore;
                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                                onClick={() => setRatingScore(star)}
                                                className="p-1 transform transition-transform active:scale-90 cursor-pointer"
                                            >
                                                <Star
                                                    size={32}
                                                    className={
                                                        isFilled
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-slate-300 dark:text-slate-700"
                                                    }
                                                    strokeWidth={isFilled ? 0 : 2}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="h-5 mb-4">
                                    {ratingScore > 0 ? (
                                        <span className="text-xs font-bold text-amber-500 tracking-wide uppercase">
                                            {RATING_LABELS[ratingScore]}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Select a star rating</span>
                                    )}
                                </div>

                                {/* Optional Feedback Textarea */}
                                <textarea
                                    placeholder="Share your thoughts or highlights... (Optional)"
                                    className="w-full p-3.5 bg-muted border border-border text-foreground placeholder:text-muted-foreground rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none mb-4"
                                    rows={3}
                                    value={ratingComment}
                                    onChange={(e) => setRatingComment(e.target.value)}
                                    disabled={submittingRating}
                                />

                                {ratingError && (
                                    <p className="text-xs text-rose-500 font-semibold mb-4 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                                        {ratingError}
                                    </p>
                                )}

                                <div className="flex flex-col gap-2.5">
                                    <button
                                        disabled={ratingScore === 0 || submittingRating}
                                        onClick={submitRating}
                                        className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {submittingRating ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                Submit Feedback <Send size={13} />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={submittingRating}
                                        onClick={closeRatingModal}
                                        className="w-full py-2.5 text-muted-foreground font-bold text-xs hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="py-6 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={36} className="text-emerald-500" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Thank You!</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Your feedback has been recorded.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
