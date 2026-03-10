export type UserRole = "student" | "part_time" | "full_time" | "hybrid";
export type PrimaryGoal = "get_job" | "exam_prep" | "better_sleep" | "freelancing" | "build_habits";
export type TransportType = "car" | "public_transit" | "walking" | "no_commute";
export type TriKalaPeriod = "brahma" | "karma" | "vishrama";
export type BlockType =
    | "wake_routine"
    | "meal"
    | "study"
    | "work"
    | "commute"
    | "free"
    | "wind_down"
    | "sleep"
    | "custom";

// A user-defined block added on top of the auto-generated schedule
export interface CustomBlockDefinition {
    id: string;
    label: string;
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    type: BlockType;
}

export interface DailyAnchors {
    wakeTime: string;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
    workStartTime: string;
    workEndTime: string;
    sleepTargetTime: string;
}

export interface CommuteConfig {
    transportType: TransportType;
    travelDurationMins: number;
}

export interface ScheduleProfile {
    id: string;
    user_id: string;
    name?: string;          // user-given display name for this schedule
    userRole: UserRole;
    primaryGoal: PrimaryGoal;
    anchors: DailyAnchors;
    commute: CommuteConfig;
    customBlocks?: CustomBlockDefinition[]; // user-added blocks on top of generated ones
    createdAt: string;
    updatedAt: string;
}

export interface ScheduleBlock {
    id: string;
    startTime: string;
    endTime: string;
    durationMins: number;
    type: BlockType;
    label: string;
    period: TriKalaPeriod;
    isMandatory: boolean;
    missionId?: string;
    isCompleted?: boolean;
    completedAt?: string;
}

export interface DailySchedule {
    id: string;
    user_id: string;
    date: string;
    profile_id: string;
    blocks: ScheduleBlock[];
    generatedAt: string;
    brahmaBoundary: string;
    karmaBoundary: string;
    vishramaBoundary: string;
}

export const ROLE_DEFAULTS: Record<UserRole, Partial<DailyAnchors>> = {
    student: {
        wakeTime: "08:00",
        breakfastTime: "08:30",
        lunchTime: "13:00",
        dinnerTime: "19:00",
        workStartTime: "09:00",
        workEndTime: "16:00",
        sleepTargetTime: "23:30",
    },
    full_time: {
        wakeTime: "07:00",
        breakfastTime: "07:30",
        lunchTime: "12:30",
        dinnerTime: "19:00",
        workStartTime: "09:00",
        workEndTime: "17:30",
        sleepTargetTime: "23:00",
    },
    part_time: {
        wakeTime: "09:30",
        breakfastTime: "10:00",
        lunchTime: "13:00",
        dinnerTime: "20:00",
        workStartTime: "14:00",
        workEndTime: "22:00",
        sleepTargetTime: "02:00",
    },
    hybrid: {
        wakeTime: "08:00",
        breakfastTime: "08:30",
        lunchTime: "13:00",
        dinnerTime: "19:30",
        workStartTime: "10:00",
        workEndTime: "18:00",
        sleepTargetTime: "23:30",
    },
};
