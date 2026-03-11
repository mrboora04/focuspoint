"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, CheckCircle2, Target, Flame } from "lucide-react";
import { useFocus } from "@/context/FocusContext";
import { generateDailySchedule, findCurrentBlock, currentTimeHHMM } from "@/lib/scheduleEngine";
import CalendarImport from "@/components/CalendarImport";

export default function ScheduleAgentView({ onClose }: { onClose: () => void }) {
    const { scheduleProfile, state } = useFocus();
    const [tab, setTab] = useState<"overview" | "calendar">("overview");
    const [now] = useState(currentTimeHHMM());

    const today = new Date().toISOString().split("T")[0];
    const liveSchedule = useMemo(() => {
        if (!scheduleProfile) return null;
        return generateDailySchedule(scheduleProfile, Object.keys(state.missions), today);
    }, [scheduleProfile, state.missions, today]);

    const currentBlock = liveSchedule ? findCurrentBlock(liveSchedule.blocks) : null;

    const tasksCompleted = Object.values(state.missions).reduce((sum, m) =>
        sum + m.tasks.filter(t => t.status === "completed").length, 0);
    const tasksRemaining = Object.values(state.missions).reduce((sum, m) =>
        sum + m.tasks.filter(t => t.status === "pending").length, 0);
    const streak = state.userProfile?.current_streak ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-theme-bg overflow-y-auto"
        >
            {/* Header */}
            <div className="sticky top-0 bg-theme-bg/95 backdrop-blur border-b border-theme-border z-10 px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">Today · {now}</p>
                    <h2 className="text-base font-black text-theme-text tracking-tight">Daily Overview</h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* Tab switcher */}
                    <div className="flex bg-theme-card rounded-xl p-1 border border-theme-border">
                        {(["overview", "calendar"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                    tab === t
                                        ? "bg-theme-text text-theme-bg"
                                        : "text-theme-text/40 hover:text-theme-text/70"
                                }`}
                            >
                                {t === "overview" ? "Schedule" : "Calendar"}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-theme-text/40 hover:text-theme-text hover:bg-theme-card transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">

                <AnimatePresence mode="wait">
                    {tab === "overview" ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            className="space-y-4"
                        >
                            {/* Quick stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-theme-card rounded-xl p-3 border border-theme-border text-center">
                                    <Flame className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--accent)" }} fill="currentColor" />
                                    <p className="text-lg font-black text-theme-text">{streak}</p>
                                    <p className="text-[9px] opacity-40 uppercase tracking-widest">Streak</p>
                                </div>
                                <div className="bg-theme-card rounded-xl p-3 border border-theme-border text-center">
                                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                                    <p className="text-lg font-black text-theme-text">{tasksCompleted}</p>
                                    <p className="text-[9px] opacity-40 uppercase tracking-widest">Done</p>
                                </div>
                                <div className="bg-theme-card rounded-xl p-3 border border-theme-border text-center">
                                    <Target className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--danger)" }} />
                                    <p className="text-lg font-black text-theme-text">{tasksRemaining}</p>
                                    <p className="text-[9px] opacity-40 uppercase tracking-widest">Left</p>
                                </div>
                            </div>

                            {/* Current block highlight */}
                            {currentBlock && (
                                <div
                                    className="rounded-2xl p-4 border"
                                    style={{
                                        background: "var(--accent)15",
                                        borderColor: "var(--accent)40"
                                    }}
                                >
                                    <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--accent)" }}>
                                        Active Now
                                    </p>
                                    <h3 className="text-lg font-black text-theme-text">{currentBlock.label}</h3>
                                    <p className="text-xs opacity-50 font-mono mt-0.5">{currentBlock.startTime} – {currentBlock.endTime}</p>
                                </div>
                            )}

                            {/* Schedule timeline */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold tracking-widest uppercase opacity-40 px-1">Schedule</p>
                                {liveSchedule ? liveSchedule.blocks.map(b => {
                                    const isNow = currentBlock?.id === b.id;
                                    return (
                                        <div
                                            key={b.id}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                                isNow
                                                    ? "bg-theme-card border border-theme-border shadow-sm"
                                                    : b.isCompleted
                                                        ? "opacity-40"
                                                        : "opacity-70"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 opacity-40" />
                                                <span className="text-[10px] font-mono opacity-50 w-10">{b.startTime}</span>
                                            </div>
                                            <span className={`text-xs font-bold text-theme-text flex-1 ${isNow ? "" : "opacity-70"}`}>
                                                {b.label}
                                            </span>
                                            {isNow && (
                                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                                            )}
                                            {b.isCompleted && (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="py-8 text-center opacity-40">
                                        <Calendar className="w-6 h-6 mx-auto mb-2" />
                                        <p className="text-sm">No schedule configured.</p>
                                        <p className="text-xs mt-1">Visit Schedule to set up your daily grid.</p>
                                    </div>
                                )}
                            </div>

                            {/* Calendar events overlay on schedule */}
                            {state.calendarEvents.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-40 px-1">
                                        Calendar Events Today
                                    </p>
                                    {state.calendarEvents.map(ev => (
                                        <div key={ev.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15">
                                            <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                            <span className="text-xs font-bold text-theme-text flex-1">{ev.title}</span>
                                            <span className="text-[10px] font-mono text-theme-text/30">
                                                {ev.startTime instanceof Date
                                                    ? `${String(ev.startTime.getHours()).padStart(2,"0")}:${String(ev.startTime.getMinutes()).padStart(2,"0")}`
                                                    : ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Mission tasks summary */}
                            {Object.values(state.missions).length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-40 px-1">Mission Tasks</p>
                                    {Object.values(state.missions).map(m => (
                                        <div key={m.id} className="bg-theme-card rounded-xl p-3 border border-theme-border space-y-2">
                                            <p className="text-xs font-black text-theme-text">{m.config.name}</p>
                                            {m.tasks.map(t => (
                                                <div key={t.id} className={`flex items-center gap-2 text-xs ${t.status === "completed" ? "opacity-40 line-through" : ""}`}>
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "completed" ? "bg-emerald-500" : "bg-theme-border"}`} />
                                                    <span className="text-theme-text">{t.title}</span>
                                                    <span className="ml-auto text-[10px] opacity-40">{t.priority}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                        >
                            <CalendarImport />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
