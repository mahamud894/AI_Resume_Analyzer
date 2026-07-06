# AI-Powered Resume Analyzer and Career Copilot

An advanced, serverless AI-powered Resume Analyzer and Career Copilot designed to transform the recruitment and job application experience. This platform allows candidates to upload their resumes in PDF format, evaluates them against specific job descriptions using state-of-the-art Large Language Models (Claude 3.5 Sonnet / GPT-4o), and generates comprehensive ATS scoring, skill-gap analysis, and tailored career assets—all processed directly through a client-to-cloud infrastructure.

---

## 📋 1. Course & Project Metadata
* **Course Code:** CSE4204 (Mobile Computing Lab)
* **Academic Semester:** Summer 2026
* **Academic Section:** 8A
* **Team Name:** CSE4204-8A-T05
* **Academic Institution:** Northern University of Business and Technology, Khulna
* **Submitted To:** **Md. Riaz Mahmud**, Assistant Professor, Department of Computer Science and Engineering

---

## 👥 2. Team Engineering Roster & Roles
1. **Mahammad Hasan (ID: 11220320828)** — *Team Leader / Frontend Architecture Lead*
    * Boilerplate compilation, global store setup via Zustand, and component logic.
2. **Shanawaz Sakib (ID: 11220320916)** — *Core System Integration Engineer*
    * Puter.js SDK orchestration, AI semantic prompt engineering, and response mapping.
3. **Ashikur Rahman Himel (ID: 11220320833)** — *Database Storage & Quality Controller*
    * File system streams handling, input validations, error-catch routines, and QA.
4. **Rasel Ratul (ID: 11220320827)** — *UI-UX & Tailwind Matrix Designer*
    * High-fidelity interface development using Tailwind CSS v4 layout systems.

---

## 💻 3. Frontend & Backend Technology Stack
* **Core Framework:** React.js (v19) configured over Vite's ultra-fast production compiler build environment.
* **Routing Engine:** React Router v7 handling nested route parameters, clean layouts, and protected navigation guards.
* **Programming Language:** TypeScript (v5) providing strict static typings and compile-time data contract definitions.
* **Style Engine:** Tailwind CSS v4 utilizing modern native CSS variable matrices and fluid grid-glassmorphic attributes.
* **State Management:** Zustand (v5) facilitating high-performance micro-state caching with zero boilerplate.
* **Serverless Infrastructure Layer:** Puter.js SDK orchestrating decentralized OAuth authentication, cloud storage (`puter.fs`), document databases (`puter.kv`), and automated tokenized AI proxy gateways.

---

## 📂 4. Project Repository Structure
Following the official structural requirements, our repository is strictly modularized as follows:
```text
AI-Resume-Analyzer/ (Repository Root Workspace)
├── backend/                # Serverless Configuration Interface
│   └── .gitkeep            # Tracks empty system architecture directory
├── database/               # NoSQL Document & Collection Properties
│   └── .gitkeep            # Tracks database design configuration directory
├── documentation/          # Formally Submitted Academic PDF Reports
│   └── CSE4204-8A-T05_FrontendProgress.pdf  
├── screenshots/            # Formally Compiled UI Progress Snapshots
│   └── .gitkeep            # Tracks screenshots storage configuration directory
├── app/                    # Primary React.js Router Source Application
│   ├── components/         # Reusable Core View Modules (Dropzone, ScoreGauge, Accordion, Alerts)
│   ├── lib/                # Puter SDK Client Initializer Bridge (puter.ts)
│   ├── store/              # Zustand Global Micro-State Caches (authStore.ts, resumeStore.ts)
│   ├── types/              # TypeScript Declarations & Schema Definitions (index.d.ts)
│   └── app.css             # Main styling mapping Tailwind CSS v4 layers
├── public/                 # Static Application Layout Vector SVGs, Brand Assets, and Templates
├── package.json            # Core Manifest detailing dependencies, build assets, and script flows
├── package-lock.json       # Automatically generated node lock matrix
├── tsconfig.json           # Global type-checking compile constraints
└── README.md               # Production System Operational Manual (This File)---
```
---
## 🔑 5. Core Features & Implemented Layouts (Week 07 Frontend Focus)

### A. Completed High-Fidelity UI Pages
* **Landing / Home Page (`Job-Details-Page`):** Features a modern typographic header and a dynamic submission grid tracking historical company data and targeted roles. Each interactive asset card maps circular performance gauges parsing calculated values out of 100.
* **Login & Registration Page (`Login-Page`):** A sleek, isolated modal wrapper overlaying a glassmorphic violet background gradient grid. It captures credential strings and features high-visibility execution buttons that interface directly with the cloud validation layers.
* **Main Functional Workspace (`Upload-Page`):** An intent-driven form structured to take inputs like Company Name and Job Title alongside an expanded text area container for raw job description parsing. The page features an integrated binary file dropzone block supporting multi-page candidate PDF uploads.
* **AI Interaction & Review Page (`Resume-Review-Page`):** The final analytical terminal displaying real-time feedback. The page implements a split-screen design containing a binary document previewer on the left flank and an intelligent critique workspace on the right flank. It includes dynamic accordions for detailed skill-gap lists and adaptive conditional status banners for automated scoring.

