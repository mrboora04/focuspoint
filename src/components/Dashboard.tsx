"use client";

import { motion } from "framer-motion";
import { User, Trophy, Target, Award, Calendar, ArrowRight, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface DashboardProps {
    state: any;
    onSelectMission: (id: string) => void;
}

export default function Dashboard({ state, onSelectMission }: DashboardProps) {
    const [stats, setStats] = useState({ totalPoints: 0, missionsCount: 0, activeStreak: 0 });
    const [heatmap, setHeatmap] = useState<boolean[]>([]);
    const [theme, setTheme] = useState("light");

    // THEME ENGINE
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    useEffect(() => {
        if (!state || !state.missions) return;

        let totalPoints = 0;
        const missionsCount = Object.keys(state.missions).length;
        let maxStreak = 0;

        // Calculate Stats & Heatmap Data
        const today = new Date();
        const heatmapData = Array(14).fill(false); // Last 14 days

        Object.values(state.missions).forEach((mission: any) => {
            // Points (Sum all logs + current daily score)
            if (mission.dailyLog) {
                Object.values(mission.dailyLog).forEach((day: any) => {
                    if (day.tasks) {
                        day.tasks.forEach((t: any) => totalPoints += (t.points || 0));
                    }
                });
            }
            totalPoints += (mission.todayScore || 0);

            // Streak 
            const completedCount = Object.values(mission.history || {}).filter(v => v === "completed").length;
            if (completedCount > maxStreak) maxStreak = completedCount;

            // Heatmap Population
            for (let i = 0; i < 14; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                if (
                    (mission.history && mission.history[dateStr]) ||
                    (mission.dailyLog && mission.dailyLog[dateStr])
                ) {
                    heatmapData[13 - i] = true;
                }
            }
        });

        setStats({ totalPoints, missionsCount, activeStreak: maxStreak });
        setHeatmap(heatmapData);
    }, [state]);

    const activeMissions = Object.entries(state.missions).map(([id, m]: [string, any]) => ({
        id,
        ...m
    }));

    return (
        <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in duration-500 p-4">
            {/* HEADER */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#F78320]/20 rounded-full flex items-center justify-center text-4xl shadow-sm border-2 border-[#F78320]/20">
                            🦁
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-theme-text uppercase">COMMANDER</h1>
                    </div>
                    <p className="text-theme-text opacity-50 text-sm font-bold tracking-widest uppercase ml-1">Ready for deployment</p>
                </div>

                {/* THEME TOGGLE */}
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-theme-card border border-theme-border text-theme-text hover:scale-95 transition-transform active:scale-90"
                >
                    {theme === "light" ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </button>
            </header>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-theme-card backdrop-blur-3xl p-8 rounded-[2rem] border border-theme-border shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-yellow-100/10 rounded-2xl text-yellow-600">
                            <Trophy className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <span className="font-bold text-theme-text opacity-40 text-xs tracking-widest uppercase">Total Focus Points</span>
                    </div>
                    <span className="text-5xl font-black text-theme-text tracking-tight">{stats.totalPoints}</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-theme-card backdrop-blur-3xl p-8 rounded-[2rem] border border-theme-border shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-100/10 rounded-2xl text-blue-600">
                            <Target className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <span className="font-bold text-theme-text opacity-40 text-xs tracking-widest uppercase">Missions Active</span>
                    </div>
                    <span className="text-5xl font-black text-theme-text tracking-tight">{stats.missionsCount}</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-theme-card backdrop-blur-3xl p-8 rounded-[2rem] border border-theme-border shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-green-100/10 rounded-2xl text-green-600">
                            <Award className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <span className="font-bold text-theme-text opacity-40 text-xs tracking-widest uppercase">Max Streak</span>
                    </div>
                    <span className="text-5xl font-black text-theme-text tracking-tight">{stats.activeStreak}</span>
                </motion.div>
            </div>

            {/* MISSIONS GRID */}
            <div>
                <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-2xl font-black tracking-tight text-theme-text">Active Missions</h2>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectMission("new")}
                        className="text-xs font-bold text-[#F78320] border-2 border-[#F78320]/20 px-5 py-2 rounded-full hover:bg-[#F78320] hover:text-white transition-all shadow-sm hover:shadow-[#F78320]/20"
                    >
                        + NEW MISSION
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeMissions.length > 0 ? (
                        activeMissions.map((mission) => {
                            const startDate = new Date(mission.config.startDate);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - startDate.getTime());
                            const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const progress = Math.min(100, (dayNumber / mission.config.duration) * 100);

                            return (
                                <motion.div
                                    key={mission.id}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectMission(mission.id)}
                                    className="bg-theme-card backdrop-blur-xl p-8 rounded-[2.5rem] border border-theme-border cursor-pointer group hover:bg-theme-bg/50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl relative overflow-hidden"
                                >
                                    <div className="absolute top-6 right-6 p-2 rounded-full bg-theme-bg opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        <ArrowRight className="w-5 h-5 text-[#F78320]" />
                                    </div>

                                    <h3 className="text-2xl font-black text-theme-text mb-1 tracking-tight">{mission.config.name}</h3>
                                    <p className="text-xs text-theme-text opacity-40 mb-6 font-bold uppercase tracking-widest">
                                        Day <span className="text-[#F78320] text-sm">{dayNumber}</span> of {mission.config.duration}
                                    </p>

                                    {/* Mini Progress Bar */}
                                    <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#F78320]"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="mt-3 flex justify-between text-[10px] text-theme-text opacity-30 font-bold uppercase tracking-wider">
                                        <span>{mission.config.dailyHabits?.length || 0} Habits</span>
                                        <span>{Math.round(progress)}% Done</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-16 bg-theme-card/50 rounded-[2.5rem] border-2 border-dashed border-theme-border">
                            <p className="text-theme-text opacity-40 font-medium">No active missions found.</p>
                            <button
                                onClick={() => onSelectMission("new")}
                                className="mt-3 text-[#F78320] font-bold hover:underline"
                            >
                                Start your first mission
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* HEATMAP */}
            <div className="bg-theme-card p-8 rounded-[2.5rem] border border-theme-border shadow-sm">
                <h2 className="text-lg font-black text-theme-text mb-6 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#F78320]" strokeWidth={2} />
                    RECENT ACTIVITY
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {heatmap.map((active, i) => (
                        <div
                            key={i}
                            title={active ? "Active" : "No Activity"}
                            className={`w-10 h-10 shrink-0 rounded-xl transition-all ${active
                                ? "bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-100"
                                : "bg-black/5 scale-95"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
