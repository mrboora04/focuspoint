"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Calendar, CheckCircle2, Circle } from "lucide-react";
import Confetti from "canvas-confetti";

interface Task {
    id: number;
    title: string;
    priority: "High" | "Medium" | "Low";
    status: "pending" | "completed";
}

interface ActiveMissionProps {
    mission: any;
    onClose: () => void;
    onCompleteTask: (id: number, points: number) => void;
}

export default function ActiveMissionView({ mission, onClose, onCompleteTask }: ActiveMissionProps) {
    const [timeLeft, setTimeLeft] = useState("");

    // Countdown Timer
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);
            const diff = tomorrow.getTime() - now.getTime();

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, []);

    const startDate = new Date(mission.config.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = mission.config.duration;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-theme-bg/95 backdrop-blur-3xl overflow-y-auto"
        >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-theme-bg/80 backdrop-blur-md p-6 flex justify-between items-center border-b border-theme-border">
                <button
                    onClick={onClose}
                    className="p-3 bg-theme-card rounded-[1rem] hover:scale-95 transition-transform"
                >
                    <ArrowLeft className="w-6 h-6 text-theme-text" />
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold opacity-40 uppercase tracking-widest text-theme-text">Mission Timer</span>
                    <div className="font-mono text-xl font-bold text-[#F78320] flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {timeLeft}
                    </div>
                </div>
            </div>

            <div className="p-6 pb-32 space-y-8">
                {/* Big Day Display */}
                <div className="text-center space-y-2 py-10">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block px-6 py-2 rounded-full bg-[#F78320]/10 text-[#F78320] font-black uppercase tracking-widest text-sm mb-4"
                    >
                        {mission.config.name}
                    </motion.div>
                    <h1 className="text-7xl font-black text-theme-text tracking-tighter">
                        DAY {dayNumber}
                    </h1>
                    <p className="text-xl text-theme-text opacity-40 font-medium">/{totalDays} COMPLETED</p>
                </div>

                {/* MISSION PROTOCOL CARD */}
                <div className="bg-theme-card/50 border border-theme-border rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-theme-text opacity-40 uppercase tracking-widest">Mission Protocol</h3>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: mission.config.bufferDays || 0 }).map((_, i) => (
                                <span key={i} className="text-xl">❤️</span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-lg">📜</span>
                            <div>
                                <p className="font-bold text-theme-text text-sm">The Code</p>
                                <p className="text-xs text-theme-text opacity-60 leading-relaxed">
                                    {mission.config.dailyHabits?.join(", ") || "No specific rules defined."}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="text-lg">⚖️</span>
                            <div>
                                <p className="font-bold text-theme-text text-sm">The Stakes</p>
                                <p className="text-xs text-theme-text opacity-60 leading-relaxed">
                                    {mission.config.penaltyType}: {mission.config.penaltyDetail || "Standard Protocol"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="space-y-4">
                    {mission.tasks.map((task: Task) => (
                        <motion.button
                            key={task.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onCompleteTask(task.id, 10)}
                            className="w-full bg-theme-card p-6 rounded-[2rem] border border-theme-border flex items-center justify-between group"
                        >
                            <span className="text-lg font-bold text-theme-text text-left line-clamp-2">{task.title}</span>
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed'
                                ? "bg-[#F78320] border-[#F78320]"
                                : "border-theme-border group-hover:border-[#F78320]"
                                }`}>
                                {task.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-white" />}
                            </div>
                        </motion.button>
                    ))}
                    {mission.tasks.length === 0 && (
                        <div className="text-center py-10 opacity-40 font-bold text-theme-text">
                            No active tasks for today.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
