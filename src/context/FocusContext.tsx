"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";

// --- TYPES ---
export interface Task {
    id: number;
    title: string;
    priority: "High" | "Medium" | "Low";
    status: "pending" | "completed";
}

export interface TapTarget {
    id: string; // text in DB
    title: string;
    target: number; // mapped to target_count
    count: number; // mapped to current_count
    theme: string;
    icon: string;
    totalTime?: number;
    // DB also has: user_id, is_completed, created_at, data (jsonb)
}

export interface MissionData {
    id: string;
    config: {
        name: string; // mapped to title
        duration: number;
        dailyTarget: number;
        startDate: string;
        dailyHabits?: string[];
        penaltyType?: string;
        penaltyDetail?: string;
        bufferDays?: number;
        frequency?: "daily" | "selected";
        selectedDays?: number[];
    };
    tasks: Task[];
    history: { [date: string]: "completed" | "failed" | "skipped" | "rest" | undefined };
    dailyLog: { [date: string]: { tasks: any[] } };
    todayScore: number; // mapped to points
    scoreDate: string;
}

export interface UserProfile {
    user_id: string;
    focus_points: number;
    current_streak: number;
    best_streak: number;
    missions_completed: number;
    missions_failed: number;
    last_active: string;
}

export interface AppState {
    activeMissionId: string | null;
    missions: { [id: string]: MissionData };
    tapTargets: { [id: string]: TapTarget };
    userProfile: UserProfile | null;
}

interface FocusContextType {
    state: AppState;
    activeMission: MissionData | null;
    activeTapId: string | null;
    missedDate: string | null;
    showMercyAlert: boolean;
    viewMode: "dashboard" | "mission" | "tap" | "tap_config";
    theme: string;
    recentEvents: any[];

    // Actions
    setActiveMissionId: (id: string | null) => void;
    setActiveTapId: (id: string | null) => void;
    setViewMode: (mode: "dashboard" | "mission" | "tap" | "tap_config") => void;
    createTapTarget: (config?: { title: string; target: number; theme: string; icon: string }) => void;
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

// const STORAGE_KEY = "focuspoint_v1"; // REMOVED

const INITIAL_STATE: AppState = {
    activeMissionId: null,
    missions: {},
    tapTargets: {},
    userProfile: null
};

export function FocusProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [viewMode, setViewMode] = useState<"dashboard" | "mission" | "tap" | "tap_config">("dashboard");
    const [activeTapId, setActiveTapId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [missedDate, setMissedDate] = useState<string | null>(null);
    const [showMercyAlert, setShowMercyAlert] = useState(false);
    const [theme, setTheme] = useState("light");
    const [userId, setUserId] = useState<string>("anon_user"); // Default for now, or auth.uid() if auth is set up

    const [recentEvents, setRecentEvents] = useState<any[]>([]);

    // 1. DATA PERSISTENCE & THEME LOAD
    useEffect(() => {
        const init = async () => {
            console.log("FocusContext: Initializing...");
            // Theme
            const savedTheme = localStorage.getItem("theme") || "light";
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);

            // Auth (Optional/Simulated for now if Anon)
            // const { data: { user } } = await supabase.auth.getUser();
            // if (user) setUserId(user.id);
            // else: use anon_user or generate a device ID. 
            // For this request, we'll assume a fixed user for simplicity if auth isn't mandated, 
            // OR use a quick localStorage ID to persist identity across sessions if no auth.
            let currentUserId = localStorage.getItem("focuspoint_device_id");
            if (!currentUserId) {
                currentUserId = crypto.randomUUID();
                localStorage.setItem("focuspoint_device_id", currentUserId);
            }
            setUserId(currentUserId);

            // Load Data
            await loadFromSupabase(currentUserId);

            // Log App Opened
            supabase.from('events').insert({
                user_id: currentUserId,
                event_type: 'app_opened'
            }).then();

            setIsLoaded(true);
        };
        init();
    }, []);

    const loadFromSupabase = async (uid: string) => {
        console.log("Loading data from Supabase for user:", uid);

        // 1. User Profile
        const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('*')
            .eq('user_id', uid)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'row not found' for new users
            console.error("Error loading profile:", profileError);
        }

        let userProfile: UserProfile | null = profileData || null;

        // If no profile, create one
        if (!userProfile) {
            console.log("No profile found, creating new profile...");
            const { data: newProfile, error: createError } = await supabase
                .from('user_profile')
                .insert({ user_id: uid, last_active: new Date().toISOString() })
                .select()
                .single();

            if (createError) console.error("Error creating profile:", createError);
            else userProfile = newProfile;
        }

