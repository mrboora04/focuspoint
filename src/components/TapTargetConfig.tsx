"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Target, Zap, Dumbbell, BookOpen, Brain,
    Briefcase, Coffee, Music, Sun, Moon, Star,
    Flame, Droplets, Leaf, Palette
} from "lucide-react";

interface TapTargetConfigProps {
    onStart: (config: { title: string; target: number; theme: string; icon: string }) => void;
    onClose: () => void;
}

export const THEMES = [
    { id: "ember", name: "Ember", color: "#F78320", bg: "from-orange-500/20 to-red-500/5", ring: "text-orange-500" },
    { id: "ocean", name: "Ocean", color: "#3B82F6", bg: "from-blue-500/20 to-cyan-500/5", ring: "text-blue-500" },
    { id: "forest", name: "Forest", color: "#10B981", bg: "from-emerald-500/20 to-teal-500/5", ring: "text-emerald-500" },
    { id: "royal", name: "Royal", color: "#8B5CF6", bg: "from-violet-500/20 to-purple-500/5", ring: "text-violet-500" },
    { id: "cherry", name: "Cherry", color: "#EC4899", bg: "from-pink-500/20 to-rose-500/5", ring: "text-pink-500" },
    { id: "gold", name: "Gold", color: "#EAB308", bg: "from-yellow-500/20 to-amber-500/5", ring: "text-yellow-500" },
];

export const ICONS = [
    { id: "target", icon: Target },
    { id: "zap", icon: Zap },
    { id: "dumbbell", icon: Dumbbell },
    { id: "book", icon: BookOpen },
    { id: "brain", icon: Brain },
    { id: "briefcase", icon: Briefcase },
    { id: "coffee", icon: Coffee },
    { id: "music", icon: Music },
    { id: "sun", icon: Sun },
    { id: "moon", icon: Moon },
    { id: "star", icon: Star },
    { id: "flame", icon: Flame },
];

export default function TapTargetConfig({ onStart, onClose }: TapTargetConfigProps) {
    const [title, setTitle] = useState("New Target");
    const [target, setTarget] = useState(100);
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0].id);

    const handleStart = () => {
        if (!title.trim() || target <= 0) return;
        onStart({
            title,
            target,
            theme: selectedTheme.id,
            icon: selectedIcon
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] bg-theme-bg/95 backdrop-blur-3xl overflow-y-auto flex items-center justify-center p-4 content-center"
        >
            <div className="w-full max-w-md space-y-8 relative">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-black text-theme-text uppercase tracking-tight">Setup Target</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-theme-card rounded-full text-theme-text/50 hover:text-theme-text hover:bg-theme-card/80 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Preview Card */}
                <div className={`
                    p-6 rounded-3xl border border-white/10 relative overflow-hidden transition-colors duration-500
                    bg-gradient-to-br ${selectedTheme.bg} mb-6
                `}>
                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-300"
                            style={{ backgroundColor: selectedTheme.color }}
                        >
                            {(() => {
                                const IconObj = ICONS.find(i => i.id === selectedIcon);
                                const Icon = IconObj ? IconObj.icon : Target;
                                return <Icon className="w-8 h-8" strokeWidth={2.5} />;
                            })()}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-theme-text leading-none mb-1">
                                {target}
                            </h3>
                            <p className="text-sm font-bold text-theme-text/60 uppercase tracking-widest">
                                {title || "Untitled"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">

                    {/* Input: Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-theme-text/40 uppercase tracking-widest pl-1">Name</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-theme-card p-4 rounded-2xl font-bold text-theme-text outline-none border border-transparent focus:border-theme-border transition-colors placeholder:text-theme-text/20"
                            placeholder="e.g. Pushups"
                        />
                    </div>

                    {/* Input: Target */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-theme-text/40 uppercase tracking-widest pl-1 flex justify-between">
                            <span>Target Count</span>
                            <span className="text-theme-text">{target}</span>
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="500"
                            step="5"
                            value={target}
                            onChange={(e) => setTarget(parseInt(e.target.value))}
                            className="w-full cursor-pointer h-2 bg-theme-card rounded-lg appearance-none"
                            style={{ accentColor: selectedTheme.color }}
                        />
                        <div className="flex justify-between text-[10px] font-bold text-theme-text/30 uppercase tracking-widest px-1">
                            <span>10</span>
                            <span>250</span>
                            <span>500</span>
                        </div>
                    </div>

                    {/* Selector: Theme */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-theme-text/40 uppercase tracking-widest pl-1">Style</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => setSelectedTheme(theme)}
                                    className={`
                                        w-12 h-12 rounded-full shrink-0 flex items-center justify-center border-2 transition-all
                                        ${selectedTheme.id === theme.id ? 'scale-110 border-theme-text shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}
                                    `}
                                    style={{ backgroundColor: theme.color }}
                                >
                                    {selectedTheme.id === theme.id && <Palette className="w-5 h-5 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selector: Icon */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-theme-text/40 uppercase tracking-widest pl-1">Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ICONS.map(({ id, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedIcon(id)}
                                    className={`
                                        aspect-square rounded-xl flex items-center justify-center transition-all bg-theme-card
                                        ${selectedIcon === id
                                            ? `text-white ring-2 ring-offset-2 ring-offset-theme-bg shadow-lg`
                                            : 'text-theme-text/40 hover:text-theme-text hover:bg-theme-card/80'
                                        }
                                    `}
                                    style={selectedIcon === id ? { backgroundColor: selectedTheme.color, boxShadow: `0 0 0 2px ${selectedTheme.color}` } : {}}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    className="w-full py-4 mt-6 rounded-2xl bg-theme-text text-theme-bg font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    style={{ backgroundColor: selectedTheme.color, color: 'white' }}
                >
                    Start Focus
                </button>

            </div>
        </motion.div>
    );
}
