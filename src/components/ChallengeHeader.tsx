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

            const diffTime = Math.abs(now.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setCurrentDay(diffDays > 0 ? diffDays : 1);

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

        updateTime();
        const timer = setInterval(updateTime, 1000);

        return () => clearInterval(timer);
    }, [missionConfig]);

    if (!isMounted) return null;

    if (!missionConfig) {
        return (
            <div className="w-full bg-[#EFE0C8]/40 backdrop-blur-3xl border-b border-[#252525]/5 p-8 flex flex-col items-center rounded-[2rem]">
                <h1 className="text-3xl font-black text-[#252525] opacity-50 uppercase tracking-tight">No Active Mission</h1>
                <p className="text-sm font-medium text-[#252525]/40 mt-2">Select a mission to begin.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#EFE0C8]/40 backdrop-blur-3xl border border-white/40 p-10 flex flex-col items-center relative transition-all duration-500 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="text-xs font-bold tracking-[0.3em] text-[#F78320] mb-4 uppercase opacity-90">
                    {missionConfig.name}
                </div>
                <h1
                    className="text-7xl font-black tracking-tighter text-[#252525] uppercase leading-none drop-shadow-sm"
                >
                    Day <span className="text-[#F78320]">{currentDay}</span>
                    <span className="text-3xl ml-2 opacity-30 font-bold tracking-normal">/ {missionConfig.duration}</span>
                </h1>

                <h2 className="mt-4 text-sm font-bold tracking-widest text-[#252525]/50 uppercase bg-white/40 py-2 px-6 rounded-full inline-block">
                    Ends in <span className="text-[#F78320] tabular-nums">{timeLeft}</span>
                </h2>
            </motion.div>
        </div>
    );
}