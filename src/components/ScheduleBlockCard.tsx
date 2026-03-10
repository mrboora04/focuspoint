"use client";

import { motion } from "framer-motion";
import type { ScheduleBlock, TriKalaPeriod } from "@/types/schedule";

const TYPE_ICONS: Record<string, string> = {
    wake_routine: "🌅",
    meal:         "🍽️",
    study:        "📚",
    work:         "💼",
    commute:      "🚌",
    free:         "🎯",
    wind_down:    "🌙",
    sleep:        "💤",
};

const PERIOD_BAR: Record<TriKalaPeriod, string> = {
    brahma:   "period-brahma-bar",
    karma:    "period-karma-bar",
    vishrama: "period-vishrama-bar",
};

interface Props {
    block: ScheduleBlock;
    isNow?: boolean;
    index: number;
}

export default function ScheduleBlockCard({ block, isNow, index }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            id={`block-${block.id}`}
            className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                isNow
                    ? "border-[var(--accent)] bg-theme-card"
                    : "border-theme-border bg-theme-card opacity-80 hover:opacity-100"
            }`}
            style={
                isNow
                    ? { boxShadow: "0 0 16px rgba(var(--accent-rgb, 247,131,32), 0.2)" }
                    : {}
            }
        >
            {/* Period bar */}
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${PERIOD_BAR[block.period]}`} />

            {/* NOW pulse */}
            {isNow && (
                <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider text-white now-indicator"
                    style={{ background: "var(--accent)" }}>
                    ▶ NOW
                </div>
            )}

            <div className="pl-3 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{TYPE_ICONS[block.type] ?? "⬜"}</span>
                        <span className="font-bold text-sm text-theme-text">{block.label}</span>
                    </div>
                    <span className="text-xs font-mono opacity-40 flex-shrink-0">{block.durationMins}m</span>
                </div>
                <div className="text-xs font-mono opacity-40 mt-1">
                    {block.startTime} → {block.endTime}
                </div>
            </div>
        </motion.div>
    );
}
