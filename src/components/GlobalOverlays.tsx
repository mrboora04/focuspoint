"use client";

import { useFocus } from "@/context/FocusContext";
import ActiveMissionView from "@/components/ActiveMissionView";
import TapCounter from "@/components/TapCounter";
import TapTargetConfig from "@/components/TapTargetConfig";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShieldAlert } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { useState } from "react";

export default function GlobalOverlays() {
    const {
        state,
        viewMode,
        setViewMode,
        activeMission,
        activeTapId,
        missedDate,
        showMercyAlert,
        handlePenalty,
        acknowledgeMercy,
        addTask,
        completeTask,
        createTapTarget,
        updateTapTarget
    } = useFocus();

    const [showSplash, setShowSplash] = useState(true);

    return (
        <>
            <AnimatePresence>
                {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
            </AnimatePresence>

            {/* ACTIVE MISSION OVERLAY */}
            <AnimatePresence>
                {viewMode === "mission" && activeMission && (
                    <ActiveMissionView
                        mission={activeMission}
                        onClose={() => setViewMode("dashboard")}
                        onCompleteTask={completeTask}
                        onAddTask={addTask}
                    />
                )}
            </AnimatePresence>

            {/* TAP TARGET CONFIG */}
            <AnimatePresence>
                {viewMode === "tap_config" && (
                    <TapTargetConfig
                        onStart={(config) => createTapTarget(config)}
                        onClose={() => setViewMode("dashboard")}
                    />
                )}
            </AnimatePresence>

            {/* TAP COUNTER OVERLAY */}
            <AnimatePresence>
                {viewMode === "tap" && activeTapId && state.tapTargets[activeTapId] && (
                    <TapCounter
                        target={state.tapTargets[activeTapId].target}
                        title={state.tapTargets[activeTapId].title}
                        theme={state.tapTargets[activeTapId].theme}
                        icon={state.tapTargets[activeTapId].icon}
                        onClose={() => setViewMode("dashboard")}
                        onComplete={(stats) => updateTapTarget(activeTapId, stats.totalTaps)}
                    />
                )}
            </AnimatePresence>

            {/* MERCY / PENALTY ALERTS */}
            <AnimatePresence>
                {missedDate && activeMission && (
                    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        {showMercyAlert ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#1E1A17] border-2 border-blue-500 rounded-[2.5rem] p-8 max-w-md w-full text-center"
                            >
                                <Heart className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" fill="currentColor" />
                                <h2 className="text-2xl font-black mb-2 text-white uppercase">Mercy Applied</h2>
                                <p className="text-white/60 mb-6">Buffer Day Consumed.</p>
                                <button
                                    onClick={acknowledgeMercy}
                                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold hover:scale-[1.02] transition-transform"
                                >
                                    ACKNOWLEDGE
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#1E1A17] border-2 border-red-500 rounded-[2.5rem] p-8 max-w-md w-full text-center"
                            >
                                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                                <h2 className="text-2xl font-black mb-2 text-white uppercase">Protocol Breach</h2>
                                <p className="text-white/60 mb-6">No lives remaining.</p>
                                <button
                                    onClick={handlePenalty}
                                    className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold hover:scale-[1.02] transition-transform"
                                >
                                    ACCEPT FAILURE
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
