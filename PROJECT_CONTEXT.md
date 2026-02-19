# Project Context: Computational Thinking & Algorithms Educational App

## 1. Project Overview
**Goal:** Developing a mobile-first educational application for a Thesis research project.
**Topic:** Computational Thinking & Algorithms learning for students.
**Key Features:**
- **Gamification:** XP, Levels, Badges (comparative study: Gamified vs Non-Gamified).
- **Crossover Design:** Research requires switching users between control/experiment groups.
- **Interactive Modules:**
  - **Chapter 2:** Pattern Recognition (Bead patterns/Gelang) - Drag & Drop.
  - **Chapter 7:** Visual Programming (Similar to Scratch) - Logic blocks & Canvas.

## 2. Technical Architecture (Hybrid Strategy)
We are using a **Hybrid Architecture** to leverage the best of both worlds:

### A. Host App (React Native / Expo)
- **Role:** The main application installed on user devices.
- **Responsibilities:**
  - Authentication (Login/Register).
  - Main Dashboard & Navigation.
  - **Chapter 2 Implementation:** Native Drag-and-Drop for better performance/gestures.
  - Global State Management (User Session, Gamification Stats).
  - **WebView Container:** Loads the Web App for complex visual programming tasks.

### B. Micro-Frontend / Web Engine (React + Vite)
- **Role:** A specialized web application running inside a WebView within the Native App.
- **Responsibilities:**
  - **Chapter 7 Implementation:** Hosts the **Blockly** engine and **React Konva** stage.
  - Why Web? Blockly relies heavily on the DOM and is difficult/buggy to implement in pure React Native.
- **Hosting:** Deployed on Vercel (e.g., `https://my-app.vercel.app/embed/chapter7`).

## 3. Current Progress

### Repository 1: Web Engine (React + Vite) - *[DONE / MVP Ready]*
- **Stack:** React, TypeScript, Tailwind CSS, Zustand, Supabase, Google Blockly, React Konva.
- **Features Implemented:**
  - **Blockly Workspace:** Custom blocks defined in Indonesian (`gerak_maju`, `putar_kanan`, `ulangi`, etc.).
  - **Visual Stage:** Animated Cat sprite on a grid using `react-konva`.
  - **Code Execution:** Javascript generator that executes block logic to animate the sprite.
  - **Embedded Mode:** A specific route (`/embed/chapter7`) that hides the web header/footer/nav to look seamless inside a WebView.
  - **Bridge Utility:** A generic `postMessage` bridge to send events (like `ACTIVITY_COMPLETE`) from Web to Native.

### Repository 2: Mobile App (React Native / Expo) - *[JUST STARTED]*
- **Stack:** React Native (Expo), TypeScript, Supabase, `react-native-webview`.
- **Planned Features:**
  - **Dashboard:** Display Modules and User Stats.
  - **Chapter 2:** To be built using `react-native-drax` or `react-native-reanimated`.
  - **WebView Integration:** A screen that loads the Web Engine URL and listens for messages (Score/XP updates) via `onMessage`.

## 4. Backend & Data (Supabase)
- **Database:** PostgreSQL.
- **Key Tables:**
  - `profiles`: User info + Group Type (A/B).
  - `activity_logs`: Tracks time spent, attempts, and scores (Crucial for Thesis Data: Y1, Y2, Y3 variables).
  - `gamification_stats`: XP, Level, Badges.
- **Logic:** Authentication works on Native; Session token might need to be passed to Web View for secure API calls.

## 5. Immediate Roadmap & Challenges
1.  **React Native Implementation:** Need to build the Dashboard and the Native Drag-and-Drop (Chapter 2).
2.  **The Bridge:** Ensure robust 2-way communication.
    - *Native -> Web:* "Set Gamified Mode = ON", "Pass Auth Token".
    - *Web -> Native:* "Level Finished", "Update XP".
3.  **Data Sync:** ensuring that when a user finishes a web activity, the native app updates the UI immediately.

## 6. Request to AI
"Based on this context, please help me with [YOUR_SPECIFIC_QUESTION]..."
