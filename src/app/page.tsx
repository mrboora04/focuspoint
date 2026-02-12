"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import ActiveMissionView from "@/components/ActiveMissionView";
import SplashScreen from "@/components/SplashScreen";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, ShieldAlert, ArrowRight } from "lucide-react";

// --- TYPES ---
interface Task {
  id: number;
  title: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed";
}

interface MissionData {
  id: string;
  config: {
    name: string;
    duration: number;
    dailyTarget: number;
    startDate: string;
    dailyHabits?: string[];
    penaltyType?: string;
    penaltyDetail?: string;
    bufferDays?: number; // MERCY
  };
  tasks: Task[];
  history: { [date: string]: "completed" | "failed" | "skipped" | undefined };
  dailyLog: { [date: string]: { tasks: any[] } };
  todayScore: number;
  scoreDate: string;
}

interface AppState {
  activeMissionId: string | null;
  missions: { [id: string]: MissionData };
}

const STORAGE_KEY = "focuspoint_v1";

const INITIAL_STATE: AppState = {
  activeMissionId: null,
  missions: {}
};

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [viewMode, setViewMode] = useState<"dashboard" | "mission">("dashboard");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [missedDate, setMissedDate] = useState<string | null>(null);
  const [showMercyAlert, setShowMercyAlert] = useState(false);

  // 1. LOAD STATE & THEME
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) setState(JSON.parse(savedState));

    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    setIsLoaded(true);
  }, []);

  // 2. SAVE STATE
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const activeMission = state.activeMissionId ? state.missions[state.activeMissionId] : null;

  // 3. AUTO-POPULATE & MISSED DAY CHECK
  useEffect(() => {
    if (!activeMission || viewMode === "dashboard") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const startDate = new Date(activeMission.config.startDate);

    let missionUpdates: Partial<MissionData> = {};

    let checkDate = new Date(startDate);
    checkDate.setHours(0, 0, 0, 0);
    let foundMissed = null;

    while (checkDate < today) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (!activeMission.history[dateStr] && dateStr !== activeMission.scoreDate) {
        foundMissed = dateStr;
        break;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    if (foundMissed) {
      const remainingBuffer = activeMission.config.bufferDays || 0;
      if (remainingBuffer > 0) {
        const newHistory = { ...activeMission.history, [foundMissed]: "skipped" as const };
        const newConfig = { ...activeMission.config, bufferDays: remainingBuffer - 1 };

        updateActiveMission({ history: newHistory, config: newConfig });
        setMissedDate(foundMissed);
        setShowMercyAlert(true);
      } else {
        setMissedDate(foundMissed);
        setShowMercyAlert(false);
      }
    }

    if (activeMission.scoreDate !== todayStr) {
      const habits = activeMission.config.dailyHabits || [];
      const autoTasks: Task[] = habits.map((habit, idx) => ({
        id: Date.now() + idx,
        title: habit,
        priority: "High",
        status: "pending"
      }));

      missionUpdates = {
        todayScore: 0,
        scoreDate: todayStr,
        tasks: [...autoTasks, ...activeMission.tasks.filter(t => t.status === "pending")]
      };
    }

    if (Object.keys(missionUpdates).length > 0) {
      updateActiveMission(missionUpdates);
    }
  }, [state.activeMissionId, viewMode]);

  const updateActiveMission = (updates: Partial<MissionData>) => {
    if (!state.activeMissionId) return;
    setState(prev => ({
      ...prev,
      missions: {
        ...prev.missions,
        [prev.activeMissionId!]: {
          ...prev.missions[prev.activeMissionId!],
          ...updates
        }
      }
    }));
  };

  const handleSelectMission = (id: string) => {
    if (id === "new") {
      router.push("/new-challenge");
    } else {
      setState(prev => ({ ...prev, activeMissionId: id }));
      setViewMode("mission"); // Zoom In
    }
  };

  const completeTask = (id: number, points: number) => {
    if (missedDate && !showMercyAlert || !activeMission) return;

    const task = activeMission.tasks.find(t => t.id === id);
    if (!task) return;

    const newScore = activeMission.todayScore + points;

    if (task.priority === "High" || (newScore >= activeMission.config.dailyTarget && activeMission.todayScore < activeMission.config.dailyTarget)) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F78320', '#EFE0C8', '#ffffff']
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const newLog = { ...activeMission.dailyLog };
    if (!newLog[today]) newLog[today] = { tasks: [] };

    newLog[today].tasks.push({
      title: task.title,
      points,
      time: new Date().toLocaleTimeString(),
      priority: task.priority
    });

    const newHistory = { ...activeMission.history };
    if (newScore >= activeMission.config.dailyTarget) {
      newHistory[today] = "completed";
    }

    updateActiveMission({
      todayScore: newScore,
      tasks: activeMission.tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t),
      dailyLog: newLog,
      history: newHistory
    });
  };

  const handleRestart = () => {
    if (!activeMission) return;
    const freshMission: MissionData = {
      ...activeMission,
      config: { ...activeMission.config, startDate: new Date().toISOString() },
      tasks: [],
      history: {},
      dailyLog: {},
      todayScore: 0
    };
    setState(prev => ({
      ...prev,
      missions: { ...prev.missions, [activeMission.id]: freshMission }
    }));
    setMissedDate(null);
  };

  const handlePenalty = () => {
    if (!missedDate || !activeMission) return;
    const newHistory = { ...activeMission.history, [missedDate]: "failed" as const };
    updateActiveMission({ history: newHistory });
    setMissedDate(null);
  };

  if (!isLoaded) return <div className="min-h-screen bg-theme-bg" />;

  return (
    <main className="min-h-screen bg-theme-bg overflow-hidden relative selection:bg-[#F78320]/30 touch-manipulation">

      {/* 0. SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* 1. DASHBOARD LAYER (Always mounted, scales down when zoomed out) */}
      <motion.div
        animate={{
          scale: viewMode === "mission" ? 0.9 : 1,
          opacity: viewMode === "mission" ? 0.5 : 1,
          filter: viewMode === "mission" ? "blur(10px)" : "blur(0px)"
        }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <Dashboard state={state} onSelectMission={handleSelectMission} />
      </motion.div>

      {/* 2. DYNAMIC ISLAND (Bottom Trigger) */}
      <AnimatePresence>
        {activeMission && viewMode === "dashboard" && !showSplash && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm"
          >
            <motion.button
              onClick={() => setViewMode("mission")}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="w-full bg-[#1E1A17]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl shadow-black/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F78320] rounded-full flex items-center justify-center font-bold text-white text-lg">
                  {activeMission.todayScore}
                </div>
                <div className="text-left">
                  <p className="text-[#EFE0C8] font-black uppercase text-sm">{activeMission.config.name}</p>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Tap to Execute</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                <ArrowRight className="text-[#F78320] w-5 h-5" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ACTIVE MISSION OVERLAY (Zoomed In) */}
      <AnimatePresence>
        {viewMode === "mission" && activeMission && (
          <ActiveMissionView
            mission={activeMission}
            onClose={() => setViewMode("dashboard")}
            onCompleteTask={completeTask}
          />
        )}
      </AnimatePresence>

      {/* 4. ALERTS (Mercy/Penalty) */}
      <AnimatePresence>
        {missedDate && activeMission && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            {showMercyAlert ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1E1A17] border-2 border-blue-500 rounded-[2.5rem] p-8 max-w-md w-full text-center"
              >
                <Heart className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" fill="currentColor" />
                <h2 className="text-2xl font-black mb-2 text-white uppercase">Mercy Applied</h2>
                <p className="text-white/60 mb-6">Buffer Day Consumed.</p>
                <button onClick={() => { setMissedDate(null); setShowMercyAlert(false); }} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold">ACKNOWLEDGE</button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1E1A17] border-2 border-red-500 rounded-[2.5rem] p-8 max-w-md w-full text-center"
              >
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-black mb-2 text-white uppercase">Protocol Breach</h2>
                <p className="text-white/60 mb-6">No lives remaining.</p>
                <button onClick={handlePenalty} className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold">ACCEPT FAILURE</button>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}