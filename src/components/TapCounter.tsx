"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { X, Trophy, Timer, Zap, RotateCcw } from "lucide-react";
import Confetti from "canvas-confetti";
import { THEMES, ICONS } from "./TapTargetConfig";

interface TapCounterProps {
    target: number;
    title: string;
    theme?: string;
    icon?: string;
    onClose: () => void;
    onComplete: (stats: any) => void;
}

export default function TapCounter({ target, title, theme = "ember", icon = "target", onClose, onComplete }: TapCounterProps) {
    const [count, setCount] = useState(0);
    const [startTime] = useState(Date.now());
    const [lastTapTime, setLastTapTime] = useState(Date.now());
    const [cooldown, setCooldown] = useState(false);
    const [gaps, setGaps] = useState<number[]>([]);

    // Animation controls
    const controls = useAnimation();
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Cooldown duration (ms) - to prevent accidental double taps
    const COOLDOWN_MS = 300;

    // Resolve Theme & Icon
    const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];
    const ActiveIcon = ICONS.find(i => i.id === icon)?.icon || Zap;

    // Calculate progress
    const progress = Math.min((count / target) * 100, 100);

    const handleTap = () => {
        if (cooldown || count >= target) return;

        const now = Date.now();
        const timeSinceLast = now - lastTapTime;

        // Record gap for "forgetfulness" score
        if (count > 0) { // Don't count gap before first tap
            setGaps(prev => [...prev, timeSinceLast]);
        }

        setLastTapTime(now);
        setCount(prev => prev + 1);
        setCooldown(true);

        // Haptic Feedback (Light tick)
        if (navigator.vibrate) navigator.vibrate(15);

        // Animation: Pulse
        controls.start({
            scale: [1, 0.95, 1.05, 1],
            transition: { duration: 0.1 }
        });

        // Reset cooldown
        setTimeout(() => setCooldown(false), COOLDOWN_MS);

        // Check Completion
        if (count + 1 >= target) {
            handleComplete(now);
        }
    };

    const handleComplete = (endTime: number) => {
        // Haptic Feedback (Success)
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

        Confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: [activeTheme.color, '#ffffff']
        });

        const totalTime = endTime - startTime;
        const avgGap = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
        // Forgetfulness: Standard deviation of gaps or just avg gap? 
        // Let's use avg gap as a simple metric for now. (Lower is better flow)

        // Delay slightly for effect
        setTimeout(() => {
            onComplete({
                totalTime,
                totalTaps: target,
                avgGap
            });
        }, 1500);
    };

    // Format stats helper
    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        return `${m}m ${s % 60}s`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] bg-theme-bg flex flex-col items-center justify-center p-6 overflow-hidden"
        >
            {/* Background Particles/Effect */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--theme-color)] to-transparent transition-all duration-500`}
                    style={{
                        '--theme-color': activeTheme.color,
                        transform: `scale(${0.5 + (progress / 100)}) translate(-50%, -50%)`
                    } as any} />
            </div>

            {/* Header */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center">
                <button onClick={onClose} className="p-3 bg-theme-card rounded-full text-theme-text/50 hover:text-theme-text">
                    <X className="w-6 h-6" />
                </button>
                <div className="text-right">
                    <h2 className="font-black text-theme-text uppercase tracking-widest text-sm">{title}</h2>
                    <p className="text-xs font-bold" style={{ color: activeTheme.color }}>{Math.round(progress)}% COMPLETE</p>
                </div>
            </div>

            {/* Main Interactive Circle */}
            <div className="relative z-10 flex flex-col items-center gap-12">
                <div className="relative">
                    {/* Ring SVG */}
                    <svg className="w-72 h-72 -rotate-90 transform">
                        <circle
                            cx="144"
                            cy="144"
                            r="130"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-theme-card"
                        />
                        <motion.circle
                            cx="144"
                            cy="144"
                            r="130"
                            stroke={activeTheme.color}
                            strokeWidth="12"
                            fill="transparent"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progress / 100 }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        />
                    </svg>

                    {/* TAP BUTTON */}
                    <motion.button
                        ref={buttonRef}
                        animate={controls}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={handleTap}
                        className={`absolute inset-4 rounded-full bg-gradient-to-br from-[#EFE0C8] to-[#E6D5B8] shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center border-4 border-white/20 transition-all ${cooldown ? "cursor-not-allowed opacity-90 grayscale" : "cursor-pointer"
                            }`}
                        disabled={count >= target}
                    >
                        <ActiveIcon className="w-12 h-12 mb-2 opacity-20" style={{ color: activeTheme.color }} />
                        <span className="text-6xl font-black text-[#252525] tabular-nums leading-none">{count}</span>
                        <span className="text-xs font-bold text-[#252525]/40 uppercase tracking-widest mt-1">Tap</span>
                    </motion.button>
                </div>

                {/* Sub-stats */}
                <div className="grid grid-cols-2 gap-8 text-center opacity-60">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-theme-text mb-1">Target</p>
                        <p className="text-2xl font-black text-theme-text">{target}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-theme-text mb-1">Remaining</p>
                        <p className="text-2xl font-black text-theme-text">{Math.max(0, target - count)}</p>
                    </div>
                </div>
            </div>

            {/* Completion Modal handled by parent or overlay? 
                Let's do a simple overlay here if complete.
            */}
        </motion.div>
    );
}