### B. Client-to-Cloud API Integration Mechanics
Because this application uses a serverless paradigm via Puter.js, traditional REST end-point integrations (e.g., using `Axios` or `Fetch` to hit `/api/v1/analyze`) are replaced by direct client-to-cloud SDK controller bindings. Data is loaded 100% dynamically from the Puter cloud environment:
* **User Registration & Login Integration:** Tied directly to `puter.auth.signIn()`, which handles identity tracking and signs session authorization structures.
* **Resume Binary Vault Storage:** Integrated with `puter.fs.write()`, streaming uploaded multi-page candidate document buffers directly to private application storage sectors.
* **NoSQL Analytics Persistence:** Bound to `puter.kv.set()` and `puter.kv.list()`, pushing stringified metric histories to cloud databases and pulling them into the dashboard view dynamically.
* **AI Assessment Engine:** Tied straight to the `puter.ai.chat()` orchestration node, passing compiled prompt variables containing resume data against job scopes to capture granular JSON payloads.

---

## 🔒 6. Authentication Flow & State Management

Our application enforces a strict, type-safe security cycle using **Puter's OAuth passwordless infrastructure** paired with a central **Zustand auth store** (`authStore.ts`):

* **Identity Guarding:** Unauthenticated visitors are confined to the secure login wrapper layout and blocked from accessing core analysis dashboards[cite: 1].
* **Session Handshake:** Triggering `puter.auth.signIn()` initializes an independent validation window handled outside local database scopes[cite: 1].
* **State Synchronization:** Once validated, the returned profile updates our global store state variable to `isLoggedIn: true`, storing user parameters across page re-renders[cite: 1].
* **Route Protection:** React Router locks private dashboard panels from unauthorized rendering. If an unauthenticated profile attempts to bypass layouts, the app catches the breach and forces an immediate redirect to the identity entry page.
* **Session Termination:** Hitting "Logout" triggers `puter.auth.signOut()`, which clears active session tokens and destroys local Zustand caches safely.

---

## ⚙️ 7. Form Validation & User Experience (UX)

### 7.1 Inputs & Error Controls
Form submissions are strictly guarded locally to minimize network processing costs and block malformed payloads[cite: 1]:
* **Required Fields Validation:** The form engine verifies that company metrics and job detail text areas are fully populated before running diagnostics[cite: 1].
* **File Extension and Size Audits:** The drag-and-drop box restricts binaries to valid PDF formats and blocks heavy documents larger than 10MB[cite: 1].
* **User-Friendly Feedback:** Empty input strings or invalid document formats instantly trigger visual color-coded alert flags, preventing data transmission leaks[cite: 1].

### 7.2 User Experience (UX) Enhancements
* **Loading State Indicators:** When `puter.ai.chat()` triggers an evaluation, the execution keys transition into animated loading states to reflect backend progress[cite: 1].
* **Adaptive Status Badges:** The application automatically shifts color palettes based on severe score gaps returned by the AI core.
* **Dynamic Collapse Accordions:** Detailed critiques are organized inside collapsible accordion blocks, sorting positive achievements from formatting errors into distinct response sub-cards.

---

## 📱 8. Responsive Design

The interface uses utility-first layouts built via **Tailwind CSS v4**, ensuring seamless system accessibility across multiple form factors[cite: 1]:
* **Desktop Layouts:** Renders high-density multi-column layouts, preserving data scannability for large screens[cite: 1].
* **Tablet Layouts:** Automatically drops structural side margins and condenses complex viewports to keep interactive buttons fully accessible[cite: 1].
* **Mobile Layouts:** Re-aligns grid frameworks into a fluid, single-row vertical tree (as seen in `app.css`), scaling text blocks down to eliminate horizontal scaling or navigation breaks[cite: 1].

---

## 🔄 9. Dual-Mode Backend Runtime & Migration Blueprint
To demonstrate enterprise architectural maturity, our application is built with a backend-agnostic decoupling layer inside its Zustand store engine.

* **Serverless Mode (Active Variant):** Operates entirely directly via Puter.js client-side controllers (`puter.kv.set`, `puter.fs.write`, etc.), ensuring zero infrastructure overhead[cite: 1].
* **Hosted Backend Mode (Migration Ready):** By toggling the build-environment variable `VITE_SERVERLESS_MODE=false`, the core stores dynamically redirect data streams to standard REST API channels using **Axios HTTP clients** (`axios.post`)[cite: 1]. 
* The system is fully structured to point requests instantly to dedicated API routes (such as `/api/auth/login` and `/api/resume/analyze`), passing secure **JWT token interceptors** via the `Authorization: Bearer` header, ready for easy deployment to custom Node.js/Express or Laravel server environments.

---

## ⚙️ 10. Quick Start & Local Deployment
To run this application locally on your workstation, follow these steps:

### A. Prerequisites
Ensure you have the following environments configured:
* **Node.js** (v20 or above recommended)
* **npm** or **yarn** package manager

### B. Installation
Clone the repository workspace and install the verified manifest dependencies:
```bash
git clone [https://github.com/mahamud894/AI_Resume_Analyzer.git](https://github.com/mahamud894/AI_Resume_Analyzer.git)
cd AI_Resume_Analyzer
npm install
```
### C. Executing Development Environment
Launch Vite's hot module replacement (HMR) local development server:

```bash
npm run dev
Open your web browser and navigate directly to: http://localhost:5173
```
### D. Code Compilation & Build
To build the application for standard production deployment, execute:
```
```bash
npm run build
