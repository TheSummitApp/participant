"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // List of public routes that don't require authentication
        const publicRoutes = ["/login", "/auto-login", "/v"];

        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

        const token = localStorage.getItem("summit_participant_token");

        if (!token && !isPublicRoute) {
            setAuthorized(false);
            router.push("/login");
        } else {
            setAuthorized(true);
        }
    }, [pathname, router]);

    // If we are on a public route, just show children
    const publicRoutes = ["/login", "/auto-login", "/v"];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (!authorized && !isPublicRoute) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
