"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Calendar, Utensils, Home as HomeIcon, MapPin, User, Sunrise, Moon, CloudSun, LogOut } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ParticipantDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<{ first_name: string; stake: string; lodging_room?: string; company_name?: string; lodging_name?: string; bed_label?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/participants/profile');
        setUser(res.data);
      } catch {
        // If token is invalid or missing, go to login
        localStorage.removeItem("summit_participant_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("summit_participant_token");
    if (!token) {
      router.push("/login");
    } else {
      fetchProfile();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("summit_participant_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  // A simple greeting logic based on time
  const hour = new Date().getHours();
  let greeting = "Good evening";
  let GreetingIcon = Moon;
  if (hour < 12) {
    greeting = "Good morning";
    GreetingIcon = Sunrise;
  } else if (hour < 17) {
    greeting = "Good afternoon";
    GreetingIcon = CloudSun;
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center bg-card p-6 rounded-[2rem] shadow-sm border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold">
            <GreetingIcon size={18} />
            <span className="text-xs uppercase tracking-widest">{greeting}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{user.first_name}</h1>
          <p className="text-muted-foreground text-sm font-medium">{user.stake} Stake</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            {theme === "dark" ? <Sunrise size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/itinerary" className="bg-blue-500 text-white p-6 rounded-[2rem] flex flex-col justify-between shadow-lg shadow-blue-500/20 active:scale-95 transition-transform aspect-square relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
          <Calendar size={32} strokeWidth={2.5} className="mb-4" />
          <div>
            <h3 className="font-bold text-lg leading-tight">Itinerary</h3>
            <p className="text-blue-100 text-xs font-medium mt-1">Today&apos;s Schedule</p>
          </div>
        </Link>

        <div className="flex flex-col gap-4">
          <Link href="/scan" className="bg-emerald-500 text-white p-6 rounded-[2rem] flex-1 flex flex-col justify-between shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-4 translate-x-4 blur-xl pointer-events-none" />
            <Utensils size={24} strokeWidth={2.5} />
            <div>
              <h3 className="font-bold leading-tight">Meals</h3>
              <p className="text-emerald-100 text-[10px] font-medium mt-1">Scan for food</p>
            </div>
          </Link>

          <Link href="/profile" className="bg-card text-card-foreground p-6 rounded-[2rem] border border-border flex-1 flex flex-col justify-between shadow-sm active:scale-95 transition-transform relative overflow-hidden">
            <HomeIcon size={24} strokeWidth={2.5} className="text-amber-500" />
            <div>
              <h3 className="font-bold leading-tight">Housing</h3>
              <p className="text-muted-foreground text-[10px] font-medium mt-1">Room {user.lodging_room || "TBA"}</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <User size={20} className="text-primary" />
          <h2 className="font-bold text-lg">Your Details</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Company</p>
              <p className="font-medium">{user.company_name || 'Not Assigned'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <HomeIcon size={14} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Lodging</p>
              <p className="font-medium">{user.lodging_name || 'TBA'} • Room {user.lodging_room || 'TBA'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bed {user.bed_label || 'TBA'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
