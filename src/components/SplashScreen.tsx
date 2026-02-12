"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Target } from "lucide-react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onFinish, 500); // Wait for exit animation
        }, 2000);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#1E1A17] ${!isVisible ? "pointer-events-none" : ""}`}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="flex flex-col items-center gap-4"
            >
                <div className="w-24 h-24 bg-[#F78320] rounded-[2rem] flex items-center justify-center shadow-[0_0_60px_rgba(247,131,32,0.4)]">
                    <Target className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-black text-[#EFE0C8] tracking-widest uppercase"
                >
                    FocusPoint
                </motion.h1>
            </motion.div>
        </motion.div>
    );
}
