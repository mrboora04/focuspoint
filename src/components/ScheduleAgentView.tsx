"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Clock, CheckCircle2, ChevronRight, Shield, Calendar } from "lucide-react";
import { useFocus } from "@/context/FocusContext";
import { generateLocalSuggestions, type NexusSuggestion } from "@/lib/nexusEngine";
import { generateDailySchedule, findCurrentBlock, currentTimeHHMM } from "@/lib/scheduleEngine";
import CalendarImport from "@/components/CalendarImport";

const PRIORITY_COLORS: Record<NexusSuggestion["priority"], string> = {
    high:   "rgba(239,68,68,1)",
    medium: "rgba(0,245,255,1)",
    low:    "rgba(100,200,100,1)",
};

const TYPE_ICONS: Record<NexusSuggestion["type"], string> = {
    schedule: "⏱",
    mission:  "🎯",
    health:   "💚",
    insight:  "💡",
};

export default function ScheduleAgentView({ onClose }: { onClose: () => void }) {
    const { scheduleProfile, state } = useFocus();

    const today = new Date().toISOString().split("T")[0];
    const liveSchedule = useMemo(() => {
        if (!scheduleProfile) return null;
        return generateDailySchedule(scheduleProfile, Object.keys(state.missions), today);
    }, [scheduleProfile, state.missions, today]);

    const currentBlock = liveSchedule ? findCurrentBlock(liveSchedule.blocks) : null;

    const allSuggestions = useMemo(() =>
        generateLocalSuggestions(state, liveSchedule),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [state.activeMissionId, liveSchedule]
    );

    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [accepted, setAccepted] = useState<Set<string>>(new Set());
    const [showCalendar, setShowCalendar] = useState(false);
    const [now] = useState(currentTimeHHMM());

    const visible = allSuggestions.filter(s => !dismissed.has(s.id) && !accepted.has(s.id));
    const doneCount = dismissed.size + accepted.size;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "linear-gradient(135deg, #070B14 0%, #0A0F1E 100%)" }}
        >
            {/* Scanline overlay */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.012) 2px, rgba(0,245,255,0.012) 4px)",
                }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"
                        style={{ boxShadow: "0 0 12px rgba(0,245,255,0.3)" }}>
                        <Bot className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-xs text-cyan-400/60 tracking-widest uppercase">Local AI</p>
                        <h2 className="text-white font-black tracking-widest text-sm"
                            style={{ textShadow: "0 0 8px rgba(0,245,255,0.5)" }}>
                            NEXUS
                        </h2>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-cyan-400/70 text-xs tracking-wider">LOCAL · PRIVATE</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`p-2 rounded-xl text-xs font-bold tracking-wider flex items-center gap-1.5 transition-colors ${
                            showCalendar
                                ? "text-white bg-purple-500/20 border border-purple-500/40"
                                : "text-white/40 hover:text-white hover:bg-white/5 border border-white/10"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:block">CALENDAR</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex flex-1 overflow-hidden">
                {/* Schedule sidebar */}
                <div className="hidden md:flex flex-col w-56 border-r border-cyan-500/10 p-4 gap-1 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-cyan-400/60" />
                        <span className="text-xs text-cyan-400/60 tracking-widest uppercase">Today · {now}</span>
                    </div>
                    {liveSchedule ? liveSchedule.blocks.map((b) => {
                        const isNow = currentBlock?.id === b.id;
                        return (
                            <div
                                key={b.id}
                                className={`px-3 py-2 rounded-lg text-xs transition-all ${isNow
                                    ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                                    : b.isMandatory
                                        ? "bg-white/5 border border-white/10 text-white/80"
                                        : "text-white/40"
                                    }`}
                                style={isNow ? { boxShadow: "0 0 8px rgba(0,245,255,0.15)" } : {}}
                            >
                                <div className="font-mono text-[10px] opacity-60 mb-0.5">{b.startTime}–{b.endTime}</div>
                                <div className="font-medium">{b.label}</div>
                            </div>
                        );
                    }) : (
                        <p className="text-white/30 text-xs">No schedule set. Visit Schedule to configure.</p>
                    )}
                </div>

                {/* Main content area */}
                <div className="flex flex-col flex-1 overflow-hidden">

                    {/* Calendar import panel */}
                    <AnimatePresence>
                        {showCalendar && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-b border-cyan-500/10"
                            >
                                <div className="p-4">
                                    <CalendarImport />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Suggestion feed header */}
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-black tracking-wider text-sm">SUGGESTION FEED</h3>
                            <p className="text-white/30 text-xs mt-0.5">
                                {visible.length} active · {doneCount} handled
                            </p>
                        </div>
                        {doneCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-emerald-400/70">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {doneCount} done
                            </div>
                        )}
                    </div>

                    {/* Suggestion cards */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
                        <AnimatePresence>
                            {visible.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <Shield className="w-10 h-10 text-cyan-400/30 mb-3" />
                                    <p className="text-white/40 text-sm font-bold tracking-wide">ALL CLEAR</p>
                                    <p className="text-white/20 text-xs mt-1">No active suggestions. Solid work.</p>
                                </motion.div>
                            ) : (
                                visible.map((s, i) => {
                                    const color = PRIORITY_COLORS[s.priority];
                                    return (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                                            transition={{ delay: i * 0.06, duration: 0.2 }}
                                            className="rounded-2xl overflow-hidden"
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: `1px solid ${color}30`,
                                                boxShadow: `0 0 12px ${color}10`,
                                            }}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-base leading-none">{TYPE_ICONS[s.type]}</span>
                                                    <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
                                                        style={{ background: `${color}20`, color }}>
                                                        {s.priority}
                                                    </span>
                                                    <span className="text-[10px] text-white/30 tracking-wider uppercase">{s.type}</span>
                                                </div>

                                                <h4 className="text-white font-black text-sm mb-1">{s.headline}</h4>
                                                <p className="text-white/60 text-xs leading-relaxed">{s.description}</p>

                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => setAccepted(prev => new Set([...prev, s.id]))}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.03]"
                                                        style={{ background: `${color}30`, border: `1px solid ${color}50` }}
                                                    >
                                                        <ChevronRight className="w-3 h-3" />
                                                        {s.actionLabel ?? "Accept"}
                                                    </button>
                                                    <button
                                                        onClick={() => setDismissed(prev => new Set([...prev, s.id]))}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>

                        {accepted.size > 0 && (
                            <div className="pt-2">
                                <p className="text-[10px] text-white/20 tracking-widest uppercase px-1 mb-2">Accepted</p>
                                {allSuggestions.filter(s => accepted.has(s.id)).map(s => (
                                    <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1.5 opacity-40">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-white text-xs line-through">{s.headline}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-cyan-500/10">
                        <p className="text-center text-white/15 text-[10px] tracking-wider">
                            NEXUS · 100% Local · No API keys · No data sent anywhere
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
