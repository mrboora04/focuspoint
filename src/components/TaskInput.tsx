"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface TaskInputProps {
    onAdd: (title: string) => void;
}

export default function TaskInput({ onAdd }: TaskInputProps) {
    const [title, setTitle] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(title.trim());
            setTitle(""); // Clear input immediately
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
                className="flex items-center gap-4 bg-[#F8F4E9]/80 backdrop-blur-xl border border-[#252525]/10 p-4 rounded-full shadow-2xl shadow-[#252525]/20 group focus-within:ring-2 focus-within:ring-[#F78320]/50 transition-all duration-300"
            >
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 bg-transparent text-[#252525] placeholder-[#252525]/40 outline-none text-lg font-medium selection:bg-[#F78320]/20"
                />

                <button
                    type="submit"
                    disabled={!title.trim()}
                    className="p-2 rounded-full bg-[#F78320] text-white hover:bg-[#F78320]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#F78320]/20"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>
        </motion.div>
    );
}
