"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Expand, ChevronRight, Minimize } from "lucide-react";
import { useState } from "react";

interface DailyHistory {
    [date: string]: "completed" | "failed" | undefined;
}

interface TaskLog {
    title: string;
    points: number;
    time: string;
    priority: "High" | "Medium" | "Low";
}

interface StreakTrackerProps {
    history: DailyHistory;
    dailyLogs: { [date: string]: { tasks: TaskLog[] } };
    startDate: string;
    duration: number;
}

export default function StreakTracker({ history, dailyLogs, startDate, duration }: StreakTrackerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    if (!startDate) return null;

    const start = new Date(startDate);
    const days = Array.from({ length: duration }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        return date;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayIndex = days.findIndex(d => d.toISOString().split('T')[0] === todayStr);

    // Compact View Logic
    let startView = Math.max(0, todayIndex - 3);
    let endView = Math.min(days.length, startView + 7);
    if (endView - startView < 7) startView = Math.max(0, endView - 7);

    const visibleDays = isExpanded ? days : days.slice(startView, endView);

    return (
        <div className="w-full relative">
            <div className="absolute -top-10 right-0">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-xs font-bold text-[#F78320] hover:underline"
                >
                    {isExpanded ? <><Minimize className="w-3 h-3" /> COMPACT</> : <><Expand className="w-3 h-3" /> VIEW ALL</>}
                </button>
            </div>

            <div className={`flex flex-wrap gap-2 ${isExpanded ? "justify-center" : "justify-start overflow-x-auto pb-2 scrollbar-hide snap-x"}`}>
                {visibleDays.map((date, i) => {
                    const index = isExpanded ? i : startView + i;
                    const dateStr = date.toISOString().split('T')[0];
                    const status = history[dateStr];
                    const isToday = dateStr === todayStr;
                    const isPast = date < new Date() && !isToday;

                    let statusClass = "bg-[#252525]/5 border-[#252525]/5 opacity-40";
                    let content = <span className="text-xs font-medium text-[#252525]/40">{index + 1}</span>;

                    if (status === "completed") {
                        statusClass = "bg-emerald-500 border-emerald-500 shadow-emerald-500/20";
                        content = <Check className="w-4 h-4 text-white" strokeWidth={4} />;
                    } else if (status === "failed") {
                        statusClass = "bg-red-500/10 border-red-500/30";
                        content = <X className="w-4 h-4 text-red-500" />;
                    } else if (isToday) {
                        statusClass = "bg-[#F8F4E9] border-[#F78320] border-2 shadow-[0_0_15px_rgba(247,131,32,0.4)] animate-pulse";
                        content = <span className="text-xs font-bold text-[#252525]">{index + 1}</span>;
                    } else if (isPast) {
                        statusClass = "bg-red-900/10 border-red-500/20";
                        content = <span className="text-xs font-bold text-red-400">{index + 1}</span>;
                    }

                    return (
                        <motion.div
                            key={dateStr}
                            layout
                            onClick={() => setSelectedDate(dateStr)} // Open Modal
                            className={`w-10 h-10 shrink-0 rounded-md flex items-center justify-center border cursor-pointer hover:scale-110 transition-transform ${statusClass}`}
                        >
                            {content}
                        </motion.div>
                    );
                })}
            </div>

            {/* DETAILS MODAL */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSelectedDate(null)}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#F8F4E9] w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-white/20 relative"
                        >
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="absolute top-4 right-4 text-[#252525]/40 hover:text-[#252525]"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-xl font-bold text-[#252525] mb-1">
                                Day <span className="text-[#F78320]">{days.findIndex(d => d.toISOString().split('T')[0] === selectedDate) + 1}</span>
                            </h3>
                            <p className="text-xs text-[#252525]/50 mb-6 uppercase tracking-widest">{selectedDate}</p>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {dailyLogs && dailyLogs[selectedDate]?.tasks?.length > 0 ? (
                                    dailyLogs[selectedDate].tasks.map((task, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-[#EFE0C8]/30 rounded-lg border border-[#252525]/5">
                                            <div>
                                                <p className="font-medium text-[#252525] text-sm">{task.title}</p>
                                                <div className="flex gap-2 text-[10px] text-[#252525]/60 mt-1">
                                                    <span>{task.time}</span>
                                                    <span className={
                                                        task.priority === "High" ? "text-orange-600" :
                                                            task.priority === "Medium" ? "text-yellow-600" :
                                                                "text-blue-600"
                                                    }>{task.priority}</span>
                                                </div>
                                            </div>
                                            <span className={`font-bold ${task.points > 0 ? "text-green-600" : "text-red-500"}`}>
                                                {task.points > 0 ? "+" : ""}{task.points}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 opacity-40 text-[#252525]">
                                        <p className="text-sm">No activity recorded.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
