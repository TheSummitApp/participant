import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import FloatingNotes from "@/components/FloatingNotes";
import AuthGuard from "@/components/AuthGuard";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaPrompt from "@/components/PwaPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YSA Summit Participant Companion",
  description: "Official mobile companion software for the YSA Summit.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YSA Guide",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#002855" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased font-sans flex flex-col min-h-screen bg-background text-foreground pb-20 pt-safe">
        <ThemeProvider>
          <AuthGuard>
            {/* Floating Action Button */}
            <FloatingNotes />

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-lg mx-auto relative">{children}</main>

            {/* Sticky PWA Mobile Navigation */}
            <BottomNav />

            {/* Global Install / Notification Prompts */}
            <PwaPrompt />
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
