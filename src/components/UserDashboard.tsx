"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, X, Trophy, Target, Award } from "lucide-react";
import { useState, useEffect } from "react";

interface GlobalStats {
    totalPoints: number;
    missionsCount: number;
    activeStreak: number;
}

interface UserDashboardProps {
    state: any; // Full application state
}

export default function UserDashboard({ state }: UserDashboardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [stats, setStats] = useState<GlobalStats>({ totalPoints: 0, missionsCount: 0, activeStreak: 0 });

    useEffect(() => {
        if (!state || !state.missions) return;

        let totalPoints = 0;
        const missionsCount = Object.keys(state.missions).length;

        // Calculate total points across all missions
        Object.values(state.missions).forEach((mission: any) => {
            // Sum points from logs if available, or just todayScore for now (simplified)
            // Ideally we iterate deep history logs.
            if (mission.dailyLog) {
                Object.values(mission.dailyLog).forEach((day: any) => {
                    if (day.tasks) {
                        day.tasks.forEach((t: any) => {
                            totalPoints += t.points || 0;
                        });
                    }
                });
            }
            // Add current day score strictly
            totalPoints += mission.todayScore || 0;
        });

        // Determine active streak (from active mission preferably)
        let activeStreak = 0;
        if (state.activeMissionId && state.missions[state.activeMissionId]) {
            const history = state.missions[state.activeMissionId].history || {};
            // Simple streak calc: count backward from today? 
            // For MVP, lets just count total "completed" days in active mission
            activeStreak = Object.values(history).filter(v => v === "completed").length;
        }

        setStats({ totalPoints, missionsCount, activeStreak });
    }, [state, isOpen]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-full bg-[#EFE0C8]/50 hover:bg-[#EFE0C8] text-[#252525] transition-colors"
                title="User Profile"
            >
                <User className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#F8F4E9] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/20 relative"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-[#252525]/40 hover:text-[#252525]"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col items-center mb-8">
                                <div className="w-20 h-20 bg-[#F78320] rounded-full flex items-center justify-center shadow-lg shadow-[#F78320]/20 mb-4">
                                    <User className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-[#252525]">Commander</h2>
                                <p className="text-[#252525]/50 text-sm">Level 1 Focus Pilot</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/60 p-4 rounded-2xl flex items-center justify-between border border-[#252525]/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-[#252525]/80">Total Points</span>
                                    </div>
                                    <span className="text-xl font-bold text-[#252525]">{stats.totalPoints}</span>
                                </div>

                                <div className="bg-white/60 p-4 rounded-2xl flex items-center justify-between border border-[#252525]/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-[#252525]/80">Active Challenges</span>
                                    </div>
                                    <span className="text-xl font-bold text-[#252525]">{stats.missionsCount}</span>
                                </div>

                                <div className="bg-white/60 p-4 rounded-2xl flex items-center justify-between border border-[#252525]/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-[#252525]/80">Current Streak</span>
                                    </div>
                                    <span className="text-xl font-bold text-[#252525]">{stats.activeStreak} Days</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
