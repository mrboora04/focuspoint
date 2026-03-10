"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFocus } from "@/context/FocusContext";
import LifestyleWizard from "@/components/LifestyleWizard";
import ScheduleBlockCard from "@/components/ScheduleBlockCard";
import { generateDailySchedule, findCurrentBlock, currentTimeHHMM } from "@/lib/scheduleEngine";
import type { DailySchedule, TriKalaPeriod, CustomBlockDefinition, BlockType } from "@/types/schedule";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Trash2, Save, X, AlertTriangle } from "lucide-react";

const PERIOD_META: Record<TriKalaPeriod, { label: string; subtitle: string; barClass: string }> = {
    brahma: { label: "Brahma Kala", subtitle: "Growth · Study · Planning", barClass: "period-brahma-bar" },
    karma: { label: "Karma Kala", subtitle: "Action · Work · Execution", barClass: "period-karma-bar" },
    vishrama: { label: "Vishrama Kala", subtitle: "Rest · Recovery · Wind Down", barClass: "period-vishrama-bar" },
};

const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string; icon: string }[] = [
    { value: "study",     label: "Study",     icon: "📚" },
    { value: "work",      label: "Work",      icon: "💼" },
    { value: "meal",      label: "Meal",      icon: "🍽️" },
    { value: "free",      label: "Free Time", icon: "🎯" },
    { value: "custom",    label: "Custom",    icon: "⬜" },
    { value: "commute",   label: "Commute",   icon: "🚌" },
    { value: "wind_down", label: "Wind Down", icon: "🌙" },
];

const ANCHOR_LABELS: Record<string, string> = {
    wakeTime:        "Wake Up",
    breakfastTime:   "Breakfast",
    lunchTime:       "Lunch",
    dinnerTime:      "Dinner",
    workStartTime:   "Work / Study Start",
    workEndTime:     "Work / Study End",
    sleepTargetTime: "Sleep Target",
};

export default function ScheduleView() {
    const { scheduleProfile, state, setStudyBlockMissed, saveScheduleProfile, deleteScheduleProfile } = useFocus();
    const [now, setNow] = useState(currentTimeHHMM());
    const nowRef = useRef<HTMLDivElement | null>(null);
    const firedBlockIds = useRef<Set<string>>(new Set());

    // ── Edit mode state ──────────────────────────────────────
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAnchors, setEditAnchors] = useState<Record<string, string>>({});
    const [editCustomBlocks, setEditCustomBlocks] = useState<CustomBlockDefinition[]>([]);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // New custom block form
    const [newBlockLabel, setNewBlockLabel] = useState("");
    const [newBlockStart, setNewBlockStart] = useState("09:00");
    const [newBlockEnd, setNewBlockEnd] = useState("10:00");
    const [newBlockType, setNewBlockType] = useState<BlockType>("custom");

    const openEdit = () => {
        if (!scheduleProfile) return;
        setEditName(scheduleProfile.name ?? "");
        setEditAnchors({ ...scheduleProfile.anchors });
        setEditCustomBlocks(scheduleProfile.customBlocks ? [...scheduleProfile.customBlocks] : []);
        setConfirmDelete(false);
        setEditOpen(true);
    };

    const closeEdit = () => {
        setEditOpen(false);
        setConfirmDelete(false);
    };

    const handleSave = async () => {
        if (!scheduleProfile) return;
        setSaving(true);
        await saveScheduleProfile({
            ...scheduleProfile,
            name: editName.trim() || undefined,
            anchors: editAnchors as typeof scheduleProfile.anchors,
            customBlocks: editCustomBlocks,
            updatedAt: new Date().toISOString(),
        });
        setSaving(false);
        setEditOpen(false);
    };

    const handleDelete = async () => {
        await deleteScheduleProfile();
        setEditOpen(false);
        setConfirmDelete(false);
    };

    const addCustomBlock = () => {
        if (!newBlockLabel.trim()) return;
        const block: CustomBlockDefinition = {
            id: crypto.randomUUID(),
            label: newBlockLabel.trim(),
            startTime: newBlockStart,
            endTime: newBlockEnd,
            type: newBlockType,
        };
        setEditCustomBlocks(prev => [...prev, block]);
        setNewBlockLabel("");
        setNewBlockStart("09:00");
        setNewBlockEnd("10:00");
        setNewBlockType("custom");
    };

    const removeCustomBlock = (id: string) => {
        setEditCustomBlocks(prev => prev.filter(b => b.id !== id));
    };

    // ── Live schedule ─────────────────────────────────────────
    useEffect(() => {
        const id = setInterval(() => setNow(currentTimeHHMM()), 60_000);
        return () => clearInterval(id);
    }, []);

    const today = new Date().toISOString().split("T")[0];
    const activeMissionIds = Object.keys(state.missions).filter(id => {
        const m = state.missions[id];
        if (!m) return false;
        const startDate = new Date(m.config.startDate);
        const diffDays = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= m.config.duration;
    });

    const schedule: DailySchedule | null = useMemo(() => {
        if (!scheduleProfile) return null;
        return generateDailySchedule(scheduleProfile, activeMissionIds, today);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduleProfile, today]);

    useEffect(() => {
        if (!schedule) return;
        const check = () => {
            const nowMins = (() => {
                const [h, m] = now.split(":").map(Number);
                return h * 60 + m;
            })();
            const missed = schedule.blocks.find(b => {
                if (b.type !== "study" || b.isCompleted) return false;
                if (firedBlockIds.current.has(b.id)) return false;
                const [eh, em] = b.endTime.split(":").map(Number);
                const endMins = eh * 60 + em;
                return nowMins > endMins;
            });
            if (missed) {
                firedBlockIds.current.add(missed.id);
                setStudyBlockMissed(true);
            }
        };
        check();
        const id = setInterval(check, 5 * 60_000);
        return () => clearInterval(id);
    }, [schedule, now, setStudyBlockMissed]);

    useEffect(() => {
        if (nowRef.current) {
            nowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [schedule]);

    if (!scheduleProfile) return <LifestyleWizard />;
    if (!schedule) return null;

    const currentBlock = findCurrentBlock(schedule.blocks);
    const periods: TriKalaPeriod[] = ["brahma", "karma", "vishrama"];

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-theme-text/40 uppercase">
                        {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    <h1 className="text-3xl font-black text-theme-text uppercase tracking-wide mt-1">
                        {scheduleProfile.name || "Today's Grid"}
                    </h1>
                    {currentBlock && (
                        <p className="text-sm text-theme-text/50 mt-1">
                            Active: <span className="font-bold" style={{ color: "var(--accent)" }}>{currentBlock.label}</span>
                        </p>
                    )}
                </div>
                <button
                    onClick={openEdit}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-theme-border text-theme-text/60 hover:text-theme-text hover:border-theme-text/30 transition-all text-xs font-bold tracking-wider flex-shrink-0 mt-1"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>EDIT</span>
                </button>
            </div>

            {/* ── Inline Edit Panel ── */}
            <AnimatePresence>
                {editOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-theme-card border border-theme-border rounded-3xl p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-black text-theme-text tracking-wider text-sm uppercase">Edit Schedule</h2>
                                <button onClick={closeEdit} className="text-theme-text/40 hover:text-theme-text transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Schedule name */}
                            <div>
                                <label className="text-xs font-bold tracking-widest uppercase text-theme-text/40 block mb-2">
                                    Schedule Name
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="e.g. Student Grind, Work Mode…"
                                    className="w-full bg-transparent text-theme-text border border-theme-border rounded-xl px-4 py-3 text-sm outline-none focus:border-theme-text/40 transition-colors"
                                />
                            </div>

                            {/* Anchor times */}
                            <div>
                                <label className="text-xs font-bold tracking-widest uppercase text-theme-text/40 block mb-3">
                                    Daily Anchors
                                </label>
                                <div className="space-y-2">
                                    {Object.keys(editAnchors).map(key => (
                                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-theme-bg border border-theme-border">
                                            <span className="text-sm text-theme-text/80">{ANCHOR_LABELS[key] ?? key}</span>
                                            <input
                                                type="time"
                                                value={editAnchors[key]}
                                                onChange={e => setEditAnchors(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="bg-transparent text-theme-text font-mono text-sm outline-none border border-theme-border rounded-lg px-2 py-1"
                                                style={{ colorScheme: "dark" }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Custom blocks */}
                            <div>
                                <label className="text-xs font-bold tracking-widest uppercase text-theme-text/40 block mb-3">
                                    Custom Blocks ({editCustomBlocks.length})
                                </label>

                                {editCustomBlocks.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {editCustomBlocks.map(b => (
                                            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-theme-bg border border-theme-border">
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-theme-text">{b.label}</span>
                                                    <span className="text-xs text-theme-text/40 ml-2 font-mono">{b.startTime}–{b.endTime}</span>
                                                    <span className="text-xs text-theme-text/30 ml-1">({b.type})</span>
                                                </div>
                                                <button
                                                    onClick={() => removeCustomBlock(b.id)}
                                                    className="text-theme-text/30 hover:text-red-400 transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add block form */}
                                <div className="border border-dashed border-theme-border rounded-2xl p-4 space-y-3">
                                    <p className="text-xs font-bold tracking-widest uppercase text-theme-text/30">Add Custom Block</p>
                                    <input
                                        type="text"
                                        value={newBlockLabel}
                                        onChange={e => setNewBlockLabel(e.target.value)}
                                        placeholder="Block name…"
                                        className="w-full bg-transparent text-theme-text border border-theme-border rounded-xl px-3 py-2 text-sm outline-none"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-theme-text/40 tracking-wider uppercase">Start</label>
                                            <input
                                                type="time"
                                                value={newBlockStart}
                                                onChange={e => setNewBlockStart(e.target.value)}
                                                className="bg-transparent text-theme-text font-mono text-sm outline-none border border-theme-border rounded-xl px-3 py-2"
                                                style={{ colorScheme: "dark" }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-theme-text/40 tracking-wider uppercase">End</label>
                                            <input
                                                type="time"
                                                value={newBlockEnd}
                                                onChange={e => setNewBlockEnd(e.target.value)}
                                                className="bg-transparent text-theme-text font-mono text-sm outline-none border border-theme-border rounded-xl px-3 py-2"
                                                style={{ colorScheme: "dark" }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-theme-text/40 tracking-wider uppercase">Type</label>
                                            <select
                                                value={newBlockType}
                                                onChange={e => setNewBlockType(e.target.value as BlockType)}
                                                className="bg-theme-bg text-theme-text text-sm outline-none border border-theme-border rounded-xl px-2 py-2"
                                            >
                                                {BLOCK_TYPE_OPTIONS.map(o => (
                                                    <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={addCustomBlock}
                                        disabled={!newBlockLabel.trim()}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
                                        style={{ background: "var(--accent)", color: "#fff" }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Block
                                    </button>
                                </div>
                            </div>

                            {/* Save / Cancel */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-50"
                                    style={{ background: "var(--accent)" }}
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "SAVING…" : "SAVE CHANGES"}
                                </button>
                                <button
                                    onClick={closeEdit}
                                    className="px-4 py-3 rounded-2xl text-sm font-bold border border-theme-border text-theme-text/60 hover:text-theme-text transition-all"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* Danger zone */}
                            <div className="border-t border-theme-border/30 pt-4">
                                {!confirmDelete ? (
                                    <button
                                        onClick={() => setConfirmDelete(true)}
                                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete this schedule
                                    </button>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3"
                                    >
                                        <div className="flex items-center gap-2 text-red-400">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="text-xs font-bold">This will reset your schedule. Are you sure?</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleDelete}
                                                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
                                            >
                                                Yes, Delete
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(false)}
                                                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-theme-border text-theme-text/60"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Periods */}
            {periods.map(period => {
                const meta = PERIOD_META[period];
                const blocks = schedule.blocks.filter(b => b.period === period);
                if (blocks.length === 0) return null;

                return (
                    <section key={period} className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full flex-shrink-0 ${meta.barClass}`} />
                            <div>
                                <h2 className="font-black text-sm tracking-widest uppercase text-theme-text">{meta.label}</h2>
                                <p className="text-xs text-theme-text/40">{meta.subtitle}</p>
                            </div>
                            <div className="flex-1 h-px bg-theme-border ml-2" />
                        </div>

                        <div className="space-y-2 pl-5">
                            {blocks.map((block, i) => {
                                const isNow = currentBlock?.id === block.id;
                                return (
                                    <div key={block.id} ref={isNow ? nowRef : null}>
                                        <ScheduleBlockCard block={block} isNow={isNow} index={i} />
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
