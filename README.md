# 🚨 Paramedic Triage Intake App

I used expo SDK 57 for this. I didnt have areal phone to test on .
As you can see in the video I had a brower and an Iphone emulator running the same project.
The pending updates are shown when you view it on web . You can see in the screenshot below that on offline mode a banner appears to show the pending records
The application turns the submit button from blue to red when the app is offline.

<img width="1217" height="709" alt="Screenshot 2026-07-12 at 15 03 54" src="https://github.com/user-attachments/assets/217e3e47-1977-4e98-9841-b23511bf6a4f" />


A high-performance, offline-first mobile application for emergency medical services field paramedics. Built with React Native (Expo), TypeScript, Redux Toolkit Query, and NativeWind.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)

- [Offline-First Architecture](#offline-first-architecture)
- [API Integration](#api-integration)


---

## Overview

Emergency medical personnel operate in high-stress, time-critical environments where cellular network coverage is often unstable or nonexistent. This application ensures that critical patient triage data is **never lost** — even when completely offline.

### Core Scenario

&gt; A paramedic responds to a multi-casualty incident in a remote area with no cell service. They log patient data into the app, which saves locally. Hours later, when the ambulance returns to coverage, all queued records automatically sync to the hospital dispatch system without any user intervention.

---

## Features

### 🏥 Triage Intake Form
- Single-screen, thumb-optimized form for rapid data entry under pressure
- **Priority 1–5 selector** with high-visibility hazard color-coding
  - P1 (Critical): Deep red with glow effect
  - P2 (Emergent): Deep orange
  - P3 (Urgent): Deep yellow
  - P4 (Less Urgent): Deep green
  - P5 (Non-Urgent): Deep blue
- Real-time validation with clear error messaging
- Dynamic critical alert banner for P1/P2 cases

### 📴 Offline-First Resilience
- **No failure on submit** — data always persists locally
- **Automatic background sync** when connectivity returns
- **Batch upload** of queued records (10 at a time) to prevent UI freezing
- **Retry with backoff** — max 5 attempts per record
- **Encrypted local storage** via AsyncStorage/MMKV

### 🔄 Background Sync Engine
- Network state monitoring via `@react-native-community/netinfo`
- 30-second polling interval when online
- App lifecycle awareness (syncs on foreground)
- Visual sync progress indicator

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo Router) |
| Language | TypeScript |
| Styling | NativeWind (Tailwind CSS for RN) |
| State Management | Redux Toolkit + RTK Query |
| Offline Storage | AsyncStorage (with MMKV option) |
| Network | NetInfo |
| UUID Generation | Custom RN-compatible generator |
| Backend API | Django REST Framework (mock) |

## Offline-First Architecture
<img width="682" height="258" alt="Screenshot 2026-07-10 at 17 46 41" src="https://github.com/user-attachments/assets/72c32017-e707-4372-b512-6088e6b82345" />



## Project Structure
<img width="682" height="791" alt="Screenshot 2026-07-10 at 17 41 38" src="https://github.com/user-attachments/assets/b3425a0a-8518-4977-b969-6c065c9a0557" />

## API Integration

# The API Slice
- There's a single API slice defined in triageApi.ts that configures the base URL and defines all the endpoints the app needs. RTK Query automatically generates React hooks for each endpoint — so instead of writing useEffect + fetch boilerplate, you get useSubmitTriageMutation() and useGetTriageRecordsQuery() hooks ready to use.

# Optimistic Updates
- When a paramedic submits online, RTK Query performs an optimistic update — it immediately adds the new record to the local cache before the server responds. If the server request fails, the update is automatically rolled back. This makes the UI feel instant while maintaining consistency.
Offline Interception
- The key architectural decision is that RTK Query does not handle offline queuing itself. Instead, the app intercepts failures at the component level:
1. Paramedic taps submit
2. App checks NetInfo connectivity state from Redux
3. If online: calls submitTriage() mutation
4. If offline (or mutation fails): creates a QueuedSubmission object and dispatches addToQueueAsync() to persist in AsyncStorage
This separation keeps RTK Query clean for online operations while the custom sync engine handles the offline queue.

## Data Flow Summary

<img width="702" height="570" alt="Screenshot 2026-07-12 at 14 58 05" src="https://github.com/user-attachments/assets/0e287bc2-295b-459d-9c46-96aa44ab1ffd" />


## Why RTK Query?
- Automatic caching — Records fetched from server are cached and deduplicated
- Built-in loading/error states — No manual isLoading booleans needed
- Standardized patterns — Every endpoint follows the same structure
- DevTools integration — Redux DevTools shows every query/mutation lifecycle
The trade-off is that RTK Query assumes a connected client. The offline queue layer was built specifically to fill that gap without fighting against RTK Query's design.
