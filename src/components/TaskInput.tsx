"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface TaskInputProps {
    onAdd: (title: string, priority: "High" | "Medium" | "Low") => void;
}

export default function TaskInput({ onAdd }: TaskInputProps) {
    const [title, setTitle] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            let finalText = title.trim();
            let priority: "High" | "Medium" | "Low" = "Medium";

            // Priority Shortcuts logic
            if (finalText.toLowerCase().includes("!h")) {
                priority = "High";
                finalText = finalText.replace(/!h/i, "").trim();
            } else if (finalText.toLowerCase().includes("!m")) {
                priority = "Medium";
                finalText = finalText.replace(/!m/i, "").trim();
            } else if (finalText.toLowerCase().includes("!l")) {
                priority = "Low";
                finalText = finalText.replace(/!l/i, "").trim();
            }

            if (finalText) {
                onAdd(finalText, priority);
                setTitle("");
            }
        }
    };

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
        >
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-4 bg-[#EFE0C8]/90 backdrop-blur-xl border border-[#252525]/10 p-4 rounded-full shadow-2xl shadow-[#252525]/10 group transition-all duration-300 ring-0 focus-within:ring-2 focus-within:ring-[#F78320] focus-within:border-[#F78320]"
            >
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a new task... (!h !m !l for priority)"
                    className="flex-1 bg-transparent text-[#252525] placeholder-[#252525]/50 outline-none text-lg font-medium selection:bg-[#F78320]/20"
                />

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    disabled={!title.trim()}
                    className="p-2 rounded-full bg-[#F78320] text-white hover:bg-[#F78320]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#F78320]/20"
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </form>
        </motion.div>
    );
}
