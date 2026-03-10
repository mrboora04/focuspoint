import type {
    ScheduleProfile,
    DailySchedule,
    ScheduleBlock,
    TriKalaPeriod,
    BlockType,
    UserRole,
    PrimaryGoal,
} from "@/types/schedule";

// --- Time Utilities ---
// All internal math in minutes-since-midnight. Handles next-day rollover.

export function parseTime(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

export function minutesToTime(mins: number): string {
    const normalized = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMins(hhmm: string, delta: number): string {
    return minutesToTime(parseTime(hhmm) + delta);
}

function diffMins(endHHMM: string, startHHMM: string): number {
    let d = parseTime(endHHMM) - parseTime(startHHMM);
    if (d < 0) d += 1440; // next-day rollover
    return d;
}

// --- Label helpers ---

function studyLabel(goal: PrimaryGoal): string {
    const map: Record<PrimaryGoal, string> = {
        get_job: "Job Prep / DevOps Block",
        exam_prep: "Exam Study Block",
        better_sleep: "Evening Reading",
        freelancing: "Deep Work Block",
        build_habits: "Habit Practice Block",
    };
    return map[goal];
}

function workLabel(role: UserRole): string {
    const map: Record<UserRole, string> = {
        student: "Lectures / Classes",
        part_time: "Work Shift",
        full_time: "Work Shift",
        hybrid: "Work / Lectures",
    };
    return map[role];
}

// --- Period assignment ---

function assignPeriod(
    startMins: number,
    karmaMins: number,
    vishramaMins: number
): TriKalaPeriod {
    if (startMins < karmaMins) return "brahma";
    if (startMins < vishramaMins) return "karma";
    return "vishrama";
}

// --- Block builder ---

let _idCounter = 0;
function makeBlock(
    startMins: number,
    durationMins: number,
    type: BlockType,
    label: string,
    period: TriKalaPeriod,
    isMandatory: boolean,
    extras: Partial<ScheduleBlock> = {}
): ScheduleBlock {
    const endMins = startMins + durationMins;
    return {
        id: `block-${_idCounter++}-${type}`,
        startTime: minutesToTime(startMins),
        endTime: minutesToTime(endMins),
        durationMins,
        type,
        label,
        period,
        isMandatory,
        ...extras,
    };
}

// --- Main generator ---

export function generateDailySchedule(
    profile: ScheduleProfile,
    activeMissionIds: string[],
    date: string
): DailySchedule {
    _idCounter = 0; // reset per generation

    const blocks: ScheduleBlock[] = [];
    const { anchors, commute, primaryGoal, userRole } = profile;
    const commuteDur = commute.transportType === "no_commute" ? 0 : commute.travelDurationMins;

    // Parse anchor times
    const wakeMins = parseTime(anchors.wakeTime);
    const breakfastMins = parseTime(anchors.breakfastTime);
    const lunchMins = parseTime(anchors.lunchTime);
    const dinnerMins = parseTime(anchors.dinnerTime);
    let workStartMins = parseTime(anchors.workStartTime);
    let workEndMins = parseTime(anchors.workEndTime);
    let sleepMins = parseTime(anchors.sleepTargetTime);

    // Handle next-day rollovers (e.g., sleep at 02:00 is past midnight)
    if (workEndMins <= workStartMins) workEndMins += 1440;
    if (sleepMins <= workEndMins) sleepMins += 1440;

    // Period boundaries
    const karmaMins = workStartMins;
    const vishramaMins = workEndMins;

    const period = (s: number) => assignPeriod(s, karmaMins, vishramaMins);

    let missionIdx = 0;
    const nextMission = () => activeMissionIds[missionIdx++] ?? undefined;

    // ── BRAHMA KALA (wake → workStart) ──────────────────────────────────────

    let cursor = wakeMins;

    // 1. Wake routine (30 min)
    blocks.push(makeBlock(cursor, 30, "wake_routine", "Morning Routine", "brahma", true));
    cursor += 30;

    // 2. Breakfast (if after cursor, leave gap as study first)
    if (breakfastMins > cursor + 15) {
        const studyDur = breakfastMins - cursor;
        blocks.push(makeBlock(cursor, studyDur, "study", studyLabel(primaryGoal), "brahma", true));
        cursor = breakfastMins;
    }
    // Breakfast block
    const bfEnd = Math.min(breakfastMins + 30, karmaMins);
    if (bfEnd > cursor) {
        blocks.push(makeBlock(cursor, bfEnd - cursor, "meal", "Breakfast", period(cursor), true));
        cursor = bfEnd;
    }

    // 3. Remaining Brahma time before work (study)
    if (karmaMins - cursor >= 20) {
        blocks.push(makeBlock(cursor, karmaMins - cursor, "study", studyLabel(primaryGoal), "brahma", true));
        cursor = karmaMins;
    } else if (cursor < karmaMins) {
        cursor = karmaMins;
    }

    // ── KARMA KALA (workStart → workEnd) ─────────────────────────────────────

    // 4. Commute TO
    if (commuteDur > 0) {
        blocks.push(makeBlock(cursor, commuteDur, "commute", "Commute to Work", "karma", true));
        cursor += commuteDur;
    }

    // 5. Work / lecture (with embedded lunch break if lunchMins falls inside)
    const workActualEnd = vishramaMins - commuteDur;
    if (lunchMins > cursor && lunchMins < workActualEnd - 30) {
        // Pre-lunch work
        blocks.push(makeBlock(cursor, lunchMins - cursor, "work", workLabel(userRole), "karma", true));
        // Lunch
        blocks.push(makeBlock(lunchMins, 45, "meal", "Lunch Break", "karma", true));
        cursor = lunchMins + 45;
        // Post-lunch work
        if (workActualEnd > cursor) {
            blocks.push(makeBlock(cursor, workActualEnd - cursor, "work", workLabel(userRole), "karma", true));
            cursor = workActualEnd;
        }
    } else {
        blocks.push(makeBlock(cursor, workActualEnd - cursor, "work", workLabel(userRole), "karma", true));
        cursor = workActualEnd;
    }

    // 6. Commute BACK
    if (commuteDur > 0) {
        blocks.push(makeBlock(cursor, commuteDur, "commute", "Commute Home", "karma", true));
        cursor += commuteDur;
    }

    // ── VISHRAMA KALA (workEnd → sleep) ──────────────────────────────────────

    // 7. Free time before dinner
    const windDownStart = sleepMins - 30;
    if (dinnerMins > cursor + 15 && dinnerMins < windDownStart) {
        if (dinnerMins - cursor >= 20) {
            blocks.push(makeBlock(cursor, dinnerMins - cursor, "free", "Free Time", "vishrama", false, { missionId: nextMission() }));
        }
        cursor = dinnerMins;
    }

    // 8. Dinner
    if (cursor < windDownStart - 30) {
        const dinnerDur = Math.min(45, windDownStart - cursor - 30);
        blocks.push(makeBlock(cursor, dinnerDur, "meal", "Dinner", "vishrama", true));
        cursor += dinnerDur;
    }

    // 9. Post-dinner free time
    if (windDownStart - cursor >= 20) {
        blocks.push(makeBlock(cursor, windDownStart - cursor, "free", "Evening Free Time", "vishrama", false, { missionId: nextMission() }));
        cursor = windDownStart;
    }

    // 10. Wind-down
    blocks.push(makeBlock(cursor, 30, "wind_down", "Wind Down", "vishrama", false));
    cursor += 30;

    // 11. Sleep
    blocks.push(makeBlock(cursor, 420, "sleep", "Sleep (7h)", "vishrama", false));

    // Merge user-defined custom blocks
    if (profile.customBlocks && profile.customBlocks.length > 0) {
        for (const cb of profile.customBlocks) {
            const startMins = parseTime(cb.startTime);
            let endMins = parseTime(cb.endTime);
            if (endMins <= startMins) endMins += 1440;
            const durationMins = endMins - startMins;
            const blockPeriod = assignPeriod(startMins, karmaMins, vishramaMins);
            blocks.push({
                id: `custom-${cb.id}`,
                startTime: cb.startTime,
                endTime: cb.endTime,
                durationMins,
                type: cb.type,
                label: cb.label,
                period: blockPeriod,
                isMandatory: false,
                isCompleted: false,
            });
        }
        blocks.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    }

    return {
        id: `schedule-${date}-${profile.id}`,
        user_id: profile.user_id,
        date,
        profile_id: profile.id,
        blocks,
        generatedAt: new Date().toISOString(),
        brahmaBoundary: anchors.wakeTime,
        karmaBoundary: anchors.workStartTime,
        vishramaBoundary: anchors.workEndTime,
    };
}

// --- "Now" helpers ---

export function currentTimeHHMM(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function findCurrentBlock(blocks: ScheduleBlock[]): ScheduleBlock | undefined {
    const nowMins = parseTime(currentTimeHHMM());
    return blocks.find((b) => {
        const s = parseTime(b.startTime);
        let e = parseTime(b.endTime);
        if (e < s) e += 1440; // next-day
        return nowMins >= s && nowMins < e;
    });
}
