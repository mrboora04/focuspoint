"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Command, Menu } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    const NavItem = ({ path, label, icon: Icon }: { path: string; label: string; icon: any }) => (
        <Link
            href={path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isActive(path)
                    ? "bg-[#F78320] text-white font-bold shadow-md shadow-[#F78320]/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
        >
            <Icon className="w-4 h-4" />
            <span className="text-sm tracking-wide">{label}</span>
            {isActive(path) && (
                <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#F78320] rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
        </Link>
    );

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1E1A17]/80 backdrop-blur-md border-b border-white/5 h-16">
            <div className="max-w-4xl mx-auto px-4 h-full flex items-center justify-between">

                {/* BRAND */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F78320]/10 rounded-lg flex items-center justify-center text-lg shadow-sm border border-[#F78320]/20 text-[#F78320]">
                        🦁
                    </div>
                    <span className="text-lg font-bold text-white tracking-widest uppercase hidden md:block">COMMANDER</span>
                </div>

                {/* DESKTOP NAV */}
                <div className="hidden md:flex items-center gap-2 relative">
                    <Link
                        href="/dashboard"
                        className={`relative px-4 py-2 rounded-xl transition-colors ${isActive("/dashboard") ? "text-white font-bold" : "text-white/60 hover:text-white"
                            }`}
                    >
                        <span className="flex items-center gap-2 z-10 relative">
                            <LayoutDashboard className="w-4 h-4" />
                            DASHBOARD
                        </span>
                        {isActive("/dashboard") && (
                            <motion.div
                                layoutId="active-nav"
                                className="absolute inset-0 bg-[#F78320] rounded-xl"
                            />
                        )}
                    </Link>

                    <Link
                        href="/command"
                        className={`relative px-4 py-2 rounded-xl transition-colors ${isActive("/command") ? "text-white font-bold" : "text-white/60 hover:text-white"
                            }`}
                    >
                        <span className="flex items-center gap-2 z-10 relative">
                            <Command className="w-4 h-4" />
                            COMMAND
                        </span>
                        {isActive("/command") && (
                            <motion.div
                                layoutId="active-nav"
                                className="absolute inset-0 bg-[#F78320] rounded-xl"
                            />
                        )}
                    </Link>
                </div>

                {/* MOBILE MENU TOGGLE */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-white/80"
                >
                    <Menu className="w-6 h-6" />
                </button>

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
                                className={`flex items-center gap-3 p-3 rounded-xl ${isActive("/dashboard") ? "bg-[#F78320] text-white" : "text-white/60"
                                    }`}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span className="font-bold">Dashboard</span>
                            </Link>
                            <Link
                                href="/command"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl ${isActive("/command") ? "bg-[#F78320] text-white" : "text-white/60"
                                    }`}
                            >
                                <Command className="w-5 h-5" />
                                <span className="font-bold">Command Center</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
