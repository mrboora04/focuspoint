"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Upload, CheckCircle2, X, FileText } from "lucide-react";
import { parseICS } from "@/lib/calendarIntegration";
import { useFocus } from "@/context/FocusContext";

export default function CalendarImport() {
    const { state, addCalendarEvents, clearCalendarEvents } = useFocus();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");

    const processFile = (file: File) => {
        if (!file.name.endsWith(".ics")) {
            setStatus("error");
            setStatusMessage("Only .ics calendar files are supported.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const events = parseICS(content);
                if (events.length === 0) {
                    setStatus("error");
                    setStatusMessage("No events found in this file.");
                    return;
                }
                addCalendarEvents(events);
                setStatus("success");
                setStatusMessage(`${events.length} event${events.length === 1 ? "" : "s"} imported from ${file.name}`);
            } catch {
                setStatus("error");
                setStatusMessage("Could not parse the calendar file.");
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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black tracking-widest uppercase text-white/70">Local Calendar</span>
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
                <p className="text-xs text-white/50 font-bold">Drop .ics file or tap to browse</p>
                <p className="text-[10px] text-white/25 mt-0.5">Google Calendar / Apple / Outlook exports</p>
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
                    <p className="text-[10px] text-white/25 tracking-widest uppercase">Imported Events</p>
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
                        <p className="text-[10px] text-white/25 px-1">+{calendarEventCount - 5} more</p>
                    )}
                </div>
            )}
        </div>
    );
}
