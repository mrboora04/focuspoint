"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, User, Target, Clock, MapPin, CheckCircle } from "lucide-react";
import { useFocus } from "@/context/FocusContext";
import type { ScheduleProfile, UserRole, PrimaryGoal, TransportType } from "@/types/schedule";
import { ROLE_DEFAULTS } from "@/types/schedule";

const ROLES: { id: UserRole; label: string; emoji: string; desc: string }[] = [
    { id: "student",   label: "Student",         emoji: "🎓", desc: "Classes & lectures" },
    { id: "part_time", label: "Part-Time Worker", emoji: "⚡", desc: "Shift-based schedule" },
    { id: "full_time", label: "Full-Time Worker", emoji: "💼", desc: "9–5 or fixed hours" },
    { id: "hybrid",    label: "Hybrid / Flex",   emoji: "🔄", desc: "Flexible mix" },
];

const GOALS: { id: PrimaryGoal; label: string; emoji: string }[] = [
    { id: "get_job",      label: "Get a Job",       emoji: "🚀" },
    { id: "exam_prep",    label: "Exam Prep",        emoji: "📚" },
    { id: "better_sleep", label: "Better Sleep",     emoji: "🌙" },
    { id: "freelancing",  label: "Freelancing",      emoji: "💻" },
    { id: "build_habits", label: "Build Habits",     emoji: "🔥" },
];

const TRANSPORT: { id: TransportType; label: string; emoji: string }[] = [
    { id: "car",           label: "Car",           emoji: "🚗" },
    { id: "public_transit",label: "Public Transit", emoji: "🚌" },
    { id: "walking",       label: "Walking",        emoji: "🚶" },
    { id: "no_commute",    label: "No Commute",     emoji: "🏠" },
];

const STEP_ICONS = [User, Target, Clock, MapPin, CheckCircle];
const STEP_TITLES = [
    "WHO ARE YOU?",
    "PRIMARY MISSION",
    "DAILY ANCHORS",
    "HOW DO YOU MOVE?",
    "CONFIRM SCHEDULE",
];

interface WizardState {
    role: UserRole | null;
    goal: PrimaryGoal | null;
    anchors: {
        wakeTime: string;
        breakfastTime: string;
        lunchTime: string;
        dinnerTime: string;
        workStartTime: string;
        workEndTime: string;
        sleepTargetTime: string;
    };
    transport: TransportType | null;
    commuteMins: number;
}

