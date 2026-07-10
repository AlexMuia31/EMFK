# 🚨 Paramedic Triage Intake App

A high-performance, offline-first mobile application for emergency medical services field paramedics. Built with React Native (Expo), TypeScript, Redux Toolkit Query, and NativeWind.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Offline-First Architecture](#offline-first-architecture)
- [API Integration](#api-integration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

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

---

## Project Structure
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Paramedic     │────▶│   TriageForm    │────▶│   Validation    │
│   Clicks Submit │     │   (UI Layer)    │     │   (Client-side) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                              ┌───────────────────────┼───────────────────────┐
                              │                       │                       │
                              ▼                       ▼                       ▼
                        ┌─────────┐           ┌─────────────┐          ┌─────────────┐
                        │  Online │           │   Offline   │          │ Server Error│
                        └────┬────┘           └──────┬──────┘          └──────┬──────┘
                             │                        │                        │
                             ▼                        ▼                        ▼
                        ┌─────────┐           ┌─────────────┐          ┌─────────────┐
                        │RTK Query│           │ AsyncStorage│          │ AsyncStorage│
                        │  POST   │           │   Queue     │          │   Queue     │
                        │  /submit│           │   + Record  │          │   + Record  │
                        └────┬────┘           └─────────────┘          └─────────────┘
                             │
                             ▼
                        ┌─────────┐
                        │  Server │
                        │  201 OK │
                        └─────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKGROUND SYNC ENGINE                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ NetInfo     │───▶│ AppState    │───▶│ 30s Timer   │───▶│ Batch Upload (10)   │  │
│  │ Listener    │    │ Foreground  │    │ Interval    │    │ RTK Query /batch    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                              │      │
│                                                                              ▼      │
│                                                                       ┌─────────┐   │
│                                                                       │  Server │   │
│                                                                       │  201 OK │   │
│                                                                       └────┬────┘   │
│                                                                            │        │
│                                                                            ▼        │
│                                                                       ┌─────────┐   │
│                                                                       │ Dequeue │   │
│                                                                       │  Record │   │
│                                                                       └─────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
