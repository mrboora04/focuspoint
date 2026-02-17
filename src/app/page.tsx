"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import ActiveMissionView from "@/components/ActiveMissionView";
import SplashScreen from "@/components/SplashScreen";
import TapCounter from "@/components/TapCounter";
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

interface TapTarget {
  id: string;
  title: string;
  target: number;
  count: number;
  totalTime?: number;
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
    penaltyDetail?: string; // e.g. "Donate $50"
    bufferDays?: number; // MERCY
    frequency?: "daily" | "selected";
    selectedDays?: number[]; // 0=Sun, 6=Sat
  };
  tasks: Task[];
  history: { [date: string]: "completed" | "failed" | "skipped" | "rest" | undefined };
  dailyLog: { [date: string]: { tasks: any[] } };
  todayScore: number;
  scoreDate: string;
}

interface AppState {
  activeMissionId: string | null;
  missions: { [id: string]: MissionData };
  tapTargets: { [id: string]: TapTarget };
}

const STORAGE_KEY = "focuspoint_v1";

const INITIAL_STATE: AppState = {
  activeMissionId: null,
  missions: {},
  tapTargets: {}
};

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [viewMode, setViewMode] = useState<"dashboard" | "mission" | "tap">("dashboard");
  const [activeTapId, setActiveTapId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [missedDate, setMissedDate] = useState<string | null>(null);
  const [showMercyAlert, setShowMercyAlert] = useState(false);

  // 1. LOAD STATE & THEME
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Migration/Safety check for new field
      if (!parsed.tapTargets) parsed.tapTargets = {};
      setState(parsed);
    }

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

    // Check for missed days
    while (checkDate < today) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay();

      // Respect frequency for missed days
      const isScheduledDay = activeMission.config.frequency === "selected"
        ? activeMission.config.selectedDays?.includes(dayOfWeek)
        : true;

      if (!activeMission.history[dateStr] && dateStr !== activeMission.scoreDate) {
        if (isScheduledDay) {
          foundMissed = dateStr;
          break; // Found a failure
        } else {
          // It was a rest day, mark it as such to avoid checking again
          // But we can't mutate state in loop directly, we rely on the final update
          // Actually, let's just ignore if it's not scheduled.
        }
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

    // New Day Generation
    if (activeMission.scoreDate !== todayStr) {
      const dayOfWeek = today.getDay();
      const isScheduledDay = activeMission.config.frequency === "selected"
        ? activeMission.config.selectedDays?.includes(dayOfWeek)
        : true;

      if (isScheduledDay) {
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
      } else {
        // Rest Day
        missionUpdates = {
          scoreDate: todayStr, // Update date so we don't check again
          todayScore: 0,
          // Keep pending tasks? Or clear? Let's keep them.
        };
      }
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

  // TAP TARGET HANDLERS
  const handleOpenTapTarget = (id: string) => {
    setActiveTapId(id);
    setViewMode("tap");
  };

  const handleCreateTapTarget = () => {
    // For MVP: Creating a default one. In real app, open a modal.
    const id = Date.now().toString();
    const newTarget: TapTarget = {
      id,
      title: "Power Calls",
      target: 100,
      count: 0
    };
    setState(prev => ({
      ...prev,
      tapTargets: { ...prev.tapTargets, [id]: newTarget }
    }));
    handleOpenTapTarget(id);
  };

  const updateTapTarget = (stats: any) => {
    if (!activeTapId) return;
    // Ideally update count or mark complete
    setState(prev => ({
      ...prev,
      tapTargets: {
        ...prev.tapTargets,
        [activeTapId]: {
          ...prev.tapTargets[activeTapId],
          count: stats.totalTaps // or cumulative?
        }
      }
    }));
    // Show summary or whatever? content is inside TapCounter currently
    // For now, just close it after delay? Or keep it open.
    // The TapCounter component handles the "Complete" view. 
    // We might want to save the "session" to history here.
  };

  const addTask = (title: string) => {
    if (!activeMission) return;

    // 1. Add to current tasks
    const newTask: Task = { id: Date.now(), title, priority: "High", status: "pending" };

    // 2. Add to Daily Habits (PERMANENT)
    const newHabits = [...(activeMission.config.dailyHabits || [])];
    if (!newHabits.includes(title)) {
      newHabits.push(title);
    }

    updateActiveMission({
      tasks: [newTask, ...activeMission.tasks],
      config: { ...activeMission.config, dailyHabits: newHabits }
    });
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
          scale: viewMode !== "dashboard" ? 0.9 : 1,
          opacity: viewMode !== "dashboard" ? 0.5 : 1,
          filter: viewMode !== "dashboard" ? "blur(10px)" : "blur(0px)"
        }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <Dashboard
          state={state}
          onSelectMission={handleSelectMission}
          onSelectTapTarget={handleOpenTapTarget}
          onCreateTapTarget={handleCreateTapTarget}
        />
      </motion.div>


      {/* 3. ACTIVE MISSION OVERLAY (Zoomed In) */}
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

      {/* 4. TAP COUNTER OVERLAY */}
      <AnimatePresence>
        {viewMode === "tap" && activeTapId && state.tapTargets[activeTapId] && (
          <TapCounter
            target={state.tapTargets[activeTapId].target}
            title={state.tapTargets[activeTapId].title}
            onClose={() => setViewMode("dashboard")}
            onComplete={updateTapTarget}
          />
        )}
      </AnimatePresence>

      {/* 5. ALERTS (Mercy/Penalty) */}
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