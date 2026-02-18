"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Award, Activity, Zap, CheckCircle2, Flame, AlertTriangle, ArrowRight, Plus } from "lucide-react";
import { useFocus } from "@/context/FocusContext";
import { useRouter } from "next/navigation";

interface ActivityItem {
    id: string;
    type: "success" | "streak" | "failure";
    title: string;
    detail: string;
    points?: number;
    time: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
    {
        id: "1",
        type: "success",
        title: "Completed mission \"Morning Focus\"",
        detail: "+15 points",
        points: 15,
        time: "2 hours ago"
    },
    {
        id: "2",
        type: "streak",
        title: "Streak increased to 7 days",
        detail: "Personal best approaching",
        time: "Yesterday"
    },
    {
        id: "3",
        type: "failure",
        title: "Missed target \"No Phone After 10PM\"",
        detail: "-5 points",
        points: -5,
        time: "3 days ago"
    }
];

export default function DashboardView() {
    const { state, createTapTarget } = useFocus();
    const router = useRouter();

    // CALCULATE STATS
    let totalPoints = 0;
    let todayPoints = 0;
    let missionsActive = 0;
    let missionsDueToday = 0;
    let activeStreak = 0;
    let bestStreak = 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    Object.values(state.missions).forEach((mission) => {
        totalPoints += (mission.todayScore || 0);

        if (mission.dailyLog) {
            Object.values(mission.dailyLog).forEach((day) => {
                day.tasks?.forEach((t: any) => totalPoints += (t.points || 0));
            });
            if (mission.dailyLog[todayStr]) {
                mission.dailyLog[todayStr].tasks.forEach((t: any) => todayPoints += (t.points || 0));
            }
        }

        const completedCount = Object.values(mission.history || {}).filter(v => v === "completed").length;
        if (completedCount > activeStreak) activeStreak = completedCount;

        missionsActive++;

        const dayOfWeek = today.getDay();
        const isScheduledDay = mission.config.frequency === "selected"
            ? mission.config.selectedDays?.includes(dayOfWeek)
            : true;
        if (isScheduledDay) missionsDueToday++;
    });

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />;
            case "streak": return <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" fill="currentColor" />;
            case "failure": return <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />;
            default: return <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "success": return "bg-emerald-500/10 border-emerald-500/20";
            case "streak": return "bg-orange-500/10 border-orange-500/20";
            case "failure": return "bg-red-500/10 border-red-500/20";
            default: return "bg-gray-500/10 border-gray-500/20";
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6 animate-in fade-in zoom-in duration-500 p-3 pb-24 md:p-6 md:pb-20">

            {/* 1. COMPACT STATS ROW */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mt-2">
                {/* FOCUS POINTS */}
                <motion.div whileHover={{ y: -1 }} className="bg-theme-card p-2.5 md:p-4 rounded-xl border border-theme-border shadow-sm flex flex-col justify-between h-[auto] min-h-[72px] md:h-[90px] relative overflow-hidden group">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 z-10">
                        <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#F78320]" strokeWidth={2.5} />
                        <span className="text-[9px] md:text-[10px] font-bold text-theme-text opacity-50 tracking-widest uppercase truncate">Points</span>
                    </div>
                    <div className="z-10">
                        <span className="text-xl md:text-3xl font-black text-theme-text tracking-tight custom-number leading-none block">
                            {totalPoints}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 z-10 pt-1">
                        <span className="text-[9px] md:text-[10px] font-bold text-green-500 flex items-center gap-0.5 truncate">
                            <Zap className="w-2.5 h-2.5" fill="currentColor" />
                            +{todayPoints}
                        </span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-theme-text group-hover:opacity-[0.06] transition-opacity">
                        <Trophy className="w-16 h-16 md:w-24 md:h-24" />
                    </div>
                </motion.div>

                {/* MISSIONS */}
                <motion.div whileHover={{ y: -1 }} className="bg-theme-card p-2.5 md:p-4 rounded-xl border border-theme-border shadow-sm flex flex-col justify-between h-[auto] min-h-[72px] md:h-[90px] relative overflow-hidden group">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 z-10">
                        <Target className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500" strokeWidth={2.5} />
                        <span className="text-[9px] md:text-[10px] font-bold text-theme-text opacity-50 tracking-widest uppercase truncate">Missions</span>
                    </div>
                    <div className="z-10">
                        <span className="text-xl md:text-3xl font-black text-theme-text tracking-tight custom-number leading-none block">
                            {missionsActive}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 z-10 pt-1">
                        <span className="text-[9px] md:text-[10px] font-bold text-blue-500/80 truncate">
                            {missionsDueToday} due
                        </span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-theme-text group-hover:opacity-[0.06] transition-opacity">
                        <Target className="w-16 h-16 md:w-24 md:h-24" />
                    </div>
                </motion.div>

                {/* STREAK */}
                <motion.div whileHover={{ y: -1 }} className="bg-theme-card p-2.5 md:p-4 rounded-xl border border-theme-border shadow-sm flex flex-col justify-between h-[auto] min-h-[72px] md:h-[90px] relative overflow-hidden group">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 z-10">
                        <Award className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500" strokeWidth={2.5} />
                        <span className="text-[9px] md:text-[10px] font-bold text-theme-text opacity-50 tracking-widest uppercase truncate">Streak</span>
                    </div>
                    <div className="z-10">
                        <span className="text-xl md:text-3xl font-black text-theme-text tracking-tight custom-number leading-none block">
                            {activeStreak}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 z-10 pt-1">
                        <span className="text-[9px] md:text-[10px] font-bold text-green-500/80 truncate">
                            Best: {activeStreak}
                        </span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-theme-text group-hover:opacity-[0.06] transition-opacity">
                        <Award className="w-16 h-16 md:w-24 md:h-24" />
                    </div>
                </motion.div>
            </div>

            {/* 2. RECENT ACTIVITY (Limited) */}
            <div className="bg-theme-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-theme-border shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                    <h2 className="text-xs md:text-sm font-black text-theme-text uppercase tracking-widest flex items-center gap-2 opacity-80">
                        <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F78320]" />
                        Recent Activity
                    </h2>
                </div>

                <div className="space-y-0 divide-y divide-theme-border/30">
                    {MOCK_ACTIVITY.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex gap-3 md:gap-4 py-3 md:py-4 first:pt-0 last:pb-0 group">
                            <div className="flex flex-col items-center pt-0.5 md:pt-1">
                                <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${getActivityColor(activity.type)} transition-colors`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="w-px h-full bg-theme-border/50 my-1 group-last:hidden" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="pr-2">
                                        <p className="text-sm md:text-base font-bold text-theme-text leading-tight mb-0.5 md:mb-1">
                                            {activity.title}
                                        </p>
                                        <p className="text-[11px] md:text-xs text-theme-text opacity-50 font-medium leading-normal">
                                            {activity.detail}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[9px] md:text-[10px] font-bold text-theme-text opacity-40 uppercase tracking-wide block mb-0.5">
                                            {activity.time}
                                        </span>
                                        {activity.points && (
                                            <span className={`text-[10px] md:text-xs font-bold ${activity.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {activity.points > 0 ? '+' : ''}{activity.points}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-4">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/new-challenge")}
                    className="p-4 rounded-2xl bg-gradient-to-br from-[#F78320]/20 to-[#F78320]/5 border border-[#F78320]/20 flex flex-col items-center justify-center gap-2 group hover:border-[#F78320]/40 transition-all"
                >
                    <div className="w-10 h-10 rounded-full bg-[#F78320] text-white flex items-center justify-center shadow-lg shadow-[#F78320]/20 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-theme-text uppercase tracking-widest opacity-80">New Mission</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={createTapTarget}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/40 transition-all"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6" fill="currentColor" />
                    </div>
                    <span className="text-xs font-bold text-theme-text uppercase tracking-widest opacity-80">New Target</span>
                </motion.button>
            </div>

        </div>
    );
}
