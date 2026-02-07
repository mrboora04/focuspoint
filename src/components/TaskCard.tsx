"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, Trophy, Flame, Zap } from "lucide-react";

interface TaskProps {
    title: string;
    priority: "High" | "Medium" | "Low";
    doText?: string;
    dontText?: string;
    onComplete: (points: number) => void;
}

export default function TaskCard({ title, priority, doText, dontText, onComplete }: TaskProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [status, setStatus] = useState<"pending" | "completed">("pending");

    // Priority Colors (Remapped for Warm Theme)
    const priorityColor = {
        High: "bg-[#F78320]", // Bright Orange
        Medium: "bg-[#EFE0C8]", // Beige
        Low: "bg-[#F8F4E9]", // Cream
    };

    return (
        <motion.div
            layout
            onClick={() => !isExpanded && setIsExpanded(true)}
            className={`relative overflow-hidden rounded-2xl border border-[#252525]/5 p-4 transition-colors ${isExpanded ? "bg-[#EFE0C8]" : "bg-[#F8F4E9]/90 hover:bg-[#F8F4E9]"
                }`}
        >
            {/* 1. MAIN ROW */}
            <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                    {/* Priority Dot with specific shadows */}
                    <div className={`w-2 h-2 rounded-full ${priorityColor[priority]} 
                        ${priority === 'High' ? 'shadow-[0_0_8px_#F78320]' : ''}
                        ${priority === 'Medium' ? 'shadow-[0_0_8px_rgba(37,37,37,0.2)]' : ''}
                        ${priority === 'Low' ? 'shadow-[0_0_8px_rgba(37,37,37,0.1)]' : ''}
                    `} />
                    <h3 className="text-lg font-medium text-[#252525]">{title}</h3>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="text-[#252525]/40 hover:text-[#252525] transition-colors"
                >
                    <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* 2. EXPANDED CONTENT (Strategy & Scoring) */}
            <AnimatePresence>
                {isExpanded && status === "pending" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4"
                    >
                        {/* DO & DON'T SECTION */}
                        {(doText || dontText) && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-[#252525]/5 border border-[#252525]/10 p-2 rounded-lg text-[#252525]/80">
                                    <span className="font-bold block mb-1 text-[#252525]">✅ DO</span>
                                    {doText || "Focus on one thing."}
                                </div>
                                <div className="bg-[#252525]/5 border border-[#252525]/10 p-2 rounded-lg text-[#252525]/80">
                                    <span className="font-bold block mb-1 text-[#252525]">❌ DON'T</span>
                                    {dontText || "Multitask."}
                                </div>
                            </div>
                        )}

                        {/* SCORING BUTTONS (Warm Theme) */}
                        <div className="grid grid-cols-4 gap-2 pt-2">
                            <button
                                onClick={() => onComplete(-15)}
                                className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-[#252525]/5 hover:bg-red-500/10 hover:text-red-600 text-[#252525]/60 transition-colors border border-[#252525]/5"
                            >
                                <X className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-bold">FAIL</span>
                            </button>

                            <button
                                onClick={() => onComplete(10)}
                                className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-[#F8F4E9] hover:bg-[#F78320]/20 text-[#252525] transition-colors border border-[#252525]/5"
                            >
                                <Check className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-bold">GOOD</span>
                            </button>

                            <button
                                onClick={() => onComplete(25)}
                                className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-[#F8F4E9] hover:bg-[#F78320]/20 text-[#252525] transition-colors border border-[#252525]/5"
                            >
                                <Zap className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-bold">BETTER</span>
                            </button>

                            <button
                                onClick={() => onComplete(50)}
                                className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-[#F78320] to-[#F78320]/80 text-white shadow-lg shadow-[#F78320]/20 hover:shadow-[#F78320]/40 transition-all transform hover:scale-105"
                            >
                                <Trophy className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-bold">BEST</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}