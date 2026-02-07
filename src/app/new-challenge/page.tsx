"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Calendar, Target, ArrowRight } from "lucide-react";

export default function NewChallenge() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [duration, setDuration] = useState(75);
    const [dailyTarget, setDailyTarget] = useState(50);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Load Existing State
        const savedState = localStorage.getItem("focuspoint-state");
        const state = savedState ? JSON.parse(savedState) : { activeMissionId: null, missions: {} };

        // 2. Create New Mission Object
        const missionId = "mission_" + Date.now();
        const newMission = {
            id: missionId,
            config: {
                name,
                duration,
                dailyTarget,
                startDate: new Date().toISOString(),
            },
            tasks: [],
            history: {},
            dailyLog: {},
            todayScore: 0,
            scoreDate: new Date().toISOString().split('T')[0]
        };

        // 3. Update State (Add mission & set active)
        state.missions[missionId] = newMission;
        state.activeMissionId = missionId;

        localStorage.setItem("focuspoint-state", JSON.stringify(state));

        // 4. Redirect
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-[#F8F4E9] text-[#252525] flex flex-col items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-[#EFE0C8]/40 backdrop-blur-xl border border-[#252525]/5 rounded-3xl p-8 space-y-8 shadow-2xl shadow-[#252525]/10"
            >
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-[#F78320] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#F78320]/20">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#252525]">New Mission</h1>
                    <p className="text-[#252525]/60">Configure your challenge parameters.</p>
                </div>

                <form onSubmit={handleStart} className="space-y-6">
                    {/* Challenge Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#252525]/80 flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#F78320]" /> Mission Codename
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Monk Mode, Project X"
                            className="w-full bg-white/60 border border-[#252525]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F78320] transition-colors placeholder-[#252525]/30"
                        />
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#252525]/80 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#F78320]" /> Duration (Days)
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            max="365"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full bg-white/60 border border-[#252525]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F78320] transition-colors"
                        />
                    </div>

                    {/* Daily Target */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#252525]/80 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-[#F78320]" /> Daily Point Target
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={dailyTarget}
                                onChange={(e) => setDailyTarget(parseInt(e.target.value))}
                                className="flex-1 accent-[#F78320]"
                            />
                            <span className="text-xl font-bold font-mono min-w-[3ch] text-right text-[#F78320]">
                                {dailyTarget}
                            </span>
                        </div>
                        <p className="text-xs text-[#252525]/40">Points needed to earn a checkmark.</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-[#F78320] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-[#F78320]/20 hover:shadow-[#F78320]/40 transition-shadow"
                    >
                        START MISSION <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </form>
            </motion.div>
        </main>
    );
}
