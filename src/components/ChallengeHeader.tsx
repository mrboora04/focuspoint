"use client"; // This component needs interaction (useEffect)

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ChallengeHeader() {
    // CONFIG: We will eventually make this dynamic (stored in database/local storage)
    // For now, let's pretend the challenge started 3 days ago.
    const [startDate] = useState(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
    const totalDays = 75;

    const [timeLeft, setTimeLeft] = useState("");
    const [currentDay, setCurrentDay] = useState(1);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();

            // 1. Calculate "Day X"
            const diffTime = Math.abs(now.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setCurrentDay(diffDays);

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
        }, 1000);

        return () => clearInterval(timer);
    }, [startDate]);

    return (
        <div className="w-full bg-[#F8F4E9]/80 backdrop-blur-xl border-b border-[#252525]/5 p-8 flex flex-col items-center">
            <motion.h1
                className="text-5xl font-extrabold tracking-tight text-[#252525] uppercase"
                style={{ textShadow: "0 0 20px rgba(247, 131, 32, 0.3)" }}
            >
                Day <span className="text-[#F78320]">{currentDay}</span> of 75
            </motion.h1>

            <h2 className="mt-2 text-sm font-mono tracking-widest text-[#252525]/60 uppercase">
                Mission Ends: <span className="text-[#F78320]">{timeLeft}</span>
            </h2>
        </div>
    );
}