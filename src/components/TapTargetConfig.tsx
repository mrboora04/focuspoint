"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    X, Target, Zap, Dumbbell, BookOpen, Brain,
    Briefcase, Coffee, Music, Sun, Moon, Star,
    Flame, Check
} from "lucide-react";

interface TapTargetConfigProps {
    onStart: (config: { title: string; target: number; theme: string; icon: string }) => void;
    onClose: () => void;
}

export const THEMES = [
    { id: "ember",  name: "Ember",  color: "#F78320" },
    { id: "ocean",  name: "Ocean",  color: "#3B82F6" },
    { id: "forest", name: "Forest", color: "#10B981" },
    { id: "royal",  name: "Royal",  color: "#8B5CF6" },
    { id: "cherry", name: "Cherry", color: "#EC4899" },
    { id: "gold",   name: "Gold",   color: "#EAB308" },
];

export const ICONS = [
    { id: "target",    icon: Target },
    { id: "zap",       icon: Zap },
    { id: "dumbbell",  icon: Dumbbell },
    { id: "book",      icon: BookOpen },
    { id: "brain",     icon: Brain },
    { id: "briefcase", icon: Briefcase },
    { id: "coffee",    icon: Coffee },
    { id: "music",     icon: Music },
    { id: "sun",       icon: Sun },
    { id: "moon",      icon: Moon },
    { id: "star",      icon: Star },
    { id: "flame",     icon: Flame },
];

// Preset quick targets
const PRESETS = [25, 50, 100, 200, 500];

export default function TapTargetConfig({ onStart, onClose }: TapTargetConfigProps) {
    const [title, setTitle] = useState("");
    const [target, setTarget] = useState(100);
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0].id);

    const handleStart = () => {
        const finalTitle = title.trim() || "New Target";
        onStart({ title: finalTitle, target, theme: selectedTheme.id, icon: selectedIcon });
    };

    const SelectedIconComp = ICONS.find(i => i.id === selectedIcon)?.icon || Target;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="relative w-full sm:max-w-md bg-[#1C1815] rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden border border-white/8 shadow-2xl"
            >
                {/* Accent top bar */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${selectedTheme.color}, ${selectedTheme.color}60)` }} />

                {/* Live preview strip */}
                <div
                    className="px-6 pt-6 pb-5 flex items-center gap-4 border-b border-white/6 transition-colors duration-300"
                    style={{ background: `linear-gradient(135deg, ${selectedTheme.color}12, transparent)` }}
                >
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-colors duration-300"
                        style={{ background: `${selectedTheme.color}25`, boxShadow: `0 0 24px ${selectedTheme.color}30` }}
                    >
                        <SelectedIconComp className="w-7 h-7" style={{ color: selectedTheme.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-lg leading-none truncate">
                            {title || "New Target"}
                        </p>
                        <p className="text-white/40 text-sm font-bold mt-0.5">
                            <span style={{ color: selectedTheme.color }}>{target}</span> taps to complete
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-all flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Name */}
                    <div>
                        <label className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-2 block">Name</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Push-ups, Deep work..."
                            className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>

                    {/* Target count */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black tracking-widest uppercase text-white/30">Target Reps</label>
                            <input
                                type="number"
                                value={target}
                                onChange={(e) => setTarget(Math.max(1, Math.min(9999, parseInt(e.target.value) || 1)))}
                                className="w-20 bg-white/5 border border-white/8 rounded-lg px-2 py-1 text-white font-black text-center text-sm focus:outline-none focus:border-white/20 transition-colors"
                                style={{ color: selectedTheme.color }}
                            />
                        </div>
                        {/* Quick presets */}
                        <div className="flex gap-2 mb-3">
                            {PRESETS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setTarget(p)}
                                    className="flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all border"
                                    style={target === p ? {
                                        background: `${selectedTheme.color}20`,
                                        borderColor: `${selectedTheme.color}50`,
                                        color: selectedTheme.color
                                    } : {
                                        background: 'rgba(255,255,255,0.04)',
                                        borderColor: 'rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.35)'
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="999"
                            step="1"
                            value={Math.min(target, 999)}
                            onChange={(e) => setTarget(parseInt(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: selectedTheme.color, background: `linear-gradient(to right, ${selectedTheme.color} ${(Math.min(target, 999) / 999) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                        />
                    </div>

                    {/* Color theme */}
                    <div>
                        <label className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-3 block">Color</label>
                        <div className="grid grid-cols-6 gap-2">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTheme(t)}
                                    className="aspect-square rounded-xl flex items-center justify-center transition-all relative"
                                    style={{
                                        background: `${t.color}25`,
                                        border: selectedTheme.id === t.id
                                            ? `2px solid ${t.color}`
                                            : '2px solid transparent',
                                        boxShadow: selectedTheme.id === t.id ? `0 0 14px ${t.color}40` : 'none'
                                    }}
                                    title={t.name}
                                >
                                    <div
                                        className="w-5 h-5 rounded-full transition-all"
                                        style={{ background: t.color, transform: selectedTheme.id === t.id ? 'scale(0.7)' : 'scale(1)' }}
                                    />
                                    {selectedTheme.id === t.id && (
                                        <Check className="absolute w-3 h-3 text-white" strokeWidth={3} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-3 block">Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ICONS.map(({ id, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedIcon(id)}
                                    className="aspect-square rounded-xl flex items-center justify-center transition-all"
                                    style={selectedIcon === id ? {
                                        background: `${selectedTheme.color}25`,
                                        border: `2px solid ${selectedTheme.color}60`,
                                        color: selectedTheme.color,
                                        boxShadow: `0 0 12px ${selectedTheme.color}25`
                                    } : {
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '2px solid rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.3)'
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 pt-2">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleStart}
                        className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${selectedTheme.color}, ${selectedTheme.color}cc)`,
                            boxShadow: `0 8px 32px ${selectedTheme.color}40`
                        }}
                    >
                        Create Target →
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
