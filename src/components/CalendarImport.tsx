"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Upload, CheckCircle2, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { parseICS } from "@/lib/calendarIntegration";
import { useFocus } from "@/context/FocusContext";

const CALENDAR_GUIDES = [
    {
        id: "google",
        name: "Google Calendar",
        emoji: "🗓",
        color: "#4285F4",
        steps: [
            "Open calendar.google.com in your browser",
            "Click the ⚙ Settings gear icon → Settings",
            "In the left sidebar, click on your calendar name under 'My calendars'",
            "Scroll down to 'Export calendar' and click Export",
            "A .ics.gz file downloads — extract it to get the .ics file",
            "Drag the .ics file into the drop zone above",
        ],
    },
    {
        id: "outlook",
        name: "Outlook",
        emoji: "📧",
        color: "#0072C6",
        steps: [
            "Open Outlook (desktop app or outlook.com)",
            "Go to File → Open & Export → Import/Export",
            "Choose 'Export to a file' → Next",
            "Select 'iCalendar (.ics)' → Next",
            "Pick your calendar folder and choose a save location",
            "Click Finish — then drag the saved .ics file here",
        ],
        webSteps: [
            "On outlook.com: click the Settings gear → View all Outlook settings",
            "Go to Calendar → Shared calendars",
            "Under 'Publish a calendar' select your calendar and 'All events'",
            "Copy the ICS link, paste it in your browser to download the file",
            "Drag the downloaded .ics file into the drop zone above",
        ],
    },
    {
        id: "apple",
        name: "Apple Calendar",
        emoji: "🍎",
        color: "#FF3B30",
        steps: [
            "Open the Calendar app on your Mac",
            "In the sidebar, right-click (or Control-click) the calendar you want",
            "Click 'Export…'",
            "Choose a save location and click Export",
            "Drag the exported .ics file into the drop zone above",
        ],
        iosSteps: [
            "On iPhone/iPad, go to Settings → Calendar → Accounts",
            "Tap iCloud → Calendar → tap your calendar",
            "Use the share icon and select 'Copy Link'",
            "Paste the link in Safari, which downloads the .ics file",
            "Transfer the file to your computer and drag it above",
        ],
    },
    {
        id: "windows",
        name: "Windows Calendar",
        emoji: "🪟",
        color: "#00BCF2",
        steps: [
            "Open the Calendar app from the Windows Start menu",
            "Click the Settings cog (bottom-left) → Manage Accounts",
            "Select the account you want to export",
            "Most Windows Calendar accounts sync via Outlook — use the Outlook guide",
            "Alternatively, open outlook.com → download the .ics and drag it above",
        ],
    },
];

export default function CalendarImport() {
    const { state, addCalendarEvents, clearCalendarEvents } = useFocus();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

    const processFile = (file: File) => {
        if (!file.name.endsWith(".ics")) {
            setStatus("error");
            setStatusMessage("Only .ics calendar files are supported. See the guides below for how to export one.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const events = parseICS(content);
                if (events.length === 0) {
                    setStatus("error");
                    setStatusMessage("No events found in this file for today.");
                    return;
                }
                addCalendarEvents(events);
                setStatus("success");
                setStatusMessage(`${events.length} event${events.length === 1 ? "" : "s"} imported from ${file.name}`);
            } catch {
                setStatus("error");
                setStatusMessage("Could not parse the calendar file. Make sure it's a valid .ics export.");
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const calendarEventCount = state.calendarEvents.length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black tracking-widest uppercase text-white/70">Import Calendar</span>
                    <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Local · Private</span>
                </div>
                {calendarEventCount > 0 && (
                    <button
                        onClick={() => { clearCalendarEvents(); setStatus("idle"); }}
                        className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Clear ({calendarEventCount})
                    </button>
                )}
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                    isDragging
                        ? "border-purple-400/60 bg-purple-500/10"
                        : "border-white/15 hover:border-purple-400/40 hover:bg-purple-500/5"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <Upload className="w-6 h-6 text-white/30 mx-auto mb-2" />
                <p className="text-xs text-white/60 font-bold">Drop .ics file here or tap to browse</p>
                <p className="text-[10px] text-white/25 mt-0.5">Supports Google · Outlook · Apple · Windows Calendar</p>
            </div>

            {/* Status feedback */}
            <AnimatePresence>
                {status !== "idle" && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                            status === "success"
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                                : "bg-red-500/10 border border-red-500/20 text-red-300"
                        }`}
                    >
                        {status === "success"
                            ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            : <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        }
                        <span>{statusMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Imported events list */}
            {calendarEventCount > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] text-white/25 tracking-widest uppercase">Today&apos;s Events</p>
                    {state.calendarEvents.slice(0, 5).map(ev => (
                        <div key={ev.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/8 text-xs">
                            <FileText className="w-3 h-3 text-purple-400/60 flex-shrink-0" />
                            <span className="text-white/70 truncate">{ev.title}</span>
                            <span className="text-white/30 ml-auto font-mono flex-shrink-0">
                                {ev.startTime instanceof Date
                                    ? `${String(ev.startTime.getHours()).padStart(2,"0")}:${String(ev.startTime.getMinutes()).padStart(2,"0")}`
                                    : ""}
                            </span>
                        </div>
                    ))}
                    {calendarEventCount > 5 && (
                        <p className="text-[10px] text-white/25 px-1">+{calendarEventCount - 5} more events</p>
                    )}
                </div>
            )}

            {/* Step-by-step guides */}
            <div className="space-y-1.5">
                <p className="text-[10px] text-white/25 tracking-widest uppercase pt-1">How to export your calendar</p>
                {CALENDAR_GUIDES.map(guide => (
                    <div key={guide.id} className="rounded-xl overflow-hidden border border-white/8">
                        <button
                            onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-base leading-none">{guide.emoji}</span>
                                <span className="text-xs font-bold text-white/70">{guide.name}</span>
                            </div>
                            {expandedGuide === guide.id
                                ? <ChevronUp className="w-3.5 h-3.5 text-white/30" />
                                : <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                            }
                        </button>
                        <AnimatePresence>
                            {expandedGuide === guide.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1">
                                        {guide.steps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-2 text-[11px] text-white/50 leading-snug">
                                                <span
                                                    className="font-black text-[10px] mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                                                    style={{ background: `${guide.color}25`, color: guide.color }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}
