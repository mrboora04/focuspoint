"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Clock, CheckCircle2, Plus, X, ArrowUp } from "lucide-react";
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
    onAddTask: (title: string) => void;
}

export default function ActiveMissionView({ mission, onClose, onCompleteTask, onAddTask }: ActiveMissionProps) {
    const [timeLeft, setTimeLeft] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [newTask, setNewTask] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

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

    // Focus input when creating
    useEffect(() => {
        if (isCreating && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isCreating]);

    const startDate = new Date(mission.config.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = mission.config.duration;

    const handleAddTask = () => {
        if (!newTask.trim()) return;
        onAddTask(newTask);
        setNewTask("");
        setIsCreating(false);
        // Haptic feedback could go here
        if (navigator.vibrate) navigator.vibrate(50);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-theme-bg/95 backdrop-blur-3xl overflow-hidden flex flex-col"
        >
            {/* Background Blur Overlay for Visualization Mode */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="absolute inset-0 z-40 bg-theme-bg/60 cursor-pointer"
                        onClick={() => setIsCreating(false)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className={`sticky top-0 z-30 transition-all duration-300 ${isCreating ? "blur-md opacity-50" : ""}`}>
                <div className="bg-theme-bg/80 backdrop-blur-md p-6 flex justify-between items-center border-b border-theme-border">
                    <button
                        onClick={onClose}
                        className="p-3 bg-theme-card rounded-[1rem] hover:scale-95 transition-transform"
                    >
                        <ArrowLeft className="w-6 h-6 text-theme-text" />
                    </button>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold opacity-40 uppercase tracking-widest text-theme-text">Challenge Timer</span>
                        <div className="font-mono text-xl font-bold text-[#F78320] flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {timeLeft}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Scrollable Content */}
            <div className={`flex-1 overflow-y-auto p-6 pb-40 space-y-8 transition-all duration-300 ${isCreating ? "blur-sm" : ""}`}>

                {/* Big Day Display */}
                <div className="text-center space-y-2 py-6">
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

                {/* TASK LIST (Top Priority) */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-theme-text opacity-40 uppercase tracking-widest ml-2">Active Tasks</h3>
                    {mission.tasks.length === 0 ? (
                        <div className="text-center py-10 opacity-40 font-bold text-theme-text border-2 border-dashed border-theme-border rounded-[2rem]">
                            No active tasks. Tap + to add.
                        </div>
                    ) : (
                        mission.tasks.map((task: Task) => (
                            <motion.button
                                key={task.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (task.status !== 'completed') {
                                        onCompleteTask(task.id, 10);
                                        if (navigator.vibrate) navigator.vibrate(20);
                                    }
                                }}
                                className={`w-full p-6 rounded-[2rem] border flex items-center justify-between group transition-all duration-300 ${task.status === 'completed'
                                        ? "bg-theme-card/50 border-theme-border opacity-60"
                                        : "bg-theme-card border-theme-border shadow-sm"
                                    }`}
                            >
                                <span className={`text-lg font-bold text-left line-clamp-2 transition-all ${task.status === 'completed' ? "text-theme-text/50 line-through" : "text-theme-text"
                                    }`}>
                                    {task.title}
                                </span>
                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed'
                                        ? "bg-[#F78320] border-[#F78320]"
                                        : "border-theme-border group-hover:border-[#F78320]"
                                    }`}>
                                    {task.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-white" />}
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* RULES / PROTOCOL (Bottom Anchor) */}
                <div className="bg-theme-card/30 border border-theme-border/50 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-theme-text opacity-40 uppercase tracking-widest">Protocol Rules</h3>
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
            </div>

            {/* DYNAMIC ISLAND / CREATION INTERFACE */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCreating ? "translate-y-0" : "translate-y-0"}`}>
                <AnimatePresence mode="wait">
                    {!isCreating ? (
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreating(true)}
                            className="w-full bg-[#1E1A17] text-white p-4 rounded-[2.5rem] shadow-2xl shadow-black/30 border border-white/10 flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4 pl-2">
                                <div className="w-12 h-12 bg-[#F78320] rounded-full flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-[#EFE0C8] uppercase tracking-wide text-sm">New Entry</p>
                                    <p className="text-xs text-white/40 font-medium">Add to today's log</p>
                                </div>
                            </div>
                            <div className="pr-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <ArrowUp className="w-5 h-5 text-[#F78320]" />
                            </div>
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full bg-theme-bg border border-[#F78320] p-2 rounded-[2.5rem] shadow-[0_0_50px_rgba(247,131,32,0.3)] flex items-center gap-2"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                placeholder="What needs to be done?"
                                className="flex-1 bg-transparent p-4 pl-6 text-theme-text font-bold text-lg placeholder:text-theme-text/30 outline-none"
                            />
                            <button
                                onClick={handleAddTask}
                                disabled={!newTask.trim()}
                                className="w-14 h-14 bg-[#F78320] rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-[#F78320]/20"
                            >
                                <ArrowUp className="w-6 h-6" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
