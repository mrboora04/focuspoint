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

    const priorityColor = {
        High: "bg-red-500",
        Medium: "bg-yellow-500",
        Low: "bg-blue-500",
    };

    const priorityPoints = { High: 15, Medium: 10, Low: 5 };
    const points = priorityPoints[priority];

    const handleComplete = () => {
        setStatus("completed");
        setTimeout(() => onComplete(points), 500);
    };

    return (
        <AnimatePresence>
            {status === "pending" && (
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="w-full bg-white/70 backdrop-blur-2xl rounded-[1.5rem] border border-white/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden active:scale-[0.99] transition-transform duration-100"
                >
                    {/* Header Row */}
                    <div
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center justify-between p-5 cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            {/* Priority Dot */}
                            <div className={`w-3 h-3 rounded-full ${priorityColor[priority]} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} />

                            <h3 className="text-lg font-bold text-[#252525] tracking-tight">{title}</h3>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-[#252525]/5 px-3 py-1 rounded-full">
                                <Zap className="w-3 h-3 text-[#F78320]" strokeWidth={2} />
                                <span className="text-xs font-bold text-[#252525]/60">{points} pts</span>
                            </div>
                            <ChevronDown
                                className={`w-5 h-5 text-[#252525]/30 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                strokeWidth={2}
                            />
                        </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-5 pb-5 border-t border-[#252525]/5 pt-4 bg-[#F8F4E9]/30"
                            >
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[#252525]/40 uppercase tracking-widest">Do</p>
                                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10">
                                            <Check className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                                            <span className="text-sm font-medium text-emerald-800">{doText || "Execute with focus."}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[#252525]/40 uppercase tracking-widest">Don't</p>
                                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/10">
                                            <X className="w-4 h-4 text-red-600" strokeWidth={2} />
                                            <span className="text-sm font-medium text-red-800">{dontText || "Get distracted."}</span>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleComplete();
                                    }}
                                    className="w-full py-4 rounded-xl bg-[#252525] text-white font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10"
                                >
                                    <Flame className="w-5 h-5 text-[#F78320]" strokeWidth={2} />
                                    COMPLETE TASK
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}