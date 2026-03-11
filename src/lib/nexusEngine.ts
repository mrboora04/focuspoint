// src/lib/nexusEngine.ts
import type { AppState, MissionData } from "@/context/FocusContext";
import type { DailySchedule, TriKalaPeriod, ScheduleBlock } from "@/types/schedule";
import { findCurrentBlock } from "./scheduleEngine";

export interface NexusSuggestion {
    id: string;
    type: "schedule" | "mission" | "health" | "insight";
    headline: string;
    description: string;
    actionLabel?: string;
    actionPayload?: string;
    priority: "high" | "medium" | "low";
}

export function generateLocalSuggestions(state: AppState, schedule: DailySchedule | null): NexusSuggestion[] {
    const suggestions: NexusSuggestion[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Analyze Schedule
    if (schedule) {
        const currentBlock = findCurrentBlock(schedule.blocks);
        if (currentBlock) {
            if (currentBlock.type === "study" && !currentBlock.isCompleted) {
                // Check how much time is left in the block
                const now = new Date();
                const [eh, em] = currentBlock.endTime.split(":").map(Number);
                const end = new Date(now);
                end.setHours(eh, em, 0);
                const minsLeft = Math.floor((end.getTime() - now.getTime()) / 60000);

                if (minsLeft > 0 && minsLeft < 30) {
                    suggestions.push({
                        id: `study_ending_${currentBlock.id}`,
                        type: "schedule",
                        priority: "high",
                        headline: "Study Block Ending Soon",
                        description: `You have ${minsLeft} minutes left in "${currentBlock.label}". Finish strong!`,
                    });
                } else if (minsLeft > 30) {
                    suggestions.push({
                        id: `study_active_${currentBlock.id}`,
                        type: "schedule",
                        priority: "medium",
                        headline: `Focus: ${currentBlock.label}`,
                        description: `You're currently in a High Priority block. Stay focused.`,
                    });
                }
            } else if (currentBlock.period === "vishrama") {
                suggestions.push({
                    id: "vishrama_winddown",
                    type: "health",
                    priority: "low",
                    headline: "Wind Down Time",
                    description: "You're in Vishrama Kala. Disconnect from work and prioritize recovery.",
                });
            }
        } else {
            // No current block (outside schedule or sleep time)
            suggestions.push({
                id: "sleep_time",
                type: "health",
                priority: "medium",
                headline: "Rest Recommended",
                description: "It's outside your configured active hours. Prioritize sleep.",
            });
        }
    } else {
        suggestions.push({
            id: "no_schedule",
            type: "schedule",
            priority: "high",
            headline: "Complete Setup",
            description: "You haven't configured your lifestyle profile. Tap here to set up your daily grid.",
            actionLabel: "Set Up Now",
            actionPayload: "open_setup"
        });
    }

    // 2. Analyze Missions
    const activeMissions = Object.values(state.missions).filter(m => {
        const startDate = new Date(m.config.startDate);
        const diffDays = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= m.config.duration;
    });

    if (activeMissions.length === 0) {
        suggestions.push({
            id: "no_active_mission",
            type: "mission",
            priority: "medium",
            headline: "No Active Protocol",
            description: "You don't have an active mission. Start a new 75-Hard style challenge.",
            actionLabel: "Create Mission",
            actionPayload: "new_mission"
        });
    } else {
        // Look for missed tasks from today
        activeMissions.forEach(m => {
            const pendingTasks = m.tasks.filter(t => t.status === "pending");
            if (pendingTasks.length > 0) {
                // Find a high priority task
                const highPriority = pendingTasks.find(t => t.priority === "High") || pendingTasks[0];
                suggestions.push({
                    id: `pending_task_${highPriority.id}`,
                    type: "mission",
                    priority: pendingTasks.length > 3 ? "high" : "medium",
                    headline: "Pending Objective",
                    description: `You still need to complete "${highPriority.title}" for ${m.config.name}.`,
                    actionLabel: "Complete",
                    actionPayload: `mission_${m.id}`
                });
            } else if (m.history?.[todayStr] !== "completed") {
                suggestions.push({
                    id: `mission_almost_done_${m.id}`,
                    type: "mission",
                    priority: "high",
                    headline: "Protocol Almost Complete",
                    description: `You've finished all tasks for ${m.config.name}. Don't forget to mark the day as complete!`,
                    actionLabel: "View Mission",
                    actionPayload: `mission_${m.id}`
                });
            }
        });

        // Analyze Tap Targets for long gaps
        const activeTargets = Object.values(state.tapTargets).filter(t => t.count < t.target);
        activeTargets.forEach(t => {
            if (t.count > 0 && t.count < t.target) {
                // If they are more than halfway done, encourage them
                const percent = t.count / t.target;
                if (percent > 0.8) {
                    suggestions.push({
                        id: `tap_target_close_${t.id}`,
                        type: "insight",
                        priority: "high",
                        headline: "Target Almost Reached",
                        description: `You are ${t.target - t.count} taps away from completing "${t.title}".`,
                        actionLabel: "Finish It",
                        actionPayload: `tap_${t.id}`
                    });
                }
            }
        });
    }

    // Sort by priority (high > medium > low)
    return suggestions.sort((a, b) => {
        const pScores = { high: 3, medium: 2, low: 1 };
        return pScores[b.priority] - pScores[a.priority];
    });
}
