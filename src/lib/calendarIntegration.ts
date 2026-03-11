import { ScheduleBlock, TriKalaPeriod } from "@/types/schedule";

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    description?: string;
    location?: string;
    isAllDay?: boolean;
}

/**
 * Basic parser for .ics (vCalendar) file content.
 * Looks for VEVENT blocks and extracts basic properties.
 */
export function parseICS(icsContent: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = icsContent.replace(/\r\n/g, "\n").split("\n");
    let currentEvent: Partial<CalendarEvent> | null = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle folding (lines starting with space/tab are continuations)
        while (i + 1 < lines.length && (lines[i + 1].startsWith(" ") || lines[i + 1].startsWith("\t"))) {
            line += lines[i + 1].substring(1);
            i++;
        }

        if (line === "BEGIN:VEVENT") {
            currentEvent = { id: crypto.randomUUID() };
        } else if (line === "END:VEVENT" && currentEvent && currentEvent.title && currentEvent.startTime && currentEvent.endTime) {
            events.push(currentEvent as CalendarEvent);
            currentEvent = null;
        } else if (currentEvent) {
            const separatorIdx = line.indexOf(":");
            if (separatorIdx === -1) continue;

            const propPart = line.substring(0, separatorIdx);
            const value = line.substring(separatorIdx + 1);

            // Extract core property name (before any semicolons containing params)
            const propName = propPart.split(";")[0];

            switch (propName) {
                case "SUMMARY":
                    currentEvent.title = value;
                    break;
                case "DESCRIPTION":
                    currentEvent.description = value.replace(/\\n/g, "\n");
                    break;
                case "LOCATION":
                    currentEvent.location = value.replace(/\\n/g, " ");
                    break;
                case "DTSTART":
                    currentEvent.startTime = parseICalDate(value);
                    if (value.length === 8) currentEvent.isAllDay = true;
                    break;
                case "DTEND":
                    currentEvent.endTime = parseICalDate(value);
                    break;
            }
        }
    }

    return events;
}

function parseICalDate(val: string): Date {
    // Format: YYYYMMDDThhmmssZ or YYYYMMDD
    const year = parseInt(val.substring(0, 4));
    const month = parseInt(val.substring(4, 6)) - 1;
    const day = parseInt(val.substring(6, 8));

    if (val.length === 8) {
        return new Date(year, month, day);
    }

    let hour = parseInt(val.substring(9, 11));
    let min = parseInt(val.substring(11, 13));
    let sec = parseInt(val.substring(13, 15));

    // If it ends in Z, it's UTC
    if (val.endsWith("Z")) {
        return new Date(Date.UTC(year, month, day, hour, min, sec));
    }

    // Otherwise assume local time (Technically we should respect TZID but this is a simple local parser)
    return new Date(year, month, day, hour, min, sec);
}

/**
 * Merges external calendar events into the focus schedule.
 * Modifies the schedule array by injecting "Conflict" warnings or treating events as Karma Kala.
 */
export function mergeCalendarIntoSchedule(scheduleBlocks: ScheduleBlock[], events: CalendarEvent[]): ScheduleBlock[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter events for today only
    const todayEvents = events.filter(e =>
        e.startTime >= today && e.startTime < tomorrow && !e.isAllDay
    );

    const merged = [...scheduleBlocks];

    for (const e of todayEvents) {
        const sh = e.startTime.getHours().toString().padStart(2, '0');
        const sm = e.startTime.getMinutes().toString().padStart(2, '0');
        const eh = e.endTime.getHours().toString().padStart(2, '0');
        const em = e.endTime.getMinutes().toString().padStart(2, '0');

        const startMins = e.startTime.getHours() * 60 + e.startTime.getMinutes();
        const endMins = e.endTime.getHours() * 60 + e.endTime.getMinutes();
        const durationMins = endMins > startMins ? endMins - startMins : 30;

        merged.push({
            id: `cal_${e.id}`,
            period: "karma", // Default external events to karma
            type: "free",
            startTime: `${sh}:${sm}`,
            endTime: `${eh}:${em}`,
            label: `📅 ${e.title}`,
            isMandatory: true,
            isCompleted: false,
            durationMins,
        });
    }

    // Re-sort by start time
    merged.sort((a, b) => {
        const aTime = a.startTime.replace(":", "");
        const bTime = b.startTime.replace(":", "");
        return aTime.localeCompare(bTime);
    });

    return merged;
}
