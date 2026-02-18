"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Target, ArrowRight, Plus, Command } from "lucide-react";
import { useFocus } from "@/context/FocusContext";

export default function CommandView() {
    const { state, createTapTarget, setActiveTapId, setViewMode, setActiveMissionId } = useFocus();
    const router = useRouter();

    const activeMissions = Object.values(state.missions);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500 p-3 pb-24 md:p-6 md:pb-20">

            {/* HEADER */}
            <header className="flex items-center justify-between pt-1 mb-2 md:pt-2 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-[#F78320]/10 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-[#F78320]/20 text-[#F78320]">
                        <Command className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h1 className="text-base md:text-xl font-bold tracking-tight text-theme-text uppercase">COMMAND CENTER</h1>
                </div>
            </header>

            {/* 1. TAP TARGETS */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold tracking-widest text-theme-text opacity-60 uppercase">Tap Targets</h2>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={createTapTarget}
                        className="text-[10px] font-bold text-[#F78320] bg-[#F78320]/10 border border-[#F78320]/20 px-3 py-1.5 rounded-lg hover:bg-[#F78320] hover:text-white transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-3 h-3" />
                        NEW
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.tapTargets && Object.keys(state.tapTargets).length > 0 ? (
                        Object.values(state.tapTargets).map((target: any) => (
                            <motion.div
                                key={target.id}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => { setActiveTapId(target.id); setViewMode("tap"); }}
                                className="bg-theme-card p-4 rounded-xl border border-theme-border cursor-pointer hover:border-[#F78320]/30 transition-all flex items-center justify-between group shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-[#F78320]/10 group-hover:text-[#F78320] transition-colors">
                                        <Zap className="w-5 h-5" fill="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-theme-text leading-tight">{target.title}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="h-1.5 w-16 bg-black/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 group-hover:bg-[#F78320] transition-colors"
                                                    style={{ width: `${Math.min(100, (target.count / target.target) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-theme-text opacity-50 font-bold uppercase tracking-wide">
                                                {target.count} / {target.target}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <ArrowRight className="w-4 h-4 text-theme-text opacity-20 group-hover:translate-x-1 transition-transform" />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-1 md:col-span-2 text-center py-10 bg-theme-card/30 rounded-xl border border-dashed border-theme-border/50 flex flex-col items-center justify-center gap-2 opacity-60">
                            <Zap className="w-6 h-6 text-theme-text/20" />
                            <p className="text-theme-text font-medium text-xs">No active tap targets.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. ACTIVE PROTOCOLS */}
            <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold tracking-widest text-theme-text opacity-60 uppercase">Active Protocols</h2>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push("/new-challenge")}
                        className="text-[10px] font-bold text-[#F78320] bg-[#F78320]/10 border border-[#F78320]/20 px-3 py-1.5 rounded-lg hover:bg-[#F78320] hover:text-white transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-3 h-3" />
                        NEW
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => { setActiveMissionId(mission.id); setViewMode("mission"); }}
                                    className="bg-theme-card p-4 rounded-xl border border-theme-border cursor-pointer hover:border-[#F78320]/30 transition-all group flex flex-col gap-3 shadow-sm"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-[#F78320]/10 group-hover:text-[#F78320] transition-colors">
                                                <Target className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-theme-text leading-tight">{mission.config.name}</h3>
                                                <p className="text-[10px] text-theme-text opacity-50 font-bold uppercase tracking-wide">
                                                    Day {dayNumber} / {mission.config.duration}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-theme-text opacity-20 group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-theme-text opacity-40">
                                            <span>Progress</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#F78320] group-hover:bg-[#F78320]"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-1 md:col-span-2 text-center py-10 bg-theme-card/30 rounded-xl border border-dashed border-theme-border/50 flex flex-col items-center justify-center gap-2 opacity-60">
                            <Target className="w-6 h-6 text-theme-text/20" />
                            <p className="text-theme-text opacity-40 font-medium text-xs">No active protocols.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
