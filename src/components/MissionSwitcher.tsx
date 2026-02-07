"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Check } from "lucide-react";

interface Mission {
    id: string;
    config: {
        name: string;
        duration: number;
    };
}

interface MissionSwitcherProps {
    missions: { [id: string]: any };
    activeMissionId: string | null;
    onSwitch: (id: string) => void;
}

export default function MissionSwitcher({ missions, activeMissionId, onSwitch }: MissionSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const activeMissionName = activeMissionId && missions[activeMissionId]
        ? missions[activeMissionId].config.name
        : "Select Mission";

    return (
        <div className="relative z-50 flex justify-center mb-4" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#EFE0C8]/80 backdrop-blur-md rounded-full shadow-lg border border-[#252525]/5 hover:bg-[#EFE0C8] transition-colors"
            >
                <span className="text-sm font-bold text-[#252525]">{activeMissionName}</span>
                <ChevronDown className={`w-4 h-4 text-[#252525]/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-12 w-56 bg-[#F8F4E9] rounded-2xl shadow-xl border border-[#252525]/5 overflow-hidden p-1"
                    >
                        <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-1">
                            {Object.keys(missions).length > 0 ? (
                                Object.entries(missions).map(([id, data]: [string, any]) => (
                                    <button
                                        key={id}
                                        onClick={() => {
                                            onSwitch(id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${activeMissionId === id
                                                ? "bg-[#F78320]/10 text-[#F78320]"
                                                : "hover:bg-[#252525]/5 text-[#252525]"
                                            }`}
                                    >
                                        <span className="text-sm font-medium truncate">{data.config.name}</span>
                                        {activeMissionId === id && <Check className="w-3 h-3" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-xs text-[#252525]/40 text-center">No missions found</div>
                            )}
                        </div>

                        <div className="h-px bg-[#252525]/5 my-1" />

                        <Link href="/new-challenge" onClick={() => setIsOpen(false)}>
                            <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#F78320] hover:bg-[#F78320]/5 transition-colors cursor-pointer">
                                <Plus className="w-4 h-4" />
                                <span className="text-xs font-bold">Create New Mission</span>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
