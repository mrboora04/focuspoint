"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ChallengeHeaderProps {
    missionConfig?: {
        name: string;
        duration: number;
        startDate: string;
    } | null;
}

export default function ChallengeHeader({ missionConfig }: ChallengeHeaderProps) {
    const [timeLeft, setTimeLeft] = useState("");
    const [currentDay, setCurrentDay] = useState(1);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!missionConfig) return;

        const updateTime = () => {
            const now = new Date();
            const start = new Date(missionConfig.startDate);

            // 1. Calculate "Day X"
            const diffTime = Math.abs(now.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setCurrentDay(diffDays > 0 ? diffDays : 1);

            // 2. Calculate "Time Remaining" in this day (until midnight)
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);
            const msLeft = tomorrow.getTime() - now.getTime();

            const h = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
            const m = Math.floor((msLeft / (1000 * 60)) % 60);
            const s = Math.floor((msLeft / 1000) % 60);

            setTimeLeft(
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            );
        };

        updateTime(); // Initial call
        const timer = setInterval(updateTime, 1000);

        return () => clearInterval(timer);
    }, [missionConfig]);

    if (!isMounted) return null;

    if (!missionConfig) {
        return (
            <div className="w-full bg-[#EFE0C8]/40 backdrop-blur-xl border-b border-[#252525]/5 p-8 flex flex-col items-center">
                <h1 className="text-3xl font-bold text-[#252525] opacity-50 uppercase">No Active Mission</h1>
                <p className="text-sm text-[#252525]/40 mt-2">Select or create a mission to start.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#EFE0C8]/40 backdrop-blur-xl border-b border-[#252525]/5 p-8 flex flex-col items-center relative transition-all duration-500">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="text-xs font-bold tracking-[0.2em] text-[#F78320] mb-2 uppercase opacity-80">
                    {missionConfig.name}
                </div>
                <h1
                    className="text-5xl font-extrabold tracking-tight text-[#252525] uppercase"
                    style={{ textShadow: "0 0 20px rgba(247, 131, 32, 0.2)" }}
                >
                    Day <span className="text-[#F78320]">{currentDay}</span> of {missionConfig.duration}
                </h1>

                <h2 className="mt-2 text-sm font-mono tracking-widest text-[#252525]/60 uppercase">
                    Mission Ends: <span className="text-[#F78320]">{timeLeft}</span>
                </h2>
            </motion.div>
        </div>
    );
}