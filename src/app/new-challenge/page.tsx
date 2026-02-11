"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, X, ShieldAlert, Target, Heart, Zap, Award, Sun, Moon } from "lucide-react";

export default function MissionWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // DATA STATE
    const [name, setName] = useState("");
    const [duration, setDuration] = useState(30);
    const [theme, setTheme] = useState("light"); // THEME
    const [habits, setHabits] = useState<string[]>([]);
    const [newHabit, setNewHabit] = useState("");
    const [penaltyType, setPenaltyType] = useState("Restart");
    const [penaltyDetail, setPenaltyDetail] = useState("");
    const [bufferDays, setBufferDays] = useState(0); // MERCY

    // PRESETS
    const habitPresets = ["Read 10 Pages", "Drink 3L Water", "No Sugar", "45m Workout", "Meditate 10m"];

    // HANDLERS
    const handleAddHabit = (val: string) => {
        if (val.trim() && !habits.includes(val.trim())) {
            setHabits([...habits, val.trim()]);
            setNewHabit("");
        }
    };

    const handleStart = () => {
        if (!name) return;

        // Save Theme 
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);

        const newMissionId = Date.now().toString();
        const missionData = {
            id: newMissionId,
            config: {
                name,
                duration,
                startDate: new Date().toISOString(),
                dailyTarget: 100, // Default for now
                dailyHabits: habits,
                penaltyType,
                penaltyDetail,
                bufferDays
            },
            tasks: [],
            history: {},
            dailyLog: {},
            todayScore: 0,
            scoreDate: new Date().toISOString().split('T')[0]
        };

        const existingState = localStorage.getItem("focuspoint_v1");
        const state = existingState ? JSON.parse(existingState) : { activeMissionId: null, missions: {} };

        state.missions[newMissionId] = missionData;
        state.activeMissionId = newMissionId;

        localStorage.setItem("focuspoint_v1", JSON.stringify(state));
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-theme-bg flex items-center justify-center p-6 font-sans transition-colors duration-500">
            <div className="bg-theme-card backdrop-blur-3xl w-full max-w-2xl p-8 md:p-12 rounded-[2.5rem] border border-theme-border shadow-[0_20px_60px_rgb(0,0,0,0.1)] relative overflow-hidden flex flex-col min-h-[600px]">

                {/* PROGRESS HEADER */}
                <div className="flex justify-between items-center mb-10 px-2">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= i ? "bg-[#F78320]" : "bg-black/10"}`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-theme-text opacity-40 uppercase tracking-widest">
                        Phase {step} of 4
                    </span>
                </div>

                <div className="flex-1 relative">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: IDENTITY */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h1 className="text-5xl font-black text-theme-text tracking-tighter uppercase mb-2">Identity</h1>
                                    <p className="text-lg text-theme-text opacity-60 font-medium">Define your mission parameters.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-theme-text opacity-40 uppercase tracking-widest mb-3">Mission Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Monk Mode"
                                            className="w-full bg-theme-bg p-6 rounded-[1.5rem] border border-theme-border text-theme-text font-black text-2xl focus:outline-none focus:ring-4 focus:ring-[#F78320]/20 transition-all placeholder:opacity-20"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Duration */}
                                        <div>
                                            <label className="block text-xs font-bold text-theme-text opacity-40 uppercase tracking-widest mb-3">Duration</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[7, 30, 75, 90].map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setDuration(d)}
                                                        className={`p-3 rounded-2xl font-bold text-sm transition-all border ${duration === d
                                                                ? "bg-[#F78320] text-white border-[#F78320]"
                                                                : "bg-theme-bg text-theme-text border-theme-border hover:border-[#F78320]/50"
                                                            }`}
                                                    >
                                                        {d}d
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Theme */}
                                        <div>
                                            <label className="block text-xs font-bold text-theme-text opacity-40 uppercase tracking-widest mb-3">Theme</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setTheme("light")}
                                                    className={`p-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${theme === "light"
                                                            ? "bg-[#F8F4E9] text-[#252525] border-[#F78320] ring-2 ring-[#F78320]/20"
                                                            : "bg-theme-bg text-theme-text border-theme-border opacity-50 hover:opacity-100"
                                                        }`}
                                                >
                                                    <Sun className="w-4 h-4" /> Light
                                                </button>
                                                <button
                                                    onClick={() => setTheme("dark")}
                                                    className={`p-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${theme === "dark"
                                                            ? "bg-[#1E1A17] text-[#EFE0C8] border-[#F78320] ring-2 ring-[#F78320]/20"
                                                            : "bg-theme-bg text-theme-text border-theme-border opacity-50 hover:opacity-100"
                                                        }`}
                                                >
                                                    <Moon className="w-4 h-4" /> Dark
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setStep(2)}
                                    disabled={!name}
                                    className="w-full bg-theme-text text-theme-bg p-6 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
                                >
                                    ESTABLISH CODE <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* STEP 2: THE CODE (Flexible Builder) */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 h-full flex flex-col"
                            >
                                <div>
                                    <h1 className="text-5xl font-black text-theme-text tracking-tighter uppercase mb-2">The Code</h1>
                                    <p className="text-lg text-theme-text opacity-60 font-medium">Non-negotiable daily rules.</p>
                                </div>

                                {/* Builder Interface */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newHabit}
                                            onChange={(e) => setNewHabit(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit(newHabit)}
                                            placeholder="Type a rule..."
                                            className="flex-1 bg-theme-bg p-5 rounded-[1.5rem] border border-theme-border text-theme-text font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#F78320]/20"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleAddHabit(newHabit)}
                                            className="bg-theme-text text-theme-bg px-6 rounded-[1.5rem] hover:scale-95 transition-transform"
                                        >
                                            <Plus className="w-8 h-8" />
                                        </button>
                                    </div>

                                    {/* Presets */}
                                    <div className="flex flex-wrap gap-2">
                                        {habitPresets.map(preset => (
                                            <button
                                                key={preset}
                                                onClick={() => handleAddHabit(preset)}
                                                className="text-xs font-bold bg-theme-text/5 text-theme-text/60 px-4 py-2 rounded-xl hover:bg-theme-text/10 transition-colors border border-transparent hover:border-theme-text/10"
                                            >
                                                + {preset}
                                            </button>
                                        ))}
                                    </div>

                                    {/* List */}
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        <AnimatePresence initial={false}>
                                            {habits.map((habit, idx) => (
                                                <motion.div
                                                    key={habit}
                                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                    className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/40 group hover:border-[#F78320]/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-[#F78320]" />
                                                        <span className="font-bold text-theme-text text-lg">{habit}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setHabits(habits.filter((_, i) => i !== idx))}
                                                        className="p-2 rounded-full bg-black/5 text-[#252525]/40 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {habits.length === 0 && (
                                            <div className="text-center py-12 border-2 border-dashed border-theme-border rounded-[2rem] opacity-30">
                                                <p className="font-bold">No rules defined.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setStep(3)}
                                    disabled={habits.length === 0}
                                    className="w-full bg-theme-text text-theme-bg p-6 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
                                >
                                    DEFINE STAKES <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* STEP 3: THE CONTRACT (Penalty & Buffer) */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h1 className="text-5xl font-black text-danger tracking-tighter uppercase mb-2">The Contract</h1>
                                    <p className="text-lg text-theme-text opacity-60 font-medium">Consequences & Mercy.</p>
                                </div>

                                {/* Penalty Tabs */}
                                <div className="space-y-6">
                                    <div className="bg-theme-bg p-2 rounded-[1.5rem] flex gap-1 border border-theme-border overflow-x-auto">
                                        {["Restart", "Fine", "Physical", "Social"].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setPenaltyType(type)}
                                                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all min-w-[80px] ${penaltyType === type
                                                        ? "bg-theme-text text-theme-bg shadow-lg"
                                                        : "text-theme-text/50 hover:bg-theme-text/5"
                                                    }`}
                                            >
                                                {type === "Restart" ? "🛡️ Reset" : type === "Fine" ? "💸 Fine" : type === "Physical" ? "🏋️ Reps" : "🤡 Social"}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-red-500/5 p-8 rounded-[2rem] border border-red-500/10">
                                        <div className="flex items-center gap-3 text-danger mb-4">
                                            <ShieldAlert className="w-6 h-6" />
                                            <span className="font-bold uppercase tracking-widest text-xs">Penalty Terms</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={penaltyDetail}
                                            onChange={(e) => setPenaltyDetail(e.target.value)}
                                            placeholder={
                                                penaltyType === "Fine" ? "e.g. Donate $50 to Charity" :
                                                    penaltyType === "Physical" ? "e.g. 100 Burpees" :
                                                        penaltyType === "Social" ? "e.g. Post shameful photo" :
                                                            "Mission resets to Day 1."
                                            }
                                            className="w-full bg-theme-bg p-5 rounded-2xl border border-theme-border text-theme-text font-bold text-lg focus:outline-none focus:ring-2 focus:ring-danger placeholder:opacity-40"
                                        />
                                    </div>

                                    {/* Mercy / Buffer */}
                                    <div className="bg-blue-500/5 p-8 rounded-[2rem] border border-blue-500/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3 text-blue-600">
                                                <Heart className="w-6 h-6" fill="currentColor" />
                                                <span className="font-bold uppercase tracking-widest text-xs">Mercy Buffer</span>
                                            </div>
                                            <span className="text-2xl font-black text-blue-600">{bufferDays} Days</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="5"
                                            value={bufferDays}
                                            onChange={(e) => setBufferDays(int(e.target.value))}
                                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <p className="text-xs text-theme-text opacity-40 mt-3 font-medium text-center">
                                            Allow {bufferDays} missed days before penalty triggers.
                                        </p>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setStep(4)}
                                    className="w-full bg-theme-text text-theme-bg p-6 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-lg mt-4 hover:scale-[1.01] transition-all"
                                >
                                    REVIEW CONTRACT <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* STEP 4: REVIEW */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h1 className="text-5xl font-black text-[#F78320] tracking-tighter uppercase mb-2">Sign Off</h1>
                                    <p className="text-lg text-theme-text opacity-60 font-medium">Ready to deploy?</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Protocol Name</p>
                                            <p className="text-2xl font-black text-theme-text">{name}</p>
                                        </div>
                                        <Award className="w-10 h-10 text-[#F78320]" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/50 p-6 rounded-[2rem] border border-white/40">
                                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Duration</p>
                                            <p className="text-2xl font-black text-theme-text">{duration} Days</p>
                                        </div>
                                        <div className="bg-white/50 p-6 rounded-[2rem] border border-white/40">
                                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Stakes</p>
                                            <p className="text-lg font-bold text-danger leading-tight">{penaltyType === "Restart" ? "Hard Reset" : penaltyType}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/50 p-6 rounded-[2rem] border border-white/40">
                                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-3">The Code ({habits.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {habits.map(h => (
                                                <span key={h} className="text-xs font-bold bg-black/5 px-3 py-1 rounded-full">{h}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="w-full bg-[#F78320] text-white p-6 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-xl shadow-[0_10px_40px_rgba(247,131,32,0.4)] hover:shadow-[0_15px_60px_rgba(247,131,32,0.6)] hover:scale-[1.02] transition-all"
                                >
                                    <Zap className="w-6 h-6" fill="currentColor" /> INITIATE MISSION
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}

// Helper
const int = (val: string) => parseInt(val, 10);