export default function LifestyleWizard() {
    const { saveScheduleProfile, state } = useFocus();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [saving, setSaving] = useState(false);

    const [wiz, setWiz] = useState<WizardState>({
        role: null,
        goal: null,
        anchors: {
            wakeTime: "09:00",
            breakfastTime: "09:30",
            lunchTime: "13:00",
            dinnerTime: "19:00",
            workStartTime: "15:00",
            workEndTime: "23:00",
            sleepTargetTime: "02:00",
        },
        transport: null,
        commuteMins: 30,
    });

    const next = () => { setDirection(1); setStep(s => s + 1); };
    const back = () => { setDirection(-1); setStep(s => s - 1); };

    const selectRole = (role: UserRole) => {
        const defaults = ROLE_DEFAULTS[role];
        setWiz(prev => ({
            ...prev,
            role,
            anchors: { ...prev.anchors, ...defaults },
        }));
    };

    const canAdvance = [
        !!wiz.role,
        !!wiz.goal,
        true,
        !!wiz.transport,
        true,
    ][step];

    const handleConfirm = async () => {
        if (!wiz.role || !wiz.goal || !wiz.transport) return;
        setSaving(true);
        const profile: ScheduleProfile = {
            id: crypto.randomUUID(),
            user_id: state.userProfile?.user_id ?? "anon",
            userRole: wiz.role,
            primaryGoal: wiz.goal,
            anchors: wiz.anchors,
            commute: {
                transportType: wiz.transport,
                travelDurationMins: wiz.transport === "no_commute" ? 0 : wiz.commuteMins,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await saveScheduleProfile(profile);
        setSaving(false);
        router.push("/schedule");
    };

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    const StepIcon = STEP_ICONS[step];

    return (
        <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center px-4 py-12">
            {/* Progress dots */}
            <div className="flex gap-2 mb-8">
                {STEP_TITLES.map((_, i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                            background: i <= step ? "var(--accent)" : "rgba(255,255,255,0.15)",
                            transform: i === step ? "scale(1.4)" : "scale(1)",
                        }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="w-full max-w-md"
                >
                    {/* Step header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--accent)", opacity: 0.9 }}>
                            <StepIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs opacity-40 tracking-widest uppercase">Step {step + 1} of 5</p>
                            <h2 className="text-xl font-black text-theme-text tracking-wider">{STEP_TITLES[step]}</h2>
                        </div>
                    </div>

                    {/* ── Step 0: Role ── */}
                    {step === 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {ROLES.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => selectRole(r.id)}
                                    className="p-4 rounded-2xl border-2 text-left transition-all"
                                    style={{
                                        background: wiz.role === r.id ? "var(--accent)" : "var(--card-bg)",
                                        borderColor: wiz.role === r.id ? "var(--accent)" : "var(--card-border)",
                                        color: wiz.role === r.id ? "#fff" : "inherit",
                                    }}
                                >
                                    <div className="text-2xl mb-1">{r.emoji}</div>
                                    <div className="font-bold text-sm">{r.label}</div>
                                    <div className="text-xs opacity-60 mt-0.5">{r.desc}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Step 1: Goal ── */}
                    {step === 1 && (
                        <div className="flex flex-col gap-3">
                            {GOALS.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setWiz(prev => ({ ...prev, goal: g.id }))}
                                    className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all"
                                    style={{
                                        background: wiz.goal === g.id ? "var(--accent)" : "var(--card-bg)",
                                        borderColor: wiz.goal === g.id ? "var(--accent)" : "var(--card-border)",
                                        color: wiz.goal === g.id ? "#fff" : "inherit",
                                    }}
                                >
                                    <span className="text-2xl">{g.emoji}</span>
                                    <span className="font-bold">{g.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Step 2: Time anchors ── */}
                    {step === 2 && (
                        <div className="flex flex-col gap-3">
                            {(Object.keys(wiz.anchors) as Array<keyof typeof wiz.anchors>).map(key => (
                                <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-theme-card border border-theme-border">
                                    <label className="text-sm font-medium text-theme-text capitalize">
                                        {key.replace(/([A-Z])/g, " $1").replace("Time", "").trim()}
                                    </label>
                                    <input
                                        type="time"
                                        value={wiz.anchors[key]}
                                        onChange={e => setWiz(prev => ({
                                            ...prev,
                                            anchors: { ...prev.anchors, [key]: e.target.value }
                                        }))}
                                        className="bg-transparent text-theme-text font-mono text-sm outline-none border border-theme-border rounded-lg px-2 py-1"
                                        style={{ colorScheme: "dark" }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Step 3: Transport ── */}
                    {step === 3 && (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                {TRANSPORT.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setWiz(prev => ({ ...prev, transport: t.id }))}
                                        className="p-4 rounded-2xl border-2 transition-all"
                                        style={{
                                            background: wiz.transport === t.id ? "var(--accent)" : "var(--card-bg)",
                                            borderColor: wiz.transport === t.id ? "var(--accent)" : "var(--card-border)",
                                            color: wiz.transport === t.id ? "#fff" : "inherit",
                                        }}
                                    >
                                        <div className="text-2xl mb-1">{t.emoji}</div>
                                        <div className="font-bold text-sm">{t.label}</div>
                                    </button>
                                ))}
                            </div>
                            {wiz.transport && wiz.transport !== "no_commute" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-theme-card border border-theme-border"
                                >
                                    <label className="text-sm font-medium text-theme-text block mb-2">
                                        Travel time each way: <span className="font-black" style={{ color: "var(--accent)" }}>{wiz.commuteMins} min</span>
                                    </label>
                                    <input
                                        type="range"
                                        min={5} max={120} step={5}
                                        value={wiz.commuteMins}
                                        onChange={e => setWiz(prev => ({ ...prev, commuteMins: +e.target.value }))}
                                        className="w-full accent-[var(--accent)]"
                                    />
                                    <div className="flex justify-between text-xs opacity-40 mt-1">
                                        <span>5 min</span><span>120 min</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* ── Step 4: Confirm ── */}
                    {step === 4 && (
                        <div className="flex flex-col gap-3">
                            {[
                                { period: "BRAHMA KALA", color: "var(--accent)", desc: `${wiz.anchors.wakeTime} → ${wiz.anchors.workStartTime} · Morning growth block` },
                                { period: "KARMA KALA",  color: "#3B82F6",        desc: `${wiz.anchors.workStartTime} → ${wiz.anchors.workEndTime} · Action & work block` },
                                { period: "VISHRAMA KALA", color: "var(--success)", desc: `${wiz.anchors.workEndTime} → ${wiz.anchors.sleepTargetTime} · Rest & recovery` },
                            ].map(p => (
                                <div key={p.period} className="p-4 rounded-2xl bg-theme-card border border-theme-border flex items-center gap-4">
                                    <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: p.color }} />
                                    <div>
                                        <div className="font-black text-sm tracking-wider" style={{ color: p.color }}>{p.period}</div>
                                        <div className="text-xs opacity-60 mt-0.5">{p.desc}</div>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 rounded-2xl bg-theme-card border border-theme-border text-sm opacity-60 text-center">
                                Role: <strong>{wiz.role}</strong> · Goal: <strong>{wiz.goal?.replace("_", " ")}</strong>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex gap-3 mt-8 w-full max-w-md">
                {step > 0 && (
                    <button
                        onClick={back}
                        className="flex-1 py-4 rounded-2xl border border-theme-border text-theme-text font-bold transition-all hover:opacity-80"
                    >
                        BACK
                    </button>
                )}
                {step < 4 ? (
                    <button
                        onClick={next}
                        disabled={!canAdvance}
                        className="flex-1 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                        style={{ background: "var(--accent)" }}
                    >
                        NEXT <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="flex-1 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ background: "var(--accent)" }}
                    >
                        {saving ? "ACTIVATING..." : "ACTIVATE SCHEDULE"}
                    </button>
                )}
            </div>
        </div>
    );
}
