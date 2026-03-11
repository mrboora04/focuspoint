"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Flame, ChevronDown, ChevronUp, Calendar, TrendingUp, Target } from "lucide-react";
import { useFocus } from "@/context/FocusContext";

// Philosophical quotes tied to user state
function getInsight(opts: {
    streakDays: number;
    tasksCompleted: number;
    tasksRemaining: number;
    calendarEventCount: number;
    hasActiveMission: boolean;
}): { headline: string; body: string; verse: string } {
    const { streakDays, tasksCompleted, tasksRemaining, calendarEventCount, hasActiveMission } = opts;

    if (!hasActiveMission) {
        return {
            headline: "The path begins with a single step.",
            body: "You have no active protocol. Every discipline starts with a decision. Set your mission before the day slips away.",
            verse: "— Marcus Aurelius"
        };
    }

    if (streakDays >= 7) {
        return {
            headline: `${streakDays} days without surrender.`,
            body: "Consistency is not a feeling — it is a commitment. You are building the kind of character that most people only admire from a distance.",
            verse: "— Seneca"
        };
    }

    if (tasksCompleted === 0 && tasksRemaining > 0) {
        return {
            headline: "Today's work waits for no one.",
            body: `${tasksRemaining} task${tasksRemaining > 1 ? "s" : ""} remain untouched. The warrior who delays his duty loses not just time, but momentum. Begin now.`,
            verse: "— Epictetus"
        };
    }

    if (tasksRemaining === 0 && tasksCompleted > 0) {
        return {
            headline: "Today's duty: fulfilled.",
            body: `All ${tasksCompleted} task${tasksCompleted > 1 ? "s" : ""} completed. Rest with purpose — tomorrow demands the same resolve. You have earned tonight.`,
            verse: "— Marcus Aurelius"
        };
    }

    if (calendarEventCount > 0) {
        return {
            headline: "Your schedule speaks before you do.",
            body: `${calendarEventCount} calendar event${calendarEventCount > 1 ? "s" : ""} today. Honor each block as if it were a promise to your future self.`,
            verse: "— Stoic Principle"
        };
    }

    if (tasksCompleted > 0) {
        return {
            headline: "Progress is proof of intent.",
            body: `${tasksCompleted} done, ${tasksRemaining} to go. The soldier does not stop when tired. He stops when done.`,
            verse: "— Jocko Willink"
        };
    }

    return {
        headline: "Discipline is choosing the harder path.",
        body: "Each task you complete is a vote for the version of yourself you are trying to become. Cast that vote today.",
        verse: "— James Clear"
    };
}

export default function NexusAgent() {
    const { state } = useFocus();
    const [expanded, setExpanded] = useState(false);

    const todayStr = new Date().toISOString().split("T")[0];

    const tasksCompleted = useMemo(() =>
        Object.values(state.missions).reduce((sum, m) =>
            sum + m.tasks.filter(t => t.status === "completed").length, 0),
        [state.missions]);

    const tasksRemaining = useMemo(() =>
        Object.values(state.missions).reduce((sum, m) =>
            sum + m.tasks.filter(t => t.status === "pending").length, 0),
        [state.missions]);

    const streakDays = state.userProfile?.current_streak ?? 0;
    const calendarEventCount = state.calendarEvents.length;
    const hasActiveMission = Object.keys(state.missions).length > 0;

    const todayPoints = useMemo(() =>
        Object.values(state.missions).reduce((sum, m) =>
            m.scoreDate === todayStr ? sum + m.todayScore : sum, 0),
        [state.missions, todayStr]);

    const insight = useMemo(() =>
        getInsight({ streakDays, tasksCompleted, tasksRemaining, calendarEventCount, hasActiveMission }),
        [streakDays, tasksCompleted, tasksRemaining, calendarEventCount, hasActiveMission]);

    const accentColor = tasksRemaining === 0 && tasksCompleted > 0
        ? "var(--success)"
        : tasksCompleted > 0
            ? "var(--accent)"
            : "var(--danger)";

    return (
        <motion.div
            layout
            className="bg-theme-card rounded-2xl md:rounded-3xl border border-theme-border shadow-sm overflow-hidden"
            style={{ borderTop: `2px solid ${accentColor}` }}
        >
            <div className="p-4 md:p-5">
                {/* Quote / Insight */}
                <p className="text-[10px] font-black tracking-widest uppercase opacity-40 mb-2">
                    Today&apos;s Mindset
                </p>
                <h3 className="text-base md:text-lg font-black text-theme-text leading-snug mb-1">
                    {insight.headline}
                </h3>
                <p className="text-xs md:text-sm text-theme-text opacity-60 leading-relaxed mb-2">
                    {insight.body}
                </p>
                <p className="text-[10px] opacity-30 italic">{insight.verse}</p>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-theme-border/30">
                    <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                        <Flame className="w-3 h-3" fill="currentColor" /> {streakDays}d streak
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                        <TrendingUp className="w-3 h-3" /> {todayPoints} pts
                    </span>
                    {calendarEventCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400">
                            <Calendar className="w-3 h-3" /> {calendarEventCount} events
                        </span>
                    )}
                    {tasksRemaining > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "var(--danger)" }}>
                            <Target className="w-3 h-3" /> {tasksRemaining} left
                        </span>
                    )}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center opacity-30 hover:opacity-80 transition-opacity"
                    >
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Expanded: activity breakdown */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-theme-border/30"
                    >
                        <div className="px-4 pb-4 pt-3 space-y-2">
                            <p className="text-[9px] font-bold opacity-30 tracking-widest uppercase mb-2">Today&apos;s Activity</p>
                            {Object.values(state.missions).map(m => {
                                const done = m.tasks.filter(t => t.status === "completed").length;
                                const total = m.tasks.length;
                                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                return (
                                    <div key={m.id} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-theme-text opacity-60">
                                            <span>{m.config.name}</span>
                                            <span>{done}/{total} tasks</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-theme-border/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${pct}%`, background: "var(--accent)" }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(state.missions).length === 0 && (
                                <p className="text-xs opacity-40">No missions active yet.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
