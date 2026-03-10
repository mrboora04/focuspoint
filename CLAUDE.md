# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint check
```

No test suite exists yet. There are no individual test run commands.

## Architecture

**FocusPoint** is a gamified habit/challenge tracker. Stack: Next.js 16 App Router + TypeScript + Tailwind CSS 4 + Framer Motion + Supabase.

### State Management

All global state lives in [`src/context/FocusContext.tsx`](src/context/FocusContext.tsx) — a single React Context (~644 lines). This is the app's brain:

- Loads data from Supabase on init, then optimistically updates local state for responsiveness
- Manages missions, tap targets, user profile, and event log
- Handles daily logic: task resets, streak tracking, mercy/penalty system for missed days
- Provides all action functions to components via `useFocus()` hook

### Page & Component Structure

- `src/app/layout.tsx` — wraps everything in `FocusProvider` + renders `Navigation` and `GlobalOverlays`
- `src/components/GlobalOverlays.tsx` — single component that manages all modal/overlay rendering using `viewMode` state from context
- Views (`DashboardView`, `ActiveMissionView`, `TapCounter`) contain most UI logic; page files are thin wrappers

### Supabase Schema

Four tables: `user_profile`, `missions` (JSONB `data` field for nested config), `tap_targets` (JSONB `data`), `events` (activity log). User identity is anonymous device ID (localStorage), not auth-based.

### Theme System

Two themes defined as CSS custom properties in `src/app/globals.css`:
- **Light**: "Desert Glass" — cream/beige/orange (`--accent: #F78320`)
- **Dark**: "Espresso/Mocha" — deep brown tones

Theme toggled via `toggleTheme()` in context, persisted to localStorage. Use `.bg-theme-bg`, `.text-theme-text`, `.bg-theme-card`, `.border-theme-border` utility classes for theme-aware components.

### Key Patterns

- **Adding a new overlay/modal**: Add a `viewMode` value in context, render it in `GlobalOverlays.tsx`
- **Adding a new action**: Add to context state + expose via `FocusContextType`, call `logEvent()` + update Supabase async
- **New page**: Create `src/app/<route>/page.tsx`, add link in `Navigation.tsx`
