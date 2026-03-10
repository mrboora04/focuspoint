// NEXUS Local Memory — all personal data stays in localStorage, never hardcoded.

export interface NexusMemory {
    name?: string;
    notes: string[];          // freeform lines the user or NEXUS writes
    updatedAt: string;
}

const KEY = "nexus_memory_v1";

export function readMemory(): NexusMemory {
    if (typeof window === "undefined") return { notes: [], updatedAt: "" };
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw) as NexusMemory;
    } catch { /* ignore */ }
    return { notes: [], updatedAt: "" };
}

export function writeMemory(mem: NexusMemory): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify({ ...mem, updatedAt: new Date().toISOString() }));
}

export function addNote(note: string): void {
    const mem = readMemory();
    mem.notes = [note, ...mem.notes].slice(0, 50); // keep last 50 notes
    writeMemory(mem);
}

export function clearMemory(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
}
