"use client";

import { useState, useEffect } from "react";
import ChallengeHeader from "@/components/ChallengeHeader";
import TaskCard from "@/components/TaskCard";
import TaskInput from "@/components/TaskInput";

interface Task {
  id: number;
  title: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed";
}

export default function Home() {
  // Start with an empty list to avoid "Server/Client Mismatch" errors
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. LOAD DATA (Run only once when app starts)
  useEffect(() => {
    const saved = localStorage.getItem("focuspoint-tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
    setIsLoaded(true); // UI is ready to show
  }, []);

  // 2. SAVE DATA (Run every time 'tasks' changes)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("focuspoint-tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const addTask = (title: string) => {
    const newTask: Task = {
      id: Date.now(),
      title,
      priority: "Medium", // Default
      status: "pending",
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const completeTask = (id: number, points: number) => {
    // If it's a FAIL (-15), keep it but mark as failed? 
    // For now, let's remove it to keep the list clean, or move to a "History" tab later.
    const newTasks = tasks.filter((t) => t.id !== id);
    setTasks(newTasks);

    // OPTIONAL: Save points to a separate score in localStorage
    const currentScore = parseInt(localStorage.getItem("focuspoint-score") || "0");
    localStorage.setItem("focuspoint-score", (currentScore + points).toString());
  };

  // Prevent hydration mismatch by not rendering the list until loaded
  if (!isLoaded) return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 pb-32 font-sans selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto space-y-10">

        <section id="header">
          <ChallengeHeader />
        </section>

        <section className="space-y-4 px-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                priority={task.priority}
                onComplete={(points) => completeTask(task.id, points)}
              />
            ))
          ) : (
            <div className="text-center py-10 opacity-50">
              <p className="text-xl font-light">No active missions.</p>
              <p className="text-sm mt-2">Add a task below to start the engine.</p>
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <TaskInput onAdd={addTask} />
      </div>
    </main>
  );
}