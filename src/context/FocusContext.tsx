"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import confetti from "canvas-confetti";

// --- TYPES (Lifted from page.tsx) ---
export interface Task {
    id: number;
    title: string;
    priority: "High" | "Medium" | "Low";
    status: "pending" | "completed";
}

export interface TapTarget {
    id: string;
    title: string;
    target: number;
    count: number;
    totalTime?: number;
}

export interface MissionData {
    id: string;
    config: {
        name: string;
        duration: number;
        dailyTarget: number;
        startDate: string;
        dailyHabits?: string[];
        penaltyType?: string;
        penaltyDetail?: string;
        bufferDays?: number;
        frequency?: "daily" | "selected";
        selectedDays?: number[]; // 0=Sun, 6=Sat
    };
    tasks: Task[];
    history: { [date: string]: "completed" | "failed" | "skipped" | "rest" | undefined };
    dailyLog: { [date: string]: { tasks: any[] } };
    todayScore: number;
    scoreDate: string;
}

export interface AppState {
    activeMissionId: string | null;
    missions: { [id: string]: MissionData };
    tapTargets: { [id: string]: TapTarget };
}

interface FocusContextType {
    state: AppState;
    activeMission: MissionData | null;
    activeTapId: string | null;
    missedDate: string | null;
    showMercyAlert: boolean;
    viewMode: "dashboard" | "mission" | "tap"; // Kept for overlay logic
    theme: string;

    // Actions
    setActiveMissionId: (id: string | null) => void;
    setActiveTapId: (id: string | null) => void;
    setViewMode: (mode: "dashboard" | "mission" | "tap") => void;
    createTapTarget: () => void;
    updateTapTarget: (id: string, count: number) => void;
    addTask: (title: string) => void;
    completeTask: (id: number, points: number) => void;
    handlePenalty: () => void;
    acknowledgeMercy: () => void;
    handleRestart: () => void;
    toggleTheme: () => void;
    addMission: (mission: MissionData) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

const STORAGE_KEY = "focuspoint_v1";

const INITIAL_STATE: AppState = {
    activeMissionId: null,
    missions: {},
    tapTargets: {}
};

export function FocusProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [viewMode, setViewMode] = useState<"dashboard" | "mission" | "tap">("dashboard");
    const [activeTapId, setActiveTapId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [missedDate, setMissedDate] = useState<string | null>(null);
    const [showMercyAlert, setShowMercyAlert] = useState(false);
    const [theme, setTheme] = useState("light");

    // 1. DATA PERSISTENCE & THEME LOAD
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            if (!parsed.tapTargets) parsed.tapTargets = {};
            setState(parsed);
        }
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state, isLoaded]);

    const activeMission = state.activeMissionId ? state.missions[state.activeMissionId] : null;

    // 2. AUTO-POPULATE LOGIC (Runs daily)
    useEffect(() => {
        if (!activeMission) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const startDate = new Date(activeMission.config.startDate);

        let missionUpdates: Partial<MissionData> = {};
        let checkDate = new Date(startDate);
        checkDate.setHours(0, 0, 0, 0);
        let foundMissed = null;

        // Check history for missed days
        while (checkDate < today) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const dayOfWeek = checkDate.getDay();
            const isScheduledDay = activeMission.config.frequency === "selected"
                ? activeMission.config.selectedDays?.includes(dayOfWeek)
                : true;

            if (!activeMission.history[dateStr] && dateStr !== activeMission.scoreDate) {
                if (isScheduledDay) {
                    foundMissed = dateStr;
                    break;
                }
            }
            checkDate.setDate(checkDate.getDate() + 1);
        }

        if (foundMissed) {
            const remainingBuffer = activeMission.config.bufferDays || 0;
            if (remainingBuffer > 0) {
                // Mercy
                const newHistory = { ...activeMission.history, [foundMissed]: "skipped" as const };
                const newConfig = { ...activeMission.config, bufferDays: remainingBuffer - 1 };
                updateActiveMission({ history: newHistory, config: newConfig });
                setMissedDate(foundMissed);
                setShowMercyAlert(true);
            } else {
                // Penalty
                setMissedDate(foundMissed);
                setShowMercyAlert(false);
            }
        }

        // New Day Reset
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
                missionUpdates = { scoreDate: todayStr, todayScore: 0 };
            }
        }

        if (Object.keys(missionUpdates).length > 0) {
            updateActiveMission(missionUpdates);
        }
    }, [state.activeMissionId, isLoaded]); // Check on load/select

    // ACTIONS
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

    const addMission = (mission: MissionData) => {
        setState(prev => ({
            ...prev,
            activeMissionId: mission.id,
            missions: { ...prev.missions, [mission.id]: mission }
        }));
    }

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    const createTapTarget = () => {
        const id = Date.now().toString();
        const newTarget: TapTarget = {
            id,
            title: "New Target",
            target: 100,
            count: 0
        };
        setState(prev => ({
            ...prev,
            tapTargets: { ...prev.tapTargets, [id]: newTarget }
        }));
        setActiveTapId(id);
        setViewMode("tap");
    };

    const updateTapTarget = (id: string, count: number) => {
        setState(prev => ({
            ...prev,
            tapTargets: {
                ...prev.tapTargets,
                [id]: { ...prev.tapTargets[id], count }
            }
        }));
    };

    const addTask = (title: string) => {
        if (!activeMission) return;
        const newTask: Task = { id: Date.now(), title, priority: "High", status: "pending" };
        // Add to habits (permanent)
        const newHabits = [...(activeMission.config.dailyHabits || [])];
        if (!newHabits.includes(title)) newHabits.push(title);

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

        // Confetti
        if (task.priority === "High" || (newScore >= activeMission.config.dailyTarget && activeMission.todayScore < activeMission.config.dailyTarget)) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F78320', '#EFE0C8', '#ffffff']
            });
        }

        // Log
        const today = new Date().toISOString().split('T')[0];
        const newLog = { ...activeMission.dailyLog };
        if (!newLog[today]) newLog[today] = { tasks: [] };
        newLog[today].tasks.push({
            title: task.title,
            points,
            time: new Date().toLocaleTimeString(),
            priority: task.priority
        });

        // History
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

    const handlePenalty = () => {
        if (!missedDate || !activeMission) return;
        const newHistory = { ...activeMission.history, [missedDate]: "failed" as const };
        updateActiveMission({ history: newHistory });
        setMissedDate(null);
    };

    const acknowledgeMercy = () => {
        setMissedDate(null);
        setShowMercyAlert(false);
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

    return (
        <FocusContext.Provider
            value={{
                state,
                activeMission,
                activeTapId,
                missedDate,
                showMercyAlert,
                viewMode,
                theme,
                setActiveMissionId: (id) => setState(prev => ({ ...prev, activeMissionId: id })),
                setActiveTapId,
                setViewMode,
                createTapTarget,
                updateTapTarget,
                addTask,
                completeTask,
                handlePenalty,
                acknowledgeMercy,
                handleRestart,
                toggleTheme,
                addMission
            }}
        >
            {children}
        </FocusContext.Provider>
    );
}

export function useFocus() {
    const context = useContext(FocusContext);
    if (!context) {
        throw new Error("useFocus must be used within a FocusProvider");
    }
    return context;
}
