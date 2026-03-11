"use client";

/**
 * IntelligentAgent — embedded, non-chat AI assistant
 * Analyzes all app activity (missions, taps, streaks, schedule, events)
 * and surfaces context-aware insights, predictions, and nudges in real time.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, TrendingDown, Zap, AlertTriangle,
    CheckCircle2, Flame, Clock, Target, ChevronRight,
    Lightbulb, BarChart2, Award
} from "lucide-react";
import { useFocus } from "@/context/FocusContext";

// ─── Insight engine ──────────────────────────────────────────────────────────

type InsightLevel = "critical" | "warning" | "positive" | "info";

interface Insight {
    id: string;
    level: InsightLevel;
    icon: React.ElementType;
    title: string;
    body: string;
    action?: { label: string; mode: "mission" | "tap" | "schedule_agent" };
}

function analyzeState(
    missions: ReturnType<typeof useFocus>["state"]["missions"],
    tapTargets: ReturnType<typeof useFocus>["state"]["tapTargets"],
    recentEvents: any[],
    streak: number
): Insight[] {
    const insights: Insight[] = [];
    const now = new Date();
    const hour = now.getHours();
    const todayStr = now.toISOString().split("T")[0];

    // ── Mission analysis ──
    const activeMissions = Object.values(missions);
    const totalTasks = activeMissions.reduce((s, m) => s + m.tasks.length, 0);
    const doneTasks = activeMissions.reduce((s, m) => s + m.tasks.filter(t => t.status === "completed").length, 0);
    const pendingTasks = totalTasks - doneTasks;
    const completionRate = totalTasks > 0 ? doneTasks / totalTasks : 0;

    // Critical: missions with missed days
    activeMissions.forEach(m => {
        const history = Object.entries(m.history || {});
        const failedDays = history.filter(([, v]) => v === "failed").length;
        if (failedDays > 2) {
            insights.push({
                id: `mission_failing_${m.id}`,
                level: "critical",
                icon: AlertTriangle,
                title: `"${m.config.name}" is slipping`,
                body: `${failedDays} missed days detected. Adjust your schedule or reduce daily targets to rebuild momentum.`,
                action: { label: "View Mission", mode: "mission" }
            });
        }
    });

    // Positive: streak milestone
    if (streak >= 7 && streak % 7 === 0) {
        insights.push({
            id: `streak_milestone_${streak}`,
            level: "positive",
            icon: Award,
            title: `${streak}-day streak! Elite discipline.`,
            body: "You're in the top tier of consistency. Keep pushing — the compound effect is working in your favor.",
        });
    } else if (streak >= 3) {
        insights.push({
            id: "streak_building",
            level: "positive",
            icon: Flame,
            title: `${streak} days strong`,
            body: "Your streak is building. Don't break the chain — one more day compounds everything you've built.",
        });
    }

    // Warning: half the day gone, nothing done
    if (hour >= 13 && doneTasks === 0 && pendingTasks > 0) {
        insights.push({
            id: "afternoon_idle",
            level: "warning",
            icon: Clock,
            title: "Afternoon alert",
            body: `It's past noon and ${pendingTasks} task${pendingTasks > 1 ? "s remain" : " remains"} untouched. The window is narrowing — start with the hardest task first.`,
        });
    }

    // Positive: strong morning momentum
    if (hour < 12 && completionRate > 0.5 && doneTasks > 0) {
        insights.push({
            id: "morning_momentum",
            level: "positive",
            icon: TrendingUp,
            title: "Strong morning output",
            body: `${doneTasks} tasks done before noon. You're front-loading your day — this is the pattern of high performers.`,
        });
    }

    // Info: all tasks done
    if (pendingTasks === 0 && doneTasks > 0) {
        insights.push({
            id: "all_done",
            level: "positive",
            icon: CheckCircle2,
            title: "Mission complete for today",
            body: `All ${doneTasks} tasks cleared. Protect your focus for tomorrow — rest with intent.`,
        });
    }

    // ── Tap target analysis ──
    const targets = Object.values(tapTargets);
    const nearComplete = targets.filter(t => t.count > 0 && t.count / t.target > 0.75 && t.count < t.target);
    const stale = targets.filter(t => t.count === 0 && t.target > 0);

    nearComplete.forEach(t => {
        insights.push({
            id: `tap_near_${t.id}`,
            level: "info",
            icon: Zap,
            title: `"${t.title}" is 75%+ done`,
            body: `Only ${t.target - t.count} more taps to complete "${t.title}". Finish it now while the momentum is there.`,
            action: { label: "Tap Now", mode: "tap" }
        });
    });

    if (stale.length > 0) {
        insights.push({
            id: "stale_targets",
            level: "warning",
            icon: Target,
            title: `${stale.length} target${stale.length > 1 ? "s" : ""} haven't started`,
            body: `"${stale[0].title}"${stale.length > 1 ? ` and ${stale.length - 1} more` : ""} at 0 progress. Start with just one tap — momentum is built one rep at a time.`,
        });
    }

    // ── Time-of-day nudge ──
    if (hour >= 21 && pendingTasks > 0) {
        insights.push({
            id: "evening_warning",
            level: "warning",
            icon: TrendingDown,
            title: "Evening wrap-up needed",
            body: `${pendingTasks} task${pendingTasks > 1 ? "s" : ""} still open. Decide now: close them or schedule them for tomorrow. Never leave your day unresolved.`,
        });
    }

    // ── Tap target pattern analysis ──
    if (targets.length > 0) {
        // Calculate velocity: taps done vs how much time has passed today
        const hoursIntoDayFraction = hour / 24;
        targets.forEach(t => {
            if (t.count === 0 || t.target === 0) return;
            const pct = t.count / t.target;
            const expectedByNow = hoursIntoDayFraction;

            // User is ahead of the daily curve — reinforce it
            if (pct > expectedByNow + 0.3 && pct < 1) {
                insights.push({
                    id: `tap_velocity_high_${t.id}`,
                    level: "positive",
                    icon: TrendingUp,
                    title: `"${t.title}" pacing ahead`,
                    body: `${Math.round(pct * 100)}% done — you're moving faster than expected for this time of day. Finish it before the energy dips.`,
                    action: { label: "Continue", mode: "tap" }
                });
            }

            // User is behind — falling off pace
            if (pct < expectedByNow - 0.4 && hour > 14) {
                insights.push({
                    id: `tap_velocity_low_${t.id}`,
                    level: "warning",
                    icon: TrendingDown,
                    title: `"${t.title}" falling behind`,
                    body: `Only ${Math.round(pct * 100)}% done at this hour. ${t.target - t.count} reps remain — a short burst now keeps the streak alive.`,
                    action: { label: "Catch Up", mode: "tap" }
                });
            }
        });

        // Overall tap target completion rate
        const completedTargets = targets.filter(t => t.count >= t.target).length;
        const totalTargets = targets.length;
        if (completedTargets > 0 && completedTargets === totalTargets) {
            insights.push({
                id: "all_targets_done",
                level: "positive",
                icon: CheckCircle2,
                title: "All tap targets cleared",
                body: `Every target done — ${completedTargets} completed. Your physical discipline is matching your mental discipline.`,
            });
        }
    }

    // ── Recent activity patterns ──
    const todayEvents = recentEvents.filter(e =>
        e.created_at && e.created_at.startsWith(todayStr)
    );

    if (todayEvents.length === 0 && activeMissions.length > 0) {
        insights.push({
            id: "no_activity_today",
            level: "warning",
            icon: BarChart2,
            title: "No activity logged today",
            body: "Your tracker shows zero actions so far. Every hour that passes is a decision — choose to act.",
        });
    }

    // Default insight if nothing else applies
    if (insights.length === 0) {
        insights.push({
            id: "default_philosophy",
            level: "info",
            icon: Lightbulb,
            title: "Build your protocol",
            body: activeMissions.length === 0
                ? "No active missions. Set a mission to unlock your daily intelligence feed."
                : "Steady state. Your protocol is running — keep showing up.",
        });
    }

    // Priority sort: critical → warning → positive → info
    const order: Record<InsightLevel, number> = { critical: 0, warning: 1, positive: 2, info: 3 };
    return insights.sort((a, b) => order[a.level] - order[b.level]).slice(0, 4);
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<InsightLevel, { color: string; bg: string; border: string; dot: string }> = {
    critical: {
        color: "var(--danger, #EF4444)",
        bg: "rgba(239,68,68,0.06)",
        border: "rgba(239,68,68,0.15)",
        dot: "#EF4444"
    },
    warning: {
        color: "#F59E0B",
        bg: "rgba(245,158,11,0.06)",
        border: "rgba(245,158,11,0.15)",
        dot: "#F59E0B"
    },
    positive: {
        color: "#10B981",
        bg: "rgba(16,185,129,0.06)",
        border: "rgba(16,185,129,0.15)",
        dot: "#10B981"
    },
    info: {
        color: "var(--accent, #F78320)",
        bg: "rgba(247,131,32,0.06)",
        border: "rgba(247,131,32,0.12)",
        dot: "var(--accent, #F78320)"
    }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntelligentAgent() {
    const { state, recentEvents, setViewMode, setActiveMissionId, activeMission } = useFocus();
    const [activeIdx, setActiveIdx] = useState(0);

    const streak = state.userProfile?.current_streak ?? 0;

    const insights = useMemo(() =>
        analyzeState(state.missions, state.tapTargets, recentEvents, streak),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [state.missions, state.tapTargets, recentEvents, streak]
    );

    const current = insights[activeIdx] ?? insights[0];
    if (!current) return null;

    const cfg = LEVEL_CONFIG[current.level];
    const Icon = current.icon;

    const handleAction = () => {
        if (!current.action) return;
        if (current.action.mode === "mission") {
            if (activeMission) setViewMode("mission");
        } else if (current.action.mode === "tap") {
            setViewMode("tap");
        } else {
            setViewMode(current.action.mode as any);
        }
    };

    return (
        <div className="bg-theme-card rounded-2xl border border-theme-border overflow-hidden"
            style={{ borderTop: `2px solid ${cfg.dot}` }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.dot }} />
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-40">Intelligence Feed</span>
                </div>
                {/* Dot pagination */}
                <div className="flex items-center gap-1.5">
                    {insights.map((ins, i) => {
                        const c = LEVEL_CONFIG[ins.level];
                        return (
                            <button
                                key={ins.id}
                                onClick={() => setActiveIdx(i)}
                                className="w-1.5 h-1.5 rounded-full transition-all"
                                style={{
                                    background: i === activeIdx ? c.dot : 'rgba(255,255,255,0.15)',
                                    transform: i === activeIdx ? 'scale(1.4)' : 'scale(1)'
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Insight card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-4"
                >
                    <div
                        className="rounded-xl p-4"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: `${cfg.dot}18` }}
                            >
                                <Icon className="w-4.5 h-4.5" style={{ color: cfg.dot, width: 18, height: 18 }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-theme-text leading-snug mb-1">
                                    {current.title}
                                </p>
                                <p className="text-xs text-theme-text/55 leading-relaxed">
                                    {current.body}
                                </p>
                                {current.action && (
                                    <button
                                        onClick={handleAction}
                                        className="mt-2.5 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider transition-opacity hover:opacity-70"
                                        style={{ color: cfg.dot }}
                                    >
                                        {current.action.label}
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Swipe hint if multiple insights */}
                    {insights.length > 1 && (
                        <div className="flex items-center justify-between mt-2 px-1">
                            <button
                                onClick={() => setActiveIdx(i => (i - 1 + insights.length) % insights.length)}
                                className="text-[10px] font-bold text-theme-text/20 hover:text-theme-text/50 transition-colors"
                            >
                                ← prev
                            </button>
                            <span className="text-[10px] text-theme-text/20">{activeIdx + 1} / {insights.length}</span>
                            <button
                                onClick={() => setActiveIdx(i => (i + 1) % insights.length)}
                                className="text-[10px] font-bold text-theme-text/20 hover:text-theme-text/50 transition-colors"
                            >
                                next →
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
