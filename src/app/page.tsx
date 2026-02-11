"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChallengeHeader from "@/components/ChallengeHeader";
import TaskCard from "@/components/TaskCard";
import TaskInput from "@/components/TaskInput";
import StreakTracker from "@/components/StreakTracker";
import Dashboard from "@/components/Dashboard";
import { AlertTriangle, ArrowLeft, Heart, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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
  history: { [date: string]: "completed" | "failed" | "skipped" | undefined }; // Added "skipped" for mercy
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
  const [missedDate, setMissedDate] = useState<string | null>(null);
  const [showMercyAlert, setShowMercyAlert] = useState(false); // NEW

  // 1. LOAD STATE & THEME
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) setState(JSON.parse(savedState));

    // Initialize Theme
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

    // A. MISSED DAY CHECK
    let checkDate = new Date(startDate);
    checkDate.setHours(0, 0, 0, 0);
    let foundMissed = null;

    while (checkDate < today) {
      const dateStr = checkDate.toISOString().split('T')[0];
      // Check if day is missing AND not already marked (completed/failed/skipped)
      if (!activeMission.history[dateStr] && dateStr !== activeMission.scoreDate) {
        foundMissed = dateStr;
        break;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    if (foundMissed) {
      // MERCY CHECK
      const remainingBuffer = activeMission.config.bufferDays || 0;
      if (remainingBuffer > 0) {
        // Apply Mercy automatically
        console.log("Applying Mercy for", foundMissed);
        const newHistory = { ...activeMission.history, [foundMissed]: "skipped" as const };
        const newConfig = { ...activeMission.config, bufferDays: remainingBuffer - 1 };

        updateActiveMission({
          history: newHistory,
          config: newConfig
        });
        setMissedDate(foundMissed); // Triggers Mercy Alert instead
        setShowMercyAlert(true);
      } else {
        // No Buffer -> Penalty
        setMissedDate(foundMissed);
        setShowMercyAlert(false);
      }
    }

    // B. RESET & POPULATE HABITS
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

  // --- HANDLERS ---
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
      setViewMode("mission");
    }
  };

  const addTask = (title: string, priority: "High" | "Medium" | "Low") => {
    if (!activeMission) return;
    const newTask: Task = { id: Date.now(), title, priority, status: "pending" };
    updateActiveMission({ tasks: [newTask, ...activeMission.tasks] });
  };

  const completeTask = (id: number, points: number) => {
    if (missedDate && !showMercyAlert || !activeMission) return; // Block input only on penalty

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
      tasks: activeMission.tasks.filter(t => t.id !== id),
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

  const handleMercyAck = () => {
    setMissedDate(null);
    setShowMercyAlert(false);
  };

  if (!isLoaded) return <div className="min-h-screen bg-theme-bg" />;

  return (
    <main className={`min-h-screen bg-theme-bg text-theme-text p-6 pb-32 font-sans selection:bg-[#F78320]/30 ${missedDate && !showMercyAlert ? "overflow-hidden" : ""}`}>

      {/* DASHBOARD VIEW */}
      {viewMode === "dashboard" ? (
        <Dashboard state={state} onSelectMission={handleSelectMission} />
      ) : (

        /* MISSION VIEW */
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="max-w-xl mx-auto space-y-8 pt-12 relative"
        >
          <button
            onClick={() => setViewMode("dashboard")}
            className="absolute -top-6 left-0 flex items-center gap-2 text-sm font-bold text-[#F78320] hover:underline z-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <ChallengeHeader missionConfig={activeMission?.config} />

          {activeMission ? (
            <>
              <div className="mt-8">
                <StreakTracker
                  history={activeMission.history}
                  dailyLogs={activeMission.dailyLog}
                  startDate={activeMission.config.startDate}
                  duration={activeMission.config.duration}
                />
              </div>

              <div className="flex items-center justify-between px-6 py-4 bg-theme-card/50 rounded-2xl border border-theme-border mx-2 shadow-sm">
                <span className="text-sm font-medium text-theme-text opacity-60">Today's Focus Points</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black ${activeMission.todayScore >= activeMission.config.dailyTarget ? "text-[#F78320]" : "text-theme-text"}`}>
                    {activeMission.todayScore}
                  </span>
                  <span className="text-sm text-theme-text opacity-40 font-bold">/ {activeMission.config.dailyTarget}</span>
                </div>
              </div>

              <section className="space-y-4 px-2">
                {activeMission.tasks.length > 0 ? (
                  activeMission.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      priority={task.priority}
                      onComplete={(points) => completeTask(task.id, points)}
                      doText={task.title}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 opacity-50 text-theme-text">
                    <p className="text-xl font-light">Protocol Complete.</p>
                    <p className="text-sm mt-2">Add bonus tasks to execute.</p>
                  </div>
                )}
              </section>

              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
                <TaskInput onAdd={addTask} />
              </div>
            </>
          ) : (
            <div className="text-center mt-20">Mission not found.</div>
          )}
        </motion.div>
      )}

      {/* 🚨 FAILURE / MERCY ALERTS */}
      <AnimatePresence>
        {missedDate && viewMode === "mission" && activeMission && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">

            {/* MERCY ALERT */}
            {showMercyAlert ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1E1A17] border-2 border-blue-500 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-[0_20px_60px_rgba(59,130,246,0.3)] text-[#EFE0C8]"
              >
                <Heart className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-pulse" fill="currentColor" />
                <h2 className="text-3xl font-black mb-2 text-white">MERCY APPLIED</h2>
                <p className="text-lg opacity-60 mb-8 font-medium">You missed {missedDate}.</p>
                <div className="bg-blue-500/10 p-6 rounded-2xl mb-8 border border-blue-500/20">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Protocol Status</p>
                  <p className="text-lg font-bold text-white uppercase">One Life Consumed. {activeMission.config.bufferDays} Remaining.</p>
                </div>
                <button
                  onClick={handleMercyAck}
                  className="w-full py-5 rounded-[1.5rem] bg-blue-600 text-white font-bold text-lg hover:scale-95 transition-transform"
                >
                  CONTINUE MISSION
                </button>
              </motion.div>
            ) : (

              /* PENALTY ALERT */
              <div className="bg-[#1E1A17] border-2 border-red-500 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-[0_20px_60px_rgba(220,38,38,0.3)] text-[#EFE0C8]">
                <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl font-black mb-2 text-white">PROTOCOL BREACH</h2>
                <p className="text-lg opacity-60 mb-8 font-medium">You missed {missedDate}. No lives remaining.</p>

                {activeMission.config.penaltyDetail && (
                  <div className="bg-red-500/10 p-6 rounded-2xl mb-8 border border-red-500/20">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Required Penalty</p>
                    <p className="text-xl font-bold text-white uppercase">{activeMission.config.penaltyDetail}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={handleRestart}
                    className="w-full py-5 rounded-[1.5rem] bg-red-600 text-white font-bold text-lg hover:scale-95 transition-transform"
                  >
                    {activeMission.config.penaltyType === "Restart" ? "RESTART MISSION" : "I HAVE PAID THE PRICE"}
                  </button>
                  <button onClick={handlePenalty} className="w-full py-4 text-sm font-bold opacity-40 hover:opacity-100 uppercase tracking-widest">Mark Day As Failed</button>
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}