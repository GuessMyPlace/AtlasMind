# AtlasMind 🌍✨

> **AI-Powered Geographic Data Generation & Management Platform for GuessMyPlace**

AtlasMind is a highly polished, full-stack enterprise dashboard and geographic data pipeline. It enables developers and administrators to model, generate, validate, and manage global location records, progressive gameplay clues, and trivia questions powered by Gemini models for the *GuessMyPlace* geographic guessing game.

---

## 🎨 Visual Preview & Design Philosophy

AtlasMind is built with a custom-crafted **Deep Cosmic Slate** visual identity, utilizing generous negative space, crisp "Space Grotesk" displays paired with "JetBrains Mono" metrics, and fluid transition animations powered by `motion`.

The interface is entirely responsive, lightweight, and focused on high data density without layout clutter.

---

## 🚀 Key Features

### 📊 1. Interactive Operations Dashboard
* **Dynamic Analytics**: Real-time visualization of database records, place distribution (Landmarks, Cities, Countries), and historical token usage using custom Recharts layers.
* **Token & Quota Telemetry**: Live tracker for Gemini API requests and consumption logs.
* **API Health Monitor**: Live diagnostics showing server uptime, background worker synchronization, and API connectivity.

### 🧠 2. Intelligent AI Generation Engine (`Generate`)
* **Smart Duplicate Checker**: Pre-validates location lists to prevent duplicate database entries.
* **Gemini-Powered Generation**: Generates comprehensive location dossiers including search tags, progressive difficulty clues, exact bounding coordinate estimations, and custom multiple-choice trivia.
* **Bulk Processing**: Schedule instant or delayed queues to process batch location requests.

### 🗺️ 3. Expansion Roadmap (`Roadmap`)
* **Phase-Based Expansion**: Group regions, countries, and major cities into strategic milestones.
* **Cost & API Quota Estimates**: Displays real-time estimated resource cost per phase before starting generation runs.
* **One-Click Progression**: Automated integration to start generating geographic details directly from roadmap items.

### 🛠️ 4. Data Explorer & Validation Queue
* **Live Database Querying**: Live search and deletion of custom-generated geographical locations.
* **Linked Trivia Inspection**: Directly review, verify, and clean up generated clues and multiple-choice options.
* **Reported Queue Resolution**: Manage manual requests and unresolved missing places reported by actual players in *GuessMyPlace*.

### 💼 5. Task Scheduler & Job Manager (`Jobs`)
* **Thread Controller**: Complete life cycle control over running tasks (Pause, Resume, Cancel).
* **Metrics Tracker**: Live bar showing process duration, error-handling rates, and exportable JSON outputs.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 19 (Hooks), Vite 6, Tailwind CSS v4, Framer Motion (`motion/react`) |
| **Backend** | Node.js, Express, TypeScript (`tsx`), ESBuild |
| **Data Viz** | Recharts, Lucide Icons |
| **AI SDK** | `@google/genai` TypeScript SDK (Gemini Integration) |
| **Storage** | Dynamic file-backed local database with persistent seed structures |

---

## 📂 Project Structure

```bash
├── backend/                # Server-side business logic and controllers
├── src/
│   ├── api/                # API client modules proxying to backend
│   ├── components/         # Reusable dashboard widgets and layouts
│   │   ├── layout/         # Header, Navigation, and Sidebar layouts
│   │   ├── ui/             # Core styled micro-elements (Buttons, Progress)
│   │   ├── Dashboard.tsx   # Visual statistics charts and logs
│   │   ├── DataExplorer.tsx# Database query and item inspector
│   │   └── QueueView.tsx   # Missing ticket resolution panel
│   ├── hooks/              # Custom application React hooks
│   ├── pages/              # Primary route views (Dashboard, Generate, Roadmap, Settings)
│   ├── stores/             # Client-side state engines (Zustand)
│   ├── types/              # Domain-specific TypeScript declarations
│   ├── database.ts         # Mock seed database initializer
│   ├── generator.ts        # Geographic record automation logic
│   ├── index.css           # Global custom theme and CSS variables
│   ├── main.tsx            # Main application bootstrapper
│   └── App.tsx             # Root routing coordinator
├── server.ts               # Full-stack Express server entrypoint
├── package.json            # Scripts, workspace declarations, and packages
├── tsconfig.json           # Type definitions compiler specifications
└── vite.config.ts          # Build plugin chains and proxy configurations
```

---



---

## 🛡️ License
Distributed under the GPL-v3 License. Developed for **GuessMyPlace** operations.
