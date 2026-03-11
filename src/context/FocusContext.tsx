"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";
import type { ScheduleProfile } from "@/types/schedule";
import type { CalendarEvent } from "@/lib/calendarIntegration";
import NotificationToast from "@/components/NotificationToast";

// Notification type
export interface AppNotification {
    id: string;
    type: "success" | "warning" | "info" | "event";
    title: string;
    message: string;
}

// --- TYPES ---
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
    theme: string;
    icon: string;
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
        selectedDays?: number[];
    };
    tasks: Task[];
    history: { [date: string]: "completed" | "failed" | "skipped" | "rest" | undefined };
    dailyLog: { [date: string]: { tasks: any[] } };
    todayScore: number;
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
    notifications: AppNotification[];
    calendarEvents: CalendarEvent[];
}

interface FocusContextType {
    state: AppState;
    activeMission: MissionData | null;
    activeTapId: string | null;
    missedDate: string | null;
    showMercyAlert: boolean;
    viewMode: "dashboard" | "mission" | "tap" | "tap_config" | "schedule_agent";
    theme: string;
    recentEvents: any[];
    addNotification: (notif: Omit<AppNotification, 'id'>) => void;
    dismissNotification: (id: string) => void;
    addCalendarEvents: (events: CalendarEvent[]) => void;
    clearCalendarEvents: () => void;
    scheduleProfile: ScheduleProfile | null;
    studyBlockMissed: boolean;
    setActiveMissionId: (id: string | null) => void;
    setActiveTapId: (id: string | null) => void;
    setViewMode: (mode: "dashboard" | "mission" | "tap" | "tap_config" | "schedule_agent") => void;
    createTapTarget: (config?: { title: string; target: number; theme: string; icon: string }) => void;
    updateTapTarget: (id: string, count: number) => void;
    addTask: (title: string) => void;
    completeTask: (id: number, points: number) => void;
    handlePenalty: () => void;
    acknowledgeMercy: () => void;
    handleRestart: () => void;
    toggleTheme: () => void;
    addMission: (mission: MissionData) => void;
    saveScheduleProfile: (profile: ScheduleProfile) => Promise<void>;
    deleteScheduleProfile: () => Promise<void>;
    acknowledgeStudyMiss: () => void;
    setStudyBlockMissed: (v: boolean) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

const INITIAL_STATE: AppState = {
    activeMissionId: null,
    missions: {},
    tapTargets: {},
    userProfile: null,
    notifications: [],
    calendarEvents: [],
};

export function FocusProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [viewMode, setViewMode] = useState<"dashboard" | "mission" | "tap" | "tap_config" | "schedule_agent">("dashboard");
    const [scheduleProfile, setScheduleProfile] = useState<ScheduleProfile | null>(null);
    const [studyBlockMissed, setStudyBlockMissed] = useState(false);
    const [activeTapId, setActiveTapId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [missedDate, setMissedDate] = useState<string | null>(null);
    const [showMercyAlert, setShowMercyAlert] = useState(false);
    const [theme, setTheme] = useState("light");
    const [userId, setUserId] = useState<string>("anon_user");
    const [recentEvents, setRecentEvents] = useState<any[]>([]);

    // Always-fresh state ref — avoids stale closures in useCallback functions
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // 1. INIT
    useEffect(() => {
        const init = async () => {
            const savedTheme = localStorage.getItem("theme") || "light";
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);

            let currentUserId = localStorage.getItem("focuspoint_device_id");
            if (!currentUserId) {
                currentUserId = crypto.randomUUID();
                localStorage.setItem("focuspoint_device_id", currentUserId);
            }
            setUserId(currentUserId);
            await loadFromSupabase(currentUserId);

            supabase.from('events').insert({
                user_id: currentUserId,
                event_type: 'app_opened'
            }).then();

            setIsLoaded(true);
        };
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadFromSupabase = async (uid: string) => {
        const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('*')
            .eq('user_id', uid)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error loading profile:", profileError.message);
        }

        let userProfile: UserProfile | null = profileData || null;

        if (!userProfile) {
            const { data: newProfile, error: createError } = await supabase
                .from('user_profile')
                .insert({ user_id: uid, last_active: new Date().toISOString() })
                .select()
                .single();

            if (createError) console.error("Error creating profile:", createError.message);
            else userProfile = newProfile;
        }

        const { data: missionsData, error: missionsError } = await supabase
            .from('missions')
            .select('*')
            .eq('user_id', uid);

        if (missionsError) console.error("Error loading missions:", missionsError.message);

        const loadedMissions: { [id: string]: MissionData } = {};
        if (missionsData) {
            missionsData.forEach((row: any) => {
                loadedMissions[row.id] = {
                    ...row.data,
                    id: row.id,
                    todayScore: row.points,
                    config: { ...row.data.config, name: row.title }
                };
            });
        }

        const { data: targetsData, error: targetsError } = await supabase
            .from('tap_targets')
            .select('*')
            .eq('user_id', uid);

        if (targetsError) console.error("Error loading targets:", targetsError.message);

        const loadedTargets: { [id: string]: TapTarget } = {};
        if (targetsData) {
            targetsData.forEach((row: any) => {
                loadedTargets[row.id] = {
                    id: row.id,
                    title: row.title,
                    count: row.current_count,
                    target: row.target_count,
                    theme: row.data?.theme || "ember",
                    icon: row.data?.icon || "target",
                };
            });
        }

        const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(10);

        if (eventsError) console.error("Error loading events:", eventsError.message);
        if (eventsData) setRecentEvents(eventsData);

        const { data: scheduleData } = await supabase
            .from('schedule_profiles')
            .select('*')
            .eq('user_id', uid)
            .single();

        if (scheduleData) setScheduleProfile(scheduleData.data as ScheduleProfile);

        const missionKeys = Object.keys(loadedMissions);
        const fallbackId = missionKeys.length > 0 ? missionKeys[missionKeys.length - 1] : null;

        setState({
            activeMissionId: fallbackId,
            missions: loadedMissions,
            tapTargets: loadedTargets,
            userProfile,
            notifications: [],
            calendarEvents: [],
        });
    };

    const logEvent = useCallback(async (type: string, value?: number, metadata?: any) => {
        const newEvent = {
            id: crypto.randomUUID(),
            user_id: userId,
            event_type: type,
            event_value: value,
            metadata,
            created_at: new Date().toISOString()
        };
        setRecentEvents(prev => [newEvent, ...prev].slice(0, 10));
        await supabase.from('events').insert({
            user_id: userId,
            event_type: type,
            event_value: value,
            metadata
        });
    }, [userId]);

    const activeMission = useMemo(() =>
        state.activeMissionId ? state.missions[state.activeMissionId] : null,
        [state.activeMissionId, state.missions]
    );

    // 2. DAILY CHECK
    useEffect(() => {
        if (!activeMission || !isLoaded) return;
        checkDailyLogic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                updateActiveMissionDirect({ history: newHistory, config: newConfig });
                setMissedDate(foundMissed);
                setShowMercyAlert(true);
            } else {
                setMissedDate(foundMissed);
                setShowMercyAlert(false);
            }
        }

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
            updateActiveMissionDirect(missionUpdates);
        }
    };

    // Internal helper — not exposed in context
    const updateActiveMissionDirect = async (updates: Partial<MissionData>) => {
        setState(prev => {
            const mid = prev.activeMissionId;
            if (!mid) return prev;
            const updatedMission = { ...prev.missions[mid], ...updates };
            const newState = {
                ...prev,
                missions: { ...prev.missions, [mid]: updatedMission }
            };

            // Async Supabase sync (fire and forget)
            const title = updatedMission.config.name;
            const points = updatedMission.todayScore;
            supabase.from('missions').upsert({
                id: mid,
                user_id: userId,
                title,
                points,
                status: 'active',
                data: updatedMission
            }).then(({ error }) => {
                if (error) console.error("Error syncing mission:", error.message);
            });

            return newState;
        });
    };

    // ACTIONS
    const updateActiveMission = useCallback(async (updates: Partial<MissionData>) => {
        setState(prev => {
            const mid = prev.activeMissionId;
            if (!mid) return prev;
            const updatedMission = { ...prev.missions[mid], ...updates };

            supabase.from('missions').upsert({
                id: mid,
                user_id: userId,
                title: updatedMission.config.name,
                points: updatedMission.todayScore,
                status: 'active',
                data: updatedMission
            }).then(({ error }) => {
                if (error) console.error("Error updating mission:", error.message);
            });

            return {
                ...prev,
                missions: { ...prev.missions, [mid]: updatedMission }
            };
        });
    }, [userId]);

    const addMission = useCallback(async (mission: MissionData) => {
        setState(prev => ({
            ...prev,
            activeMissionId: mission.id,
            missions: { ...prev.missions, [mission.id]: mission }
        }));

        const { error } = await supabase.from('missions').insert({
            id: mission.id,
            user_id: userId,
            title: mission.config.name,
            points: mission.todayScore,
            status: 'active',
            data: mission
        });

        if (error) console.error("Error adding mission:", error.message);
        else logEvent('mission_created', undefined, { mission_id: mission.id, title: mission.config.name });
    }, [userId, logEvent]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const cycle: Record<string, string> = { light: "dark", dark: "neon", neon: "light" };
            const newTheme = cycle[prev] ?? "light";
            localStorage.setItem("theme", newTheme);
            document.documentElement.setAttribute("data-theme", newTheme);
            return newTheme;
        });
    }, []);

    const createTapTarget = useCallback(async (config?: { title: string; target: number; theme: string; icon: string }) => {
        const id = Date.now().toString();
        const newTarget: TapTarget = {
            id,
            title: config?.title || "New Target",
            target: config?.target || 100,
            count: 0,
            theme: config?.theme || "ember",
            icon: config?.icon || "target"
        };
        setState(prev => ({
            ...prev,
            tapTargets: { ...prev.tapTargets, [id]: newTarget }
        }));
        setActiveTapId(id);
        setViewMode("tap");

        const { error } = await supabase.from('tap_targets').insert({
            id,
            user_id: userId,
            title: newTarget.title,
            current_count: 0,
            target_count: newTarget.target,
            is_completed: false,
            data: newTarget
        });

        if (error) console.error("Error creating tap target:", error.message);
        else logEvent('target_created', undefined, { target_id: id });
    }, [userId, logEvent]);

    const updateTapTarget = useCallback(async (id: string, newCount: number) => {
        // Read fresh state via ref to avoid stale closures
        const tap = stateRef.current.tapTargets[id];
        if (!tap) return;

        const isCompleted = newCount >= tap.target;

        // Optimistic UI update
        setState(prev => {
            const t = prev.tapTargets[id];
            if (!t) return prev;
            return {
                ...prev,
                tapTargets: { ...prev.tapTargets, [id]: { ...t, count: newCount } }
            };
        });

        // Persist to Supabase
        const { error } = await supabase.from('tap_targets').update({
            current_count: newCount,
            is_completed: isCompleted,
            data: { ...tap, count: newCount }
        }).eq('id', id);

        if (error) console.error("Error updating tap target:", error.message);
        if (isCompleted) logEvent('target_completed', undefined, { target_id: id, count: newCount });
    }, [logEvent]);

    const addTask = useCallback((title: string) => {
        setState(prev => {
            const mid = prev.activeMissionId;
            if (!mid) return prev;
            const mission = prev.missions[mid];
            if (!mission) return prev;
            if (mission.tasks.some(t => t.title === title && t.status === "pending")) return prev;

            const newTask: Task = { id: Date.now(), title, priority: "High", status: "pending" };
            const newHabits = [...(mission.config.dailyHabits || [])];
            if (!newHabits.includes(title)) newHabits.push(title);

            const updatedMission = {
                ...mission,
                tasks: [newTask, ...mission.tasks],
                config: { ...mission.config, dailyHabits: newHabits }
            };

            supabase.from('missions').upsert({
                id: mid,
                user_id: userId,
                title: updatedMission.config.name,
                points: updatedMission.todayScore,
                status: 'active',
                data: updatedMission
            }).then(({ error }) => {
                if (error) console.error("Error syncing task add:", error.message);
            });

            return { ...prev, missions: { ...prev.missions, [mid]: updatedMission } };
        });
    }, [userId]);

    const completeTask = useCallback(async (id: number, points: number) => {
        if (missedDate && !showMercyAlert) return;

        setState(prev => {
            const mid = prev.activeMissionId;
            if (!mid) return prev;
            const mission = prev.missions[mid];
            if (!mission) return prev;
            const task = mission.tasks.find(t => t.id === id);
            if (!task) return prev;

            const newScore = mission.todayScore + points;

            // Confetti
            if (task.priority === "High" || (newScore >= mission.config.dailyTarget && mission.todayScore < mission.config.dailyTarget)) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#F78320', '#EFE0C8', '#ffffff']
                });
            }

            const today = new Date().toISOString().split('T')[0];
            const newLog = { ...mission.dailyLog };
            if (!newLog[today]) newLog[today] = { tasks: [] };
            newLog[today] = {
                tasks: [...newLog[today].tasks, {
                    title: task.title, points, time: new Date().toLocaleTimeString(), priority: task.priority
                }]
            };

            const newHistory = { ...mission.history };
            if (newScore >= mission.config.dailyTarget) {
                newHistory[today] = "completed";
            }

            const updatedMission = {
                ...mission,
                todayScore: newScore,
                tasks: mission.tasks.map(t => t.id === id ? { ...t, status: 'completed' as const } : t),
                dailyLog: newLog,
                history: newHistory
            };

            supabase.from('missions').upsert({
                id: mid,
                user_id: userId,
                title: updatedMission.config.name,
                points: updatedMission.todayScore,
                status: 'active',
                data: updatedMission
            }).then(({ error }) => {
                if (error) console.error("Error syncing task complete:", error.message);
            });

            logEvent('mission_completed_task', points, { mission_id: mid, task_title: task.title });
            if (newScore >= mission.config.dailyTarget && mission.todayScore < mission.config.dailyTarget) {
                logEvent('mission_day_completed', undefined, { mission_id: mid, date: today });
            }

            return { ...prev, missions: { ...prev.missions, [mid]: updatedMission } };
        });
    }, [missedDate, showMercyAlert, userId, logEvent]);

    const handlePenalty = useCallback(async () => {
        if (!missedDate) return;
        await updateActiveMission({ history: {} });
        setState(prev => {
            const mid = prev.activeMissionId;
            if (!mid) return prev;
            const mission = prev.missions[mid];
            if (!mission || !missedDate) return prev;
            const updatedMission = {
                ...mission,
                history: { ...mission.history, [missedDate]: "failed" as const }
            };
            supabase.from('missions').upsert({
                id: mid,
                user_id: userId,
                title: updatedMission.config.name,
                points: updatedMission.todayScore,
                status: 'active',
                data: updatedMission
            }).then();
            logEvent('mission_failed_day', undefined, { mission_id: mid, date: missedDate });
            return { ...prev, missions: { ...prev.missions, [mid]: updatedMission } };
        });
        setMissedDate(null);
    }, [missedDate, userId, logEvent, updateActiveMission]);

    const acknowledgeMercy = useCallback(() => {
        setMissedDate(null);
        setShowMercyAlert(false);
    }, []);

    const addNotification = useCallback((notif: Omit<AppNotification, 'id'>) => {
        const id = crypto.randomUUID();
        setState(prev => ({
            ...prev,
            notifications: [...prev.notifications, { id, ...notif }]
        }));
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id)
        }));
    }, []);

    const addCalendarEvents = useCallback((events: CalendarEvent[]) => {
        setState(prev => ({
            ...prev,
            calendarEvents: [...prev.calendarEvents, ...events],
        }));
    }, []);

    const clearCalendarEvents = useCallback(() => {
        setState(prev => ({ ...prev, calendarEvents: [] }));
    }, []);

    const saveScheduleProfile = useCallback(async (profile: ScheduleProfile) => {
        setScheduleProfile(profile);
        const { error } = await supabase.from('schedule_profiles').upsert({
            id: profile.id,
            user_id: userId,
            data: profile,
            updated_at: new Date().toISOString()
        });
        if (error) console.error("Error saving schedule profile:", error.message);
        else logEvent('schedule_profile_saved', undefined, { profile_id: profile.id });
    }, [userId, logEvent]);

    const deleteScheduleProfile = useCallback(async () => {
        setScheduleProfile(null);
        const { error } = await supabase
            .from('schedule_profiles')
            .delete()
            .eq('user_id', userId);
        if (error) console.error("Error deleting schedule profile:", error.message);
        else logEvent('schedule_profile_deleted', undefined, {});
    }, [userId, logEvent]);

    const acknowledgeStudyMiss = useCallback(() => {
        setStudyBlockMissed(false);
        logEvent('study_miss_acknowledged', undefined, {});
    }, [logEvent]);

    const handleRestart = useCallback(async () => {
        setState(prev => {
            const mid = prev.activeMissionId;
            if (!mid) return prev;
            const mission = prev.missions[mid];
            if (!mission) return prev;
            const todayStr = new Date().toISOString().split('T')[0];
            const freshMission: MissionData = {
                ...mission,
                config: { ...mission.config, startDate: new Date().toISOString() },
                tasks: [],
                history: {},
                dailyLog: {},
                todayScore: 0,
                scoreDate: todayStr
            };
            supabase.from('missions').update({
                points: 0,
                status: 'active',
                data: freshMission
            }).eq('id', mid).then(({ error }) => {
                if (error) console.error("Error restarting mission:", error.message);
            });
            return { ...prev, missions: { ...prev.missions, [mid]: freshMission } };
        });
        setMissedDate(null);
    }, []);

    const setActiveMissionId = useCallback((id: string | null) => {
        setState(prev => ({ ...prev, activeMissionId: id }));
    }, []);

    const contextValue = useMemo<FocusContextType>(() => ({
        state,
        activeMission,
        activeTapId,
        missedDate,
        showMercyAlert,
        viewMode,
        theme,
        recentEvents,
        setActiveMissionId,
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
        scheduleProfile,
        studyBlockMissed,
        saveScheduleProfile,
        acknowledgeStudyMiss,
        setStudyBlockMissed,
        addNotification,
        dismissNotification,
        addCalendarEvents,
        clearCalendarEvents,
        deleteScheduleProfile,
    }), [
        state,
        activeMission,
        activeTapId,
        missedDate,
        showMercyAlert,
        viewMode,
        theme,
        recentEvents,
        setActiveMissionId,
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
        scheduleProfile,
        studyBlockMissed,
        saveScheduleProfile,
        acknowledgeStudyMiss,
        setStudyBlockMissed,
        addNotification,
        dismissNotification,
        addCalendarEvents,
        clearCalendarEvents,
        deleteScheduleProfile,
    ]);

    return (
        <FocusContext.Provider value={contextValue}>
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