        // 2. Missions
        const { data: missionsData, error: missionsError } = await supabase
            .from('missions')
            .select('*')
            .eq('user_id', uid);

        if (missionsError) console.error("Error loading missions:", missionsError);
        else console.log("Missions loaded:", missionsData?.length || 0);

        const loadedMissions: { [id: string]: MissionData } = {};
        if (missionsData) {
            missionsData.forEach((row: any) => {
                const mission: MissionData = {
                    ...row.data,
                    id: row.id,
                    todayScore: row.points,
                    config: {
                        ...row.data.config,
                        name: row.title
                    }
                };
                loadedMissions[row.id] = mission;
            });
        }

        // 3. Tap Targets
        const { data: targetsData, error: targetsError } = await supabase
            .from('tap_targets')
            .select('*')
            .eq('user_id', uid);

        if (targetsError) console.error("Error loading targets:", targetsError);
        else console.log("Targets loaded:", targetsData?.length || 0);

        const loadedTargets: { [id: string]: TapTarget } = {};
        if (targetsData) {
            targetsData.forEach((row: any) => {
                const target: TapTarget = {
                    id: row.id,
                    title: row.title,
                    count: row.current_count,
                    target: row.target_count,
                    theme: row.data?.theme || "ember",
                    icon: row.data?.icon || "target",
                };
                loadedTargets[row.id] = target;
            });
        }

        // 4. Recent Events
        const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(10);

        if (eventsError) console.error("Error loading events:", eventsError);
        else console.log("Events loaded:", eventsData?.length || 0);

        if (eventsData) {
            setRecentEvents(eventsData);
        }

