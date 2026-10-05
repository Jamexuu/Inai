# Inai 💊 - Maintenance Medication Tracker

**Inai** is a mobile app I am building for my mom to help her comfortably manage her daily maintenance medications. She has to take multiple pills throughout the day, and keeping track of exact times, dosages, and prescription refills can quickly become overwhelming. I designed Inai to give her a simple, accessible, and stress-free way to stay on top of her daily health routine.

---

## 💡 Why I'm Building This

My mom has a lot of maintenance medicines to consume each day, and I noticed how easy it is to get confused about whether a dose was already taken, miss a scheduled time, or lose track of when a refill is due. 

Most generic health apps are bloated, complex, and full of small text that can be frustrating for seniors. I built **Inai** with a direct focus on my mom's needs: a high-contrast, large-font, senior-friendly app where she can view her daily schedule clearly, log doses with a single tap, and receive gentle reminders so she never misses a pill.

---

## ✨ Features I'm Building

- 📅 **Daily Medication Schedule**: Clear timeline grouped into **Morning**, **Afternoon**, **Evening**, and **Bedtime**.
- 🔘 **One-Tap Dose Logging**: Easy buttons to mark medicines as **Taken**, **Skipped**, or **Pending** with instant visual feedback.
- 🔔 **Timely Reminders**: Local notification alarms scheduled for each medication time slot.
- 📦 **Pill Inventory & Refill Alerts**: Tracks remaining pill counts so I know exactly when to get her refills.
- 👁️ **Senior-Friendly Accessibility**: Extra-large typography, high contrast colors, simple navigation, and clear visual indicators.
- 📋 **Medication History**: A clean history log we can bring to her doctor appointments.

---

## 🛠️ Technical Stack & Architecture

- **Framework**: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) & [React Native 0.86](https://reactnative.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction) (File-based routing)
- **UI Components**: Custom accessible themed components (`ThemedText`, `ThemedView`)
- **State & Storage**: React Hooks & Local Storage

---

## 📁 Project Structure

```
Inai/
├── src/
│   ├── app/                # Expo Router screens & layout
│   │   ├── _layout.tsx     # Root tab layout navigation
│   │   ├── index.tsx       # Main daily schedule & medicine tracker screen
│   │   └── explore.tsx     # Medication list & settings screen
│   ├── components/         # Reusable UI & accessible components
│   │   ├── ui/             # Core UI elements (collapsible, icons, badges)
│   │   ├── themed-text.tsx # Senior-friendly accessible text component
│   │   └── themed-view.tsx # Theme-aware background views
│   ├── constants/          # Theme colors, typography, spacing, and layout bounds
│   └── hooks/              # Custom React hooks (useTheme, useColorScheme)
├── assets/                 # App icons, splash screens, and images
├── app.json                # Expo project configuration
└── package.json            # Project dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or newer recommended).

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npx expo start
```

In the interactive CLI output, choose how to run the app:
- Press `a` to run on an **Android Emulator** or connected Android device
- Press `i` to run on an **iOS Simulator** (macOS required)
- Press `w` to run in the **Web Browser**
- Scan the QR code with **Expo Go** (Android) or the Camera app (iOS)

---

## 🗺️ My Roadmap & Next Steps

- [ ] **Phase 1: Medication Data Model & Local State** — Define data structures for pills, doses, daily schedules, and inventory counts.
- [ ] **Phase 2: Local Notifications (`expo-notifications`)** — Configure recurring dose alarms for each time slot.
- [ ] **Phase 3: Persistent Storage (`AsyncStorage` / SQLite)** — Save medicine logs locally across app launches.
- [ ] **Phase 4: Doctor / Caregiver Summary** — Add a clean summary view to show her doctor during visits.

---

## 📄 License

Private personal project built with love for my family.
