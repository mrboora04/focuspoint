"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, X, ShieldAlert, Target, Heart, Zap, Award, Sun, Moon } from "lucide-react";

export default function ChallengeWizard() {
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

    // FREQUENCY STATE
    const [frequency, setFrequency] = useState<"daily" | "selected">("daily");
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // 0=Sun, 6=Sat

    // PRESETS
    const habitPresets = ["Read 10 Pages", "Drink 3L Water", "No Sugar", "45m Workout", "Meditate 10m"];
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

    // HANDLERS
    const handleAddHabit = (val: string) => {
        if (val.trim() && !habits.includes(val.trim())) {
            setHabits([...habits, val.trim()]);
            setNewHabit("");
        }
    };

    const toggleDay = (index: number) => {
        if (selectedDays.includes(index)) {
            if (selectedDays.length > 1) { // Prevent empty selection
                setSelectedDays(selectedDays.filter(d => d !== index));
            }
        } else {
            setSelectedDays([...selectedDays, index].sort());
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
                bufferDays,
                frequency,
                selectedDays: frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : selectedDays
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
        <main className="min-h-screen bg-theme-bg flex flex-col p-6 font-sans transition-colors duration-500 overflow-y-auto">
            {/* PROGRESS HEADER */}
            <div className="flex justify-between items-center mb-8 px-2 shrink-0">
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className={`h-2 w-8 sm:w-12 rounded-full transition-all duration-500 ${step >= i ? "bg-[#F78320]" : "bg-black/10"}`}
                        />
                    ))}
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="p-2 -mr-2 text-theme-text opacity-50 hover:opacity-100"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 max-w-lg mx-auto w-full pb-10">
                <AnimatePresence mode="wait">

                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-4xl font-black text-theme-text tracking-tighter uppercase mb-2">Identity</h1>
                                <p className="text-lg text-theme-text opacity-60 font-medium">Define your challenge.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold text-theme-text opacity-40 uppercase tracking-widest mb-3">Challenge Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Monk Mode"
                                        className="w-full bg-theme-card p-6 rounded-[1.5rem] border border-theme-border text-theme-text font-black text-xl focus:outline-none focus:ring-4 focus:ring-[#F78320]/20 transition-all placeholder:opacity-20"
                                        autoFocus
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-xs font-bold text-theme-text opacity-40 uppercase tracking-widest mb-3">Duration</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[7, 30, 75, 90].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setDuration(d)}
                                                className={`py-4 rounded-2xl font-bold text-sm transition-all border ${duration === d
                                                    ? "bg-[#F78320] text-white border-[#F78320] shadow-lg shadow-[#F78320]/30"
                                                    : "bg-theme-card text-theme-text border-theme-border"
                                                    }`}
                                            >
                                                {d}d
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Frequency */}
                                <div>
                                    <label className="block text-xs font-bold text-theme-text opacity-40 uppercase tracking-widest mb-3">Frequency</label>
                                    <div className="flex gap-2 mb-4">
                                        {(["daily", "selected"] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFrequency(f)}
                                                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border ${frequency === f
                                                    ? "bg-theme-text text-theme-bg border-theme-text"
                                                    : "bg-theme-card text-theme-text border-theme-border opacity-60"}`}
                                            >
                                                {f === "daily" ? "Every Day" : "Specific Days"}
                                            </button>
                                        ))}
                                    </div>

                                    <AnimatePresence>
                                        {frequency === "selected" && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid grid-cols-7 gap-1 overflow-hidden"
                                            >
                                                {daysOfWeek.map((d, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => toggleDay(i)}
                                                        className={`aspect-square rounded-xl font-bold text-sm flex items-center justify-center transition-all ${selectedDays.includes(i)
                                                                ? "bg-[#F78320] text-white shadow-lg shadow-[#F78320]/20"
                                                                : "bg-theme-card text-theme-text/50"
                                                            }`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setStep(2)}
                                disabled={!name}
                                className="w-full bg-[#F78320] text-white p-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_40px_rgba(247,131,32,0.3)] transition-all"
                            >
                                NEXT PHASE <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* STEP 2: THE CODE (Flexible Builder) */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 flex flex-col h-full"
                        >
                            <div>
                                <h1 className="text-4xl font-black text-theme-text tracking-tighter uppercase mb-2">The Code</h1>
                                <p className="text-lg text-theme-text opacity-60 font-medium">Daily non-negotiables.</p>
                            </div>

                            {/* Builder Interface */}
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newHabit}
                                    onChange={(e) => setNewHabit(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit(newHabit)}
                                    placeholder="Add a rule..."
                                    className="flex-1 bg-theme-card p-5 rounded-[1.5rem] border border-theme-border text-theme-text font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#F78320]/20"
                                    autoFocus
                                    inputMode="text"
                                />
                                <button
                                    onClick={() => handleAddHabit(newHabit)}
                                    className="bg-theme-text text-theme-bg w-16 rounded-[1.5rem] flex items-center justify-center hover:scale-95 transition-transform"
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
                                        className="text-xs font-bold bg-theme-text/5 text-theme-text/60 px-4 py-3 rounded-xl hover:bg-theme-text/10 transition-colors border border-transparent"
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>

                            {/* List */}
                            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar py-2">
                                <AnimatePresence initial={false}>
                                    {habits.map((habit, idx) => (
                                        <motion.div
                                            key={habit}
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-between p-4 bg-theme-card rounded-2xl border border-theme-border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-[#F78320]" />
                                                <span className="font-bold text-theme-text text-lg">{habit}</span>
                                            </div>
                                            <button
                                                onClick={() => setHabits(habits.filter((_, i) => i !== idx))}
                                                className="p-2 rounded-full bg-black/5 text-theme-text/40"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {habits.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-theme-border rounded-[2rem] opacity-30">
                                        <p className="font-bold">No rules defined.</p>
                                    </div>
                                )}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setStep(3)}
                                disabled={habits.length === 0}
                                className="w-full bg-[#F78320] text-white p-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_40px_rgba(247,131,32,0.3)] transition-all shrink-0"
                            >
                                NEXT PHASE <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* STEP 3: THE CONTRACT (Penalty & Buffer) */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h1 className="text-4xl font-black text-danger tracking-tighter uppercase mb-2">The Stakes</h1>
                                <p className="text-lg text-theme-text opacity-60 font-medium">Define consequences.</p>
                            </div>

                            {/* Penalty Tabs */}
                            <div className="space-y-6">
                                <div className="bg-theme-card p-2 rounded-[1.5rem] flex gap-1 border border-theme-border overflow-x-auto scrollbar-hide">
                                    {["Restart", "Fine", "Physical", "Social"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setPenaltyType(type)}
                                            className={`flex-1 py-4 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${penaltyType === type
                                                ? "bg-theme-text text-theme-bg shadow-lg"
                                                : "text-theme-text/50 hover:bg-theme-text/5"
                                                }`}
                                        >
                                            {type === "Restart" ? "Reset" : type}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-red-500/5 p-6 rounded-[2rem] border border-red-500/10">
                                    <div className="flex items-center gap-3 text-danger mb-4">
                                        <ShieldAlert className="w-6 h-6" />
                                        <span className="font-bold uppercase tracking-widest text-xs">Terms</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={penaltyDetail}
                                        onChange={(e) => setPenaltyDetail(e.target.value)}
                                        placeholder={
                                            penaltyType === "Fine" ? "e.g. Donate $50" :
                                                penaltyType === "Physical" ? "e.g. 100 Burpees" :
                                                    penaltyType === "Social" ? "e.g. Post photo" :
                                                        "Mission resets to Day 1."
                                        }
                                        className="w-full bg-theme-bg p-4 rounded-2xl border border-theme-border text-theme-text font-bold text-lg focus:outline-none focus:ring-2 focus:ring-danger placeholder:opacity-40"
                                    />
                                </div>

                                {/* Mercy / Buffer */}
                                <div className="bg-blue-500/5 p-6 rounded-[2rem] border border-blue-500/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3 text-blue-600">
                                            <Heart className="w-6 h-6" fill="currentColor" />
                                            <span className="font-bold uppercase tracking-widest text-xs">Lives</span>
                                        </div>
                                        <span className="text-2xl font-black text-blue-600">{bufferDays}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="5"
                                        value={bufferDays}
                                        onChange={(e) => setBufferDays(int(e.target.value))}
                                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <p className="text-xs text-theme-text opacity-40 mt-3 font-medium text-center">
                                        {bufferDays} misses allowed before failure.
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setStep(4)}
                                className="w-full bg-[#F78320] text-white p-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-lg mt-4 shadow-[0_10px_40px_rgba(247,131,32,0.3)] transition-all"
                            >
                                REVIEW <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h1 className="text-4xl font-black text-[#F78320] tracking-tighter uppercase mb-2">Sign Off</h1>
                                <p className="text-lg text-theme-text opacity-60 font-medium">Ready to deploy?</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-theme-card p-6 rounded-[2rem] border border-theme-border flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Protocol</p>
                                        <p className="text-xl font-black text-theme-text">{name}</p>
                                    </div>
                                    <Award className="w-8 h-8 text-[#F78320]" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-theme-card p-6 rounded-[2rem] border border-theme-border">
                                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Duration</p>
                                        <p className="text-xl font-black text-theme-text">{duration} Days</p>
                                    </div>
                                    <div className="bg-theme-card p-6 rounded-[2rem] border border-theme-border">
                                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Stakes</p>
                                        <p className="text-lg font-bold text-danger leading-tight truncate">{penaltyType}</p>
                                    </div>
                                </div>

                                <div className="bg-theme-card p-6 rounded-[2rem] border border-theme-border">
                                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-3">The Code</p>
                                    <div className="flex flex-wrap gap-2">
                                        {habits.map(h => (
                                            <span key={h} className="text-xs font-bold bg-theme-bg px-3 py-1 rounded-full border border-theme-border">{h}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="w-full bg-[#F78320] text-white p-6 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 text-xl shadow-[0_10px_40px_rgba(247,131,32,0.4)] hover:shadow-[0_15px_60px_rgba(247,131,32,0.6)] hover:scale-[1.02] transition-all"
                            >
                                <Zap className="w-6 h-6" fill="currentColor" /> INITIATE
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

// Helper
const int = (val: string) => parseInt(val, 10);
