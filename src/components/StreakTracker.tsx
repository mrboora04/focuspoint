"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Expand, ChevronRight, Minimize } from "lucide-react";
import { useState } from "react";

interface DailyHistory {
    [date: string]: "completed" | "failed" | "skipped" | undefined;
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

    let startView = Math.max(0, todayIndex - 3);
    let endView = Math.min(days.length, startView + 7);
    if (endView - startView < 7) startView = Math.max(0, endView - 7);

    const visibleDays = isExpanded ? days : days.slice(startView, endView);

    return (
        <div className="w-full relative">
            <div className="absolute -top-12 right-0">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#252525]/60 hover:text-[#F78320] bg-white/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/40 transition-colors"
                >
                    {isExpanded ? <><Minimize className="w-3 h-3" /> COMPACT</> : <><Expand className="w-3 h-3" /> VIEW ALL</>}
                </button>
            </div>

            <div className={`flex flex-wrap gap-3 ${isExpanded ? "justify-center" : "justify-start overflow-x-auto pb-4 scrollbar-hide snap-x px-2"}`}>
                {visibleDays.map((date, i) => {
                    const index = isExpanded ? i : startView + i;
                    const dateStr = date.toISOString().split('T')[0];
                    const status = history[dateStr];
                    const isToday = dateStr === todayStr;
                    const isPast = date < new Date() && !isToday;

                    let statusClass = "bg-[#252525]/5 border-[#252525]/5 opacity-40";
                    let content = <span className="text-xs font-bold text-[#252525]/40">{index + 1}</span>;

                    if (status === "completed") {
                        statusClass = "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20";
                        content = <Check className="w-5 h-5 text-white" strokeWidth={3} />;
                    } else if (status === "failed") {
                        statusClass = "bg-red-500/10 border-red-500/30";
                        content = <X className="w-5 h-5 text-red-500" strokeWidth={2} />;
                    } else if (status === "skipped") {
                        statusClass = "bg-blue-500/10 border-blue-500/30";
                        content = <div className="w-2 h-2 rounded-full bg-blue-500" />;
                    } else if (isToday) {
                        statusClass = "bg-[#F8F4E9] border-[#F78320] border-[3px] shadow-[0_0_20px_rgba(247,131,32,0.3)] animate-pulse";
                        content = <span className="text-sm font-black text-[#252525]">{index + 1}</span>;
                    } else if (isPast) {
                        statusClass = "bg-red-900/5 border-red-500/10";
                        content = <span className="text-xs font-bold text-red-400 opacity-60">{index + 1}</span>;
                    }

                    return (
                        <motion.div
                            key={dateStr}
                            layout
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border cursor-pointer hover:scale-105 transition-transform ${statusClass}`}
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
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#F8F4E9] w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-white/40 relative"
                        >
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="absolute top-6 right-6 text-[#252525]/30 hover:text-[#252525]"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h3 className="text-3xl font-black text-[#252525] mb-1 tracking-tight">
                                Day <span className="text-[#F78320]">{days.findIndex(d => d.toISOString().split('T')[0] === selectedDate) + 1}</span>
                            </h3>
                            <p className="text-xs text-[#252525]/50 mb-6 uppercase tracking-widest font-bold">{selectedDate}</p>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                                {dailyLogs && dailyLogs[selectedDate]?.tasks?.length > 0 ? (
                                    dailyLogs[selectedDate].tasks.map((task, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-[#252525]/5">
                                            <div>
                                                <p className="font-bold text-[#252525] text-sm">{task.title}</p>
                                                <div className="flex gap-2 text-[10px] text-[#252525]/60 mt-1 font-medium">
                                                    <span>{task.time}</span>
                                                    <span className={
                                                        task.priority === "High" ? "text-orange-600" :
                                                            task.priority === "Medium" ? "text-yellow-600" :
                                                                "text-blue-600"
                                                    }>{task.priority}</span>
                                                </div>
                                            </div>
                                            <span className={`font-black tracking-tight ${task.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                {task.points > 0 ? "+" : ""}{task.points}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-30 text-[#252525] border-2 border-dashed border-[#252525]/10 rounded-3xl">
                                        <p className="text-sm font-bold">No activity recorded.</p>
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
