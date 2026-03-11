"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { X, CheckCircle2, Zap } from "lucide-react";
import Confetti from "canvas-confetti";
import { THEMES, ICONS } from "./TapTargetConfig";

interface TapCounterProps {
    target: number;
    initialCount?: number; // Current saved count — resume from here
    title: string;
    theme?: string;
    icon?: string;
    onClose: () => void;
    onComplete: (stats: { totalTaps: number; totalTime: number; avgGap: number }) => void;
    onProgress?: (count: number) => void; // Called periodically to save progress
}

const SAVE_EVERY = 5; // Save to DB every N taps
const COOLDOWN_MS = 250;

export default function TapCounter({
    target,
    initialCount = 0,
    title,
    theme = "ember",
    icon = "target",
    onClose,
    onComplete,
    onProgress
}: TapCounterProps) {
    const [count, setCount] = useState(initialCount);
    const [sessionTaps, setSessionTaps] = useState(0); // Taps done THIS session
    const [startTime] = useState(Date.now());
    const [lastTapTime, setLastTapTime] = useState(Date.now());
    const [cooldown, setCooldown] = useState(false);
    const [isCompleted, setIsCompleted] = useState(initialCount >= target);
    const gaps = useRef<number[]>([]);
    const countRef = useRef(initialCount);

    const controls = useAnimation();

    const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];
    const ActiveIcon = ICONS.find(i => i.id === icon)?.icon || Zap;
    const progress = Math.min((count / target) * 100, 100);

    // Sync countRef so onClose handler gets fresh value
    useEffect(() => { countRef.current = count; }, [count]);

    // Auto-save progress every SAVE_EVERY taps
    useEffect(() => {
        if (sessionTaps > 0 && sessionTaps % SAVE_EVERY === 0 && onProgress) {
            onProgress(countRef.current);
        }
    }, [sessionTaps, onProgress]);

    // Save progress on unmount if not completed
    useEffect(() => {
        return () => {
            if (!isCompleted && onProgress && countRef.current > initialCount) {
                onProgress(countRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTap = useCallback(() => {
        if (cooldown || count >= target) return;

        const now = Date.now();
        const timeSinceLast = now - lastTapTime;
        if (sessionTaps > 0) gaps.current.push(timeSinceLast);

        setLastTapTime(now);
        setCount(prev => prev + 1);
        setSessionTaps(prev => prev + 1);
        setCooldown(true);

        if (navigator.vibrate) navigator.vibrate(12);

        controls.start({
            scale: [1, 0.94, 1.06, 1],
            transition: { duration: 0.12 }
        });

        setTimeout(() => setCooldown(false), COOLDOWN_MS);

        if (count + 1 >= target) {
            handleComplete(now, count + 1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cooldown, count, target, lastTapTime, sessionTaps]);

    const handleComplete = (endTime: number, finalCount: number) => {
        setIsCompleted(true);
        if (navigator.vibrate) navigator.vibrate([60, 40, 80]);

        Confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
            colors: [activeTheme.color, '#ffffff', '#EFE0C8']
        });

        const totalTime = endTime - startTime;
        const avgGap = gaps.current.length > 0
            ? gaps.current.reduce((a, b) => a + b, 0) / gaps.current.length
            : 0;

        setTimeout(() => {
            onComplete({ totalTaps: finalCount, totalTime, avgGap });
        }, 1800);
    };

    const handleClose = () => {
        // Save progress before closing
        if (!isCompleted && onProgress && countRef.current > initialCount) {
            onProgress(countRef.current);
        }
        onClose();
    };

    const remaining = Math.max(0, target - count);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${activeTheme.color}08 0%, #1E1A17 50%, ${activeTheme.color}05 100%)` }}
        >
            {/* Ambient glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${activeTheme.color}${Math.round(progress * 0.2).toString(16).padStart(2, '0')} 0%, transparent 70%)`
                }}
            />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-5">
                <button
                    onClick={handleClose}
                    className="w-10 h-10 bg-white/8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Session</p>
                    <h2 className="font-black text-white text-sm uppercase tracking-wider">{title}</h2>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Progress</p>
                    <p className="text-sm font-black" style={{ color: activeTheme.color }}>{Math.round(progress)}%</p>
                </div>
            </div>

            {/* Main tap area */}
            <div className="relative z-10 flex flex-col items-center gap-10">

                {/* Ring + button */}
                <div className="relative">
                    <svg className="w-72 h-72 -rotate-90">
                        <circle cx="144" cy="144" r="128" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="transparent" />
                        <motion.circle
                            cx="144" cy="144" r="128"
                            stroke={activeTheme.color}
                            strokeWidth="6"
                            fill="transparent"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 128}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 128 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 128 * (1 - progress / 100) }}
                            transition={{ type: "spring", stiffness: 80, damping: 20 }}
                        />
                    </svg>

                    <motion.button
                        animate={controls}
                        whileTap={{ scale: 0.92 }}
                        onClick={handleTap}
                        disabled={count >= target || !!cooldown}
                        className="absolute inset-4 rounded-full flex flex-col items-center justify-center cursor-pointer select-none border border-white/8 transition-all"
                        style={{
                            background: isCompleted
                                ? `linear-gradient(135deg, ${activeTheme.color}40, ${activeTheme.color}20)`
                                : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                            backdropFilter: 'blur(20px)',
                            boxShadow: count > initialCount ? `0 0 60px ${activeTheme.color}25, inset 0 1px 0 rgba(255,255,255,0.1)` : 'inset 0 1px 0 rgba(255,255,255,0.08)'
                        }}
                    >
                        {isCompleted ? (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <CheckCircle2 className="w-14 h-14" style={{ color: activeTheme.color }} />
                                <span className="text-xs font-black tracking-widest uppercase text-white/60">Complete!</span>
                            </motion.div>
                        ) : (
                            <>
                                <ActiveIcon className="w-8 h-8 mb-2" style={{ color: `${activeTheme.color}60` }} />
                                <span
                                    className="text-7xl font-black tabular-nums leading-none"
                                    style={{ color: count > initialCount ? activeTheme.color : 'rgba(255,255,255,0.9)' }}
                                >
                                    {count}
                                </span>
                                {!cooldown && (
                                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/20 mt-1">TAP</span>
                                )}
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-10 text-center">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-0.5">Goal</p>
                        <p className="text-2xl font-black text-white/60">{target}</p>
                    </div>
                    <div
                        className="w-px h-10 opacity-20"
                        style={{ background: activeTheme.color }}
                    />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-0.5">Left</p>
                        <p className="text-2xl font-black" style={{ color: remaining === 0 ? activeTheme.color : 'rgba(255,255,255,0.6)' }}>
                            {remaining}
                        </p>
                    </div>
                    <div
                        className="w-px h-10 opacity-20"
                        style={{ background: activeTheme.color }}
                    />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-0.5">Session</p>
                        <p className="text-2xl font-black text-white/60">+{sessionTaps}</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-64">
                    <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: activeTheme.color }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
