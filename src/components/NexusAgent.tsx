"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap, Clock, ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from "lucide-react";
import { useFocus } from "@/context/FocusContext";
import { generateLocalSuggestions } from "@/lib/nexusEngine";
import { generateDailySchedule, findCurrentBlock, currentTimeHHMM } from "@/lib/scheduleEngine";

export default function NexusAgent() {
    const { state, scheduleProfile } = useFocus();
    const [expanded, setExpanded] = useState(false);
    const [now, setNow] = useState(currentTimeHHMM());

    // Tick clock every minute
    useEffect(() => {
        const t = setInterval(() => setNow(currentTimeHHMM()), 60_000);
        return () => clearInterval(t);
    }, []);

    // Build schedule and derive current block
    const today = new Date().toISOString().split("T")[0];
    const liveSchedule = useMemo(() => {
        if (!scheduleProfile) return null;
        return generateDailySchedule(scheduleProfile, Object.keys(state.missions), today);
    }, [scheduleProfile, state.missions, today]);

    const currentBlock = liveSchedule ? findCurrentBlock(liveSchedule.blocks) : null;
    const currentBlockLabel = currentBlock?.label ?? "No active block";

    // Compute stats from state directly
    const todayStr = new Date().toISOString().split("T")[0];
    const todayPoints = Object.values(state.missions).reduce((sum, m) => {
        if (m.scoreDate === todayStr) return sum + m.todayScore;
        return sum;
    }, 0);
    const currentStreak = state.userProfile?.current_streak ?? 0;
    const tasksCompleted = Object.values(state.missions).reduce((sum, m) =>
        sum + m.tasks.filter(t => t.status === "completed").length, 0);
    const tasksRemaining = Object.values(state.missions).reduce((sum, m) =>
        sum + m.tasks.filter(t => t.status === "pending").length, 0);

    // Generate local suggestions (no API calls)
    const suggestions = useMemo(() =>
        generateLocalSuggestions(state, liveSchedule),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [todayPoints, tasksCompleted, Object.keys(state.missions).length, currentBlockLabel]
    );

    const topSuggestion = suggestions[0] ?? null;

    // Status color based on productivity
    const statusColor = tasksCompleted > 0
        ? tasksRemaining === 0 ? "var(--success)" : "var(--accent)"
        : "var(--danger)";

    return (
        <motion.div
            layout
            className="bg-theme-card rounded-2xl md:rounded-3xl border border-theme-border shadow-sm overflow-hidden"
            style={{
                borderTop: `2px solid ${statusColor}`,
                boxShadow: `0 0 20px ${statusColor}15`,
            }}
        >
            {/* ── Main agent bar (always visible) ── */}
            <div className="p-4 md:p-5">
                <div className="flex items-start gap-3">
                    {/* Agent avatar */}
                    <div
                        className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: `${statusColor}20`,
                            border: `1.5px solid ${statusColor}40`,
                            boxShadow: `0 0 12px ${statusColor}30`,
                        }}
                    >
                        <Bot className="w-5 h-5 md:w-6 md:h-6" style={{ color: statusColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header row */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: statusColor }}>
                                    NEXUS
                                </span>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                                    <span className="text-[9px] opacity-40 tracking-wider">LOCAL</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-40">
                                <Clock className="w-3 h-3" />
                                <span className="font-mono">{now}</span>
                            </div>
                        </div>

                        {/* Current block badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide"
                                style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                                {currentBlockLabel}
                            </span>
                        </div>

                        {/* Top suggestion */}
                        {topSuggestion ? (
                            <div>
                                <h3 className="text-sm md:text-base font-black text-theme-text leading-tight mb-0.5">
                                    {topSuggestion.headline}
                                </h3>
                                <p className="text-xs md:text-sm opacity-60 leading-relaxed">
                                    {topSuggestion.description}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-sm font-black text-theme-text leading-tight mb-0.5">All Clear</h3>
                                <p className="text-xs opacity-60">No active recommendations. Keep it up.</p>
                            </div>
                        )}

                        {/* Quick stats bar */}
                        <div className="flex items-center gap-3 mt-3 text-[10px] font-bold">
                            <span className="flex items-center gap-1" style={{ color: "var(--accent)" }}>
                                <Zap className="w-3 h-3" /> {todayPoints} pts today
                            </span>
                            <span className="flex items-center gap-1" style={{ color: "var(--success)" }}>
                                <TrendingUp className="w-3 h-3" /> {currentStreak} day streak
                            </span>
                            {tasksRemaining > 0 && (
                                <span className="flex items-center gap-1" style={{ color: "var(--danger)" }}>
                                    <AlertTriangle className="w-3 h-3" /> {tasksRemaining} tasks left
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expand control */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-30 hover:opacity-80 transition-opacity"
                    >
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* ── Expanded suggestion list ── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-theme-border/30 pt-3 space-y-2">
                            <p className="text-[9px] font-bold opacity-30 tracking-widest uppercase mb-2">All Suggestions</p>
                            {suggestions.length === 0 ? (
                                <p className="text-xs opacity-40">No suggestions right now.</p>
                            ) : (
                                suggestions.map(s => (
                                    <div
                                        key={s.id}
                                        className="flex items-start gap-2 p-2.5 rounded-xl text-xs"
                                        style={{ background: `${statusColor}08`, border: `1px solid ${statusColor}15` }}
                                    >
                                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: statusColor }} />
                                        <div>
                                            <span className="font-bold text-theme-text">{s.headline}</span>
                                            <span className="opacity-50 ml-1">{s.description}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
