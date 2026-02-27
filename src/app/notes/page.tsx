"use client";
import React, { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Loader2, StickyNote, Plus, Trash2, Edit3, Save, ChevronLeft } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface Note {
    id: string;
    title: string;
    content: string;
    updated_at: string;
}

export default function ParticipantNotes() {
    const { theme } = useTheme();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<{ id: string;[key: string]: unknown } | null>(null);

    const [activeNote, setActiveNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const profileRes = await api.get('/participants/profile');
                setProfile(profileRes.data);

                const res = await api.get(`/notes?participant_id=${profileRes.data.id}`);
                setNotes(res.data);
            } catch (err) {
                console.error("Failed to load notes", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    const handleCreateNew = () => {
        setActiveNote(null);
        setTitle("");
        setContent("");
        setIsEditing(true);
        // Focus textarea after a tiny delay
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const handleSave = async () => {
        if (!content.trim()) return;

        setSaving(true);
        try {
            if (activeNote) {
                // Update
                const res = await api.put(`/notes/${activeNote.id}`, { title, content });
                setNotes(notes.map(n => n.id === activeNote.id ? res.data : n));
                setActiveNote(res.data);
            } else {
                // Create
                const res = await api.post('/notes', { participant_id: profile?.id, title, content });
                setNotes([res.data, ...notes]);
                setActiveNote(res.data);
            }
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save note:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            await api.delete(`/notes/${id}`);
            setNotes(notes.filter(n => n.id !== id));
            if (activeNote?.id === id) {
                setActiveNote(null);
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Failed to delete note:", err);
        }
    };

    const openNote = (note: Note) => {
        setActiveNote(note);
        setTitle(note.title);
        setContent(note.content);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" strokeWidth={2} />
            </div>
        );
    }

    if (activeNote || isEditing) {
        // Detailed View / Edit View
        return (
            <div className="flex flex-col h-screen fixed inset-0 z-[100] bg-background">
                <header className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md pt-top-safe">
                    <button
                        onClick={() => {
                            if (isEditing && activeNote) {
                                setIsEditing(false);
                                setTitle(activeNote.title);
                                setContent(activeNote.content);
                            } else {
                                setActiveNote(null);
                                setIsEditing(false);
                            }
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all text-muted-foreground"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex gap-2">
                        {isEditing ? (
                            <button
                                onClick={handleSave}
                                disabled={saving || !content.trim()}
                                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => activeNote && handleDelete(activeNote.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 active:scale-95 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => { setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 100); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 active:scale-95 transition-all"
                                >
                                    <Edit3 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-amber-50/30 dark:bg-slate-900/50">
                    <div className="max-w-lg mx-auto w-full h-full flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Note Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            readOnly={!isEditing}
                            className={`text-2xl font-black bg-transparent outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-all ${!isEditing ? 'cursor-default' : ''}`}
                        />
                        <textarea
                            ref={textareaRef}
                            placeholder="Start typing your note here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            readOnly={!isEditing}
                            className={`flex-1 w-full resize-none font-medium leading-relaxed bg-transparent outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-all ${!isEditing ? 'cursor-default text-muted-foreground' : 'text-foreground'}`}
                        />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24 h-[85vh] flex flex-col">
            <header className="pt-4 pb-2 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <StickyNote className="text-amber-500" size={32} />
                        My Notes
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Jot down thoughts & learnings.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="w-12 h-12 bg-amber-500 text-white rounded-[1rem] flex items-center justify-center shadow-lg shadow-amber-500/30 active:scale-95 transition-transform"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-12">
                {notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 text-amber-500 rounded-3xl flex items-center justify-center mb-6 rotate-6">
                            <Edit3 size={32} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-foreground">No notes yet</h3>
                        <p className="text-sm font-medium text-muted-foreground">Tap the + button to create your first note.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                onClick={() => openNote(note)}
                                className={`aspect-square p-5 rounded-[2rem] flex flex-col justify-between shadow-sm active:scale-95 transition-all cursor-pointer border
                                    ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-amber-50/80 border-amber-100 hover:border-amber-200'}
                                `}
                            >
                                <h4 className="font-bold text-foreground line-clamp-2 leading-tight">
                                    {note.title || 'Untitled Note'}
                                </h4>
                                <p className={`text-xs mt-2 line-clamp-3 font-medium leading-relaxed
                                    ${theme === 'dark' ? 'text-slate-400' : 'text-amber-900/60'}
                                `}>
                                    {note.content}
                                </p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-auto pt-4
                                    ${theme === 'dark' ? 'text-slate-500' : 'text-amber-900/40'}
                                `}>
                                    {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
