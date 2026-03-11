"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Command, Menu, CalendarDays, ChevronLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocus } from "@/context/FocusContext";

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { setViewMode } = useFocus();

    // Local nav history — kept here so navigating doesn't re-render all context consumers
    const navHistoryRef = useRef<string[]>([]);
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        if (!pathname) return;
        const prev = navHistoryRef.current;
        // Don't push duplicate consecutive paths
        if (prev[prev.length - 1] !== pathname) {
            navHistoryRef.current = [...prev, pathname].slice(-20);
            setCanGoBack(navHistoryRef.current.length > 1);
        }
    }, [pathname]);

    const handleBack = () => {
        const history = navHistoryRef.current;
        const prevPath = history[history.length - 2];
        if (prevPath) {
            navHistoryRef.current = history.slice(0, -1);
            setCanGoBack(navHistoryRef.current.length > 1);
            router.push(prevPath);
        }
    };

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1E1A17]/80 backdrop-blur-md border-b border-white/5 h-16">
            <div className="max-w-4xl mx-auto px-4 h-full flex items-center justify-between">

                {/* LEFT: Back button + Brand */}
                <div className="flex items-center gap-2">
                    {/* In-app back button */}
                    <AnimatePresence>
                        {canGoBack && (
                            <motion.button
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                                onClick={handleBack}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-colors text-xs font-bold tracking-wider"
                                aria-label="Go back"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:block">BACK</span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#F78320]/10 rounded-lg flex items-center justify-center text-lg shadow-sm border border-[#F78320]/20 text-[#F78320]">
                            🦁
                        </div>
                        <span className="text-lg font-bold text-white tracking-widest uppercase hidden md:block">COMMANDER</span>
                    </div>
                </div>

                {/* DESKTOP NAV */}
                <div className="hidden md:flex items-center gap-2 relative">
                    <Link
                        href="/dashboard"
                        className={`relative px-4 py-2 rounded-xl transition-colors ${isActive("/dashboard") ? "text-white font-bold" : "text-white/60 hover:text-white"}`}
                    >
                        <span className="flex items-center gap-2 z-10 relative">
                            <LayoutDashboard className="w-4 h-4" />
                            DASHBOARD
                        </span>
                        {isActive("/dashboard") && (
                            <motion.div
                                layoutId="active-nav"
                                className="absolute inset-0 rounded-xl"
                                style={{ background: "var(--accent)" }}
                            />
                        )}
                    </Link>

                    <Link
                        href="/command"
                        className={`relative px-4 py-2 rounded-xl transition-colors ${isActive("/command") ? "text-white font-bold" : "text-white/60 hover:text-white"}`}
                    >
                        <span className="flex items-center gap-2 z-10 relative">
                            <Command className="w-4 h-4" />
                            COMMAND
                        </span>
                        {isActive("/command") && (
                            <motion.div
                                layoutId="active-nav"
                                className="absolute inset-0 rounded-xl"
                                style={{ background: "var(--accent)" }}
                            />
                        )}
                    </Link>

                    <Link
                        href="/schedule"
                        className={`relative px-4 py-2 rounded-xl transition-colors ${isActive("/schedule") ? "text-white font-bold" : "text-white/60 hover:text-white"}`}
                    >
                        <span className="flex items-center gap-2 z-10 relative">
                            <CalendarDays className="w-4 h-4" />
                            SCHEDULE
                        </span>
                        {isActive("/schedule") && (
                            <motion.div
                                layoutId="active-nav"
                                className="absolute inset-0 rounded-xl"
                                style={{ background: "var(--accent)" }}
                            />
                        )}
                    </Link>
                </div>

                {/* RIGHT: Today overview + mobile toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode("schedule_agent")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all text-[10px] font-bold tracking-wider uppercase"
                    >
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span className="hidden sm:block">TODAY</span>
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-white/80"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-[#1E1A17] border-b border-white/5 overflow-hidden"
                    >
                        <div className="p-4 space-y-2">
                            <Link
                                href="/dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl ${isActive("/dashboard") ? "bg-[#F78320] text-white" : "text-white/60"}`}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span className="font-bold">Dashboard</span>
                            </Link>
                            <Link
                                href="/command"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl ${isActive("/command") ? "text-white" : "text-white/60"}`}
                                style={isActive("/command") ? { background: "var(--accent)" } : {}}
                            >
                                <Command className="w-5 h-5" />
                                <span className="font-bold">Command Center</span>
                            </Link>
                            <Link
                                href="/schedule"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl ${isActive("/schedule") ? "text-white" : "text-white/60"}`}
                                style={isActive("/schedule") ? { background: "var(--accent)" } : {}}
                            >
                                <CalendarDays className="w-5 h-5" />
                                <span className="font-bold">Schedule</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
