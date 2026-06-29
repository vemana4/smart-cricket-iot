# IoT Cricket Analytics

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Arduino](https://img.shields.io/badge/Arduino-ESP32-00979D?logo=arduino&logoColor=white)](https://www.arduino.cc)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The IoT Cricket Analytics platform is a state-of-the-art, end-to-end hardware and software solution engineered specifically to modernize professional cricket training and match analysis. Designed for high-performance sports analytics, the system leverages highly optimized ESP32 microcontrollers equipped with specialized 6-axis Inertial Measurement Units (IMUs) and piezoelectric sensors. These precision components are mounted directly onto standard cricket stumps to capture micro-second, high-fidelity impact data—including exact force, contact angle, and complex vibration signatures—the instant a cricket ball strikes the wicket.

This raw sensor data is immediately transmitted via high-speed telemetry to a highly scalable, robust Node.js and Express.js ingestion API. Within the backend infrastructure, a custom-built physics engine reconstructs the ball's precise trajectory, calculates momentum transfer, and automatically classifies the delivery type. The backend is designed for high availability and low-latency processing, ensuring that critical match events and wicket detection algorithms are processed in real-time without bottlenecks, making it suitable for live broadcasting and immediate coach feedback.

Finally, the processed analytics are streamed to a high-performance React-based frontend dashboard. This web interface features advanced WebGL-accelerated 3D visualizations that allow coaches and players to interactively review ball impacts, wicket strikes, and pitch analytics from multiple angles. By providing granular data on bowling accuracy, swing metrics, and pitch interaction, the platform empowers teams to make data-driven decisions, fine-tune bowling strategies, and fundamentally elevate their competitive edge.

---

## ✨ Features

- **📡 Real-Time Telemetry** — ESP32 microcontroller captures impact force, angle, and velocity at the stump
- **⚡ Physics Engine** — Server-side ball trajectory reconstruction and delivery classification
- **🎯 Wicket Detection** — Automatic wicket event recognition with timestamp and delivery context
- **📊 Quantum Pitch Dashboard** — WebGL-powered analytics dashboard for session review and trend analysis
- **🔧 Device Calibration** — Remote sensor calibration endpoints for field setup
- **📋 Session Management** — Track practice sessions, match innings, and historical delivery data
- **🏏 Delivery Analytics** — Classify deliveries by speed, swing, seam, and bounce characteristics

### 📊 Feature Capability Matrix

| Feature | Component | Ingestion Latency | Data Processing | Primary User |
| :--- | :--- | :--- | :--- | :--- |
| **Real-Time Telemetry** | `esp32/` | < 50ms | Raw Sensor Stream (SPI/I2C) | Hardware Dev / Coach |
| **Physics Engine** | `api-server/` | < 100ms | Trajectory Vector Reconstruction | Analyst / Coach |
| **Wicket Detection** | `api-server/` | < 10ms | Event Ingestion & Pusher Event | Broadcaster / Umpire |
| **Quantum Dashboard** | `quantum-pitch/` | < 150ms | WebGL 3D Visualization | Player / Coach |
| **Device Calibration** | `api-server/` | < 200ms | Sensor Offset Ingestion | Hardware Technician |

---

## 🏗️ System Architecture

```
┌─────────────────┐     HTTP/WS      ┌──────────────────┐      React       ┌─────────────────────┐
│                 │ ──────────────►   │                  │ ◄──────────────  │                     │
│   ESP32 Stump   │   Telemetry      │   Ingestion API  │    Queries       │  Quantum Pitch      │
│   Firmware      │   Payloads       │   (Express.js)   │    & Events      │  Dashboard (React)  │
│                 │                  │                  │                  │                     │
│  • IMU Sensor   │                  │  • Physics Engine│                  │  • Live Feed        │
│  • Piezo Impact │                  │  • Session Mgmt  │                  │  • WebGL Viz        │
│  • WiFi Module  │                  │  • Wicket Logic  │                  │  • Session Review   │
│  • Battery Mgmt │                  │  • Pusher Events │                  │  • Player Stats     │
└─────────────────┘                  └──────────────────┘                  └─────────────────────┘
```

---

## 📁 Project Structure

```
iot-cricket-analytics/
├── esp32/
│   └── cricket_stump.ino        # Arduino firmware for ESP32
│
├── artifacts/
│   ├── api-server/              # Node.js Telemetry Ingestion API
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── physicsEngine.ts    # Ball trajectory & physics
│   │   │   │   ├── pusher.ts           # Real-time event broadcasting
│   │   │   │   └── logger.ts           # Structured logging
│   │   │   └── routes/
│   │   │       ├── telemetry.ts        # Sensor data ingestion
│   │   │       ├── stump.ts            # Stump device management
│   │   │       ├── deliveries.ts       # Delivery records & queries
│   │   │       ├── wickets.ts          # Wicket event tracking
│   │   │       ├── session.ts          # Session lifecycle
│   │   │       ├── calibrate.ts        # Remote calibration
│   │   │       ├── dashboard.ts        # Aggregated statistics
│   │   │       └── info.ts             # Device info & health
│   │   └── package.json
│   │
│   ├── quantum-pitch/           # React Analytics Dashboard
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── components/
│   │   │       ├── Layout.tsx
│   │   │       ├── WebGLFallback.tsx
│   │   │       └── ui/              # Shadcn/UI components
│   │   └── package.json
│   │
│   └── mockup-sandbox/          # UI Component Sandbox
│
├── lib/                         # Shared Packages
│   ├── api-client-react/        # Auto-generated React hooks
│   ├── api-spec/                # OpenAPI specification
│   ├── api-zod/                 # Zod validation schemas
│   └── db/                      # Database layer
│
├── pnpm-workspace.yaml
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Arduino IDE** 2.x (for ESP32 firmware)
- **ESP32 Dev Board** with IMU and piezoelectric sensors

### Software Setup

```bash
# Clone the repository
git clone https://github.com/vemana4/iot-cricket-analytics.git
cd iot-cricket-analytics

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Start the ingestion API
pnpm --filter api-server dev

# Start the analytics dashboard
pnpm --filter quantum-pitch dev
```

### Hardware Setup

1. Open `esp32/cricket_stump.ino` in Arduino IDE
2. Configure WiFi credentials and API endpoint in the sketch
3. Flash to ESP32 dev board
4. Mount sensors on the cricket stump assembly
5. Run calibration via the `/calibrate` API endpoint

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Firmware** | C++ / Arduino (ESP32) |
| **Backend** | TypeScript, Express.js, Pusher |
| **Frontend** | React 18, Vite, WebGL, Shadcn/UI |
| **Physics** | Custom physics engine (TypeScript) |
| **Validation** | Zod schemas |
| **Monorepo** | pnpm workspaces |
| **Build** | esbuild, Vite |

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/vemana4">Vemana Hemanth Babu</a>
</p>
