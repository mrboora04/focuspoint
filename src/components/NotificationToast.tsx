"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useFocus, AppNotification } from "@/context/FocusContext";
import { Bell, CheckCircle2, AlertTriangle, Calendar, Info, X } from "lucide-react";

export default function NotificationToast() {
    const { state, dismissNotification } = useFocus();

    // Auto-dismiss logic happens in the effect
    const { notifications } = state;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
            <AnimatePresence>
                {notifications.map((notif) => {
                    let Icon = Info;
                    let iconColor = "text-blue-500";
                    let bgColor = "bg-theme-card/90";
                    let borderColor = "border-blue-500/20";

                    switch (notif.type) {
                        case "success":
                            Icon = CheckCircle2;
                            iconColor = "text-emerald-500";
                            borderColor = "border-emerald-500/30";
                            break;
                        case "warning":
                            Icon = AlertTriangle;
                            iconColor = "text-[#F78320]";
                            borderColor = "border-[#F78320]/30";
                            break;
                        case "event":
                            Icon = Calendar;
                            iconColor = "text-purple-500";
                            borderColor = "border-purple-500/30";
                            break;
                        case "info":
                        default:
                            Icon = Bell;
                            break;
                    }

                    return (
                        <motion.div
                            key={notif.id}
                            initial={{ y: -50, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -20, opacity: 0, scale: 0.95 }}
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl backdrop-blur-xl border shadow-xl ${bgColor} ${borderColor}`}
                        >
                            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 pr-6 relative">
                                <h4 className="font-bold text-sm text-theme-text">{notif.title}</h4>
                                <p className="text-xs text-theme-text/70 mt-0.5 leading-relaxed">{notif.message}</p>

                                <button
                                    onClick={() => dismissNotification(notif.id)}
                                    className="absolute -top-1 -right-2 p-1 text-theme-text/40 hover:text-theme-text transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