        setState({
            activeMissionId: null,
            missions: loadedMissions,
            tapTargets: loadedTargets,
            userProfile
        });
        console.log("State updated from Supabase.");
    };

    const logEvent = async (type: string, value?: number, metadata?: any) => {
        const newEvent = {
            id: crypto.randomUUID(), // Temp ID for UI
            user_id: userId,
            event_type: type,
            event_value: value,
            metadata,
            created_at: new Date().toISOString()
        };

        // Optimistic UI
        setRecentEvents(prev => [newEvent, ...prev].slice(0, 10));

        // Supabase
        const { data, error } = await supabase.from('events').insert({
            user_id: userId,
            event_type: type,
            event_value: value,
            metadata
        }).select();

        if (error) console.error("Error logging event:", error);
        else console.log("Event logged:", data);
    };

    // No more localStorage effect for state!

    const activeMission = state.activeMissionId ? state.missions[state.activeMissionId] : null;

    // 2. AUTO-POPULATE LOGIC (Runs daily)
    // Needs update to sync to Supabase
    useEffect(() => {
        if (!activeMission || !isLoaded) return;
        // Same logic as before, but calls dbUpdate instead of just setState
        checkDailyLogic();
    }, [state.activeMissionId, isLoaded]);

    const checkDailyLogic = () => {
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
        // ... (Logic identical to previous) ...
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
                    todayScore: 0, // Reset DB points
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
    }


    // ACTIONS
    const updateActiveMission = async (updates: Partial<MissionData>) => {
        if (!state.activeMissionId) return;
        const mid = state.activeMissionId;
        const currentMission = state.missions[mid];

        // Optimistic Update
        const updatedMission = { ...currentMission, ...updates };
        setState(prev => ({
            ...prev,
            missions: {
                ...prev.missions,
                [mid]: updatedMission
            }
        }));

        // Supabase Sync
        // Prepare relational cols
        const title = updatedMission.config.name;
        const points = updatedMission.todayScore;
        const status = 'active'; // Logic for completed/failed? 
        // We put remaining data in 'data' col

        const { error } = await supabase.from('missions').upsert({
            id: mid,
            user_id: userId,
            title,
            points,
            status,
            data: updatedMission
        });

        if (error) console.error("Error updating mission:", error);
        else console.log("Mission synced to Supabase:", mid);
    };

    const addMission = async (mission: MissionData) => {
        // Optimistic
        setState(prev => ({
            ...prev,
            activeMissionId: mission.id,
            missions: { ...prev.missions, [mission.id]: mission }
        }));

        // Supabase
        const { data, error } = await supabase.from('missions').insert({
            id: mission.id,
            user_id: userId,
            title: mission.config.name,
            points: mission.todayScore,
            status: 'active',
            data: mission
        }).select();

        if (error) {
            console.error("Error adding mission:", error);
            // Rollback state? For now just log.
        } else {
            console.log("Mission added to Supabase:", data);
            logEvent('mission_created', undefined, { mission_id: mission.id, title: mission.config.name });
        }
    }

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    const createTapTarget = async (config?: { title: string; target: number; theme: string; icon: string }) => {
        const id = Date.now().toString();
        const newTarget: TapTarget = {
            id,
            title: config?.title || "New Target",
            target: config?.target || 100,
            count: 0,
            theme: config?.theme || "ember",
            icon: config?.icon || "target"
        };
        // Optimistic
        setState(prev => ({
            ...prev,
            tapTargets: { ...prev.tapTargets, [id]: newTarget }
        }));
        setActiveTapId(id);
        setViewMode("tap");

        // Supabase
        const { data, error } = await supabase.from('tap_targets').insert({
            id,
            user_id: userId,
            title: newTarget.title,
            current_count: 0,
            target_count: 100,
            is_completed: false,
            data: newTarget
        }).select();

        if (error) {
            console.error("Error creating tap target:", error);
        } else {
            console.log("Tap target created:", data);
            logEvent('target_created', undefined, { target_id: id });
        }
    };

    const updateTapTarget = async (id: string, count: number) => {
        const target = state.tapTargets[id];
        if (!target) return;

        // Optimistic
        setState(prev => ({
            ...prev,
            tapTargets: {
                ...prev.tapTargets,
                [id]: { ...prev.tapTargets[id], count }
            }
        }));

        // Supabase
        const { error } = await supabase.from('tap_targets').update({
            current_count: count,
            is_completed: count >= target.target,
            data: { ...target, count }
        }).eq('id', id);

        if (error) console.error("Error updating tap target:", error);
        else console.log("Tap target updated:", id, count);

        if (count >= target.target) {
            logEvent('target_completed', undefined, { target_id: id, count });
        }
    };

    const addTask = (title: string) => {
        if (!activeMission) return;
        const newTask: Task = { id: Date.now(), title, priority: "High", status: "pending" };
        const newHabits = [...(activeMission.config.dailyHabits || [])];
        if (!newHabits.includes(title)) newHabits.push(title);

        updateActiveMission({
            tasks: [newTask, ...activeMission.tasks],
            config: { ...activeMission.config, dailyHabits: newHabits }
        });
    };

    const completeTask = async (id: number, points: number) => {
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

        const updates = {
            todayScore: newScore,
            tasks: activeMission.tasks.map(t => t.id === id ? { ...t, status: 'completed' as const } : t),
            dailyLog: newLog,
            history: newHistory
        };

        await updateActiveMission(updates);
        console.log("Task completed, points added:", points);

        // Event
        logEvent('mission_completed_task', points, { mission_id: activeMission.id, task_title: task.title });

        // Check if Mission/Day Completed
        if (newScore >= activeMission.config.dailyTarget && activeMission.todayScore < activeMission.config.dailyTarget) {
            logEvent('mission_day_completed', undefined, { mission_id: activeMission.id, date: today });
        }
    };

    const handlePenalty = async () => {
        if (!missedDate || !activeMission) return;
        const newHistory = { ...activeMission.history, [missedDate]: "failed" as const };
        await updateActiveMission({ history: newHistory });
        console.log("Penalty handled for date:", missedDate);

        logEvent('mission_failed_day', undefined, { mission_id: activeMission.id, date: missedDate });

        setMissedDate(null);
    };

    const acknowledgeMercy = () => {
        setMissedDate(null);
        setShowMercyAlert(false);
    };

    const handleRestart = async () => {
        if (!activeMission) return;
        const freshMission: MissionData = {
            ...activeMission,
            config: { ...activeMission.config, startDate: new Date().toISOString() },
            tasks: [],
            history: {},
            dailyLog: {},
            todayScore: 0
        };
        // Optimistic
        setState(prev => ({
            ...prev,
            missions: { ...prev.missions, [activeMission.id]: freshMission }
        }));

        // Supabase
        const { error } = await supabase.from('missions').update({
            points: 0,
            status: 'active',
            data: freshMission
        }).eq('id', activeMission.id);

        if (error) console.error("Error restarting mission:", error);
        else console.log("Mission restarted:", activeMission.id);

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
                addMission,
                recentEvents
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
