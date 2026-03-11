"use client";

import { useFocus } from "@/context/FocusContext";
import ActiveMissionView from "@/components/ActiveMissionView";
import TapCounter from "@/components/TapCounter";
import TapTargetConfig from "@/components/TapTargetConfig";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShieldAlert, AlertTriangle } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import ScheduleAgentView from "@/components/ScheduleAgentView";
import NotificationToast from "@/components/NotificationToast";
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
        updateTapTarget,
        studyBlockMissed,
        acknowledgeStudyMiss,
    } = useFocus();

    // Show splash only once per browser session
    const [showSplash, setShowSplash] = useState(() => {
        if (typeof window === "undefined") return true;
        if (sessionStorage.getItem("fp_splash_shown")) return false;
        sessionStorage.setItem("fp_splash_shown", "1");
        return true;
    });

    return (
        <>
            {/* Global toast notifications — always rendered on top */}
            <NotificationToast />

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
                        initialCount={state.tapTargets[activeTapId].count}
                        title={state.tapTargets[activeTapId].title}
                        theme={state.tapTargets[activeTapId].theme}
                        icon={state.tapTargets[activeTapId].icon}
                        onClose={() => setViewMode("dashboard")}
                        onProgress={(count) => updateTapTarget(activeTapId, count)}
                        onComplete={(stats) => {
                            updateTapTarget(activeTapId, stats.totalTaps);
                            setViewMode("dashboard");
                        }}
                    />
                )}
            </AnimatePresence>

            {/* NEXUS SCHEDULE AGENT */}
            <AnimatePresence>
                {viewMode === "schedule_agent" && (
                    <ScheduleAgentView onClose={() => setViewMode("dashboard")} />
                )}
            </AnimatePresence>

            {/* STUDY BLOCK MISSED WARNING */}
            <AnimatePresence>
                {studyBlockMissed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#1E1A17] rounded-[2.5rem] p-8 max-w-md w-full text-center"
                            style={{ border: "2px solid var(--danger)" }}
                        >
                            <AlertTriangle className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: "var(--danger)" }} />
                            <h2 className="text-2xl font-black mb-2 text-white uppercase">Study Block Missed</h2>
                            <p className="text-white/60 mb-2">Your 12:00–2:00 PM study window has passed.</p>
                            <p className="text-white/40 text-sm mb-6">+30 minute penalty added to tomorrow's session.</p>
                            <button
                                onClick={acknowledgeStudyMiss}
                                className="w-full py-4 rounded-2xl font-bold text-white hover:scale-[1.02] transition-transform"
                                style={{ background: "var(--danger)" }}
                            >
                                ACKNOWLEDGED
                            </button>
                        </motion.div>
                    </motion.div>
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
