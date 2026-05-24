# mylynk 🔗

> **The Ultimate Next-Gen Developer & Creator Link-In-Bio Canvas**  
> Streamline your entire digital presence under a single, highly customizable, and responsive page. Design layouts, analyze live click statistics, print custom QR codes, and persist everything securely on a live cloud database.

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESLint-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🎨 Visual Preview

*   **Dual Engine Layout:** Choose between classic **Dark Theme** or an elegant, fluid **Light Theme** via the sticky header switch.
*   **Live Sandbox Simulator:** Interact with responsive modular sliders, immediate theme preset modifiers, and active smartphone mockup frames.
*   **Instant QR Generation:** Export custom poster matrix overlays loaded directly from the database configuration schemas.

---

## 🚀 Key Highlights

1.  **Fully Persistent Firestore Backend:** Includes native lazy seeding, password-safe SHA-256 secure hashing, strict security rules, and real-time document sync.
2.  **High-Capacity Analytics:** Track day-level click histories over an interactive live performance bar chart populated instantly upon trigger.
3.  **Flexible Node Layouts:** Supports standard social profiles, external custom coding targets, nested visual folders, and toggleable toggle anchors.
4.  **Error-Resilient Operations:** Connected using standard Firebase Firestore long-polling drivers to bypass benign gRPC idle disconnect exceptions.
5.  **Polished Document Modals:** Integrated client forms for Terms of Service, Privacy Policies (conforming to GDPR), and Live Support tickets synced to back-end controllers.

---

## 🗃️ Firebase Schema & Architecture

Your profiles are synchronized over the `/users/{username}` collection branch with rigorous format validation rules inside `firestore.rules`:

```json
{
  "entities": {
    "UserProfileData": {
      "username": "Unique, lowercase alphanumeric identifying slug",
      "email": "Registered contact creator email",
      "passwordHash": "SHA-256 salted secure signature",
      "profile": {
        "id": "String",
        "name": "Display Name",
        "bio": "Creator Description",
        "avatarUrl": "URL",
        "themeId": "Theme Identifier",
        "fontFamily": "Font Identifier"
      },
      "links": [
        {
          "id": "Unique Event Key",
          "title": "Link Highlight text",
          "url": "Destination URL",
          "icon": "Lucide Icon Code",
          "active": "Boolean Toggle",
          "order": "Integer Placement index",
          "isFolder": "Boolean Folder Toggle",
          "subLinks": "Optional Child Social Links"
        }
      ],
      "clicks": {
        "link-id": {
          "linkId": "String referencing link",
          "clicks": "Integer counter cumulative",
          "dates": { "YYYY-MM-DD": "Click counts for event day" }
        }
      }
    }
  }
}
```

---

## 🛠️ Step-by-Step Local Setup

Follow these setup steps to run `mylynk` locally inside your workspace terminal:

### 1. Prerequisites
Make sure you have Node.js (v18 or newer) installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment Variables
Configure your environment parameters using `.env.example`:
```bash
cp .env.example .env
```

### 4. Run Development Workspace
Spins up both the Vite client bundler and the integrated Express server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 📐 Project Structure

```text
├── .env.example                # Blank reference coordinates for public/private env parameters
├── firebase-applet-config.json # Generated credentials connecting to Cloud Firestore
├── firebase-blueprint.json     # Declarative abstract document validation structures
├── firestore.rules             # Rigorous rules governing read/write authorizations 
├── index.html                  # Advanced SEO configured HTML master layout
├── server-db.ts                # Primary abstraction engine utilizing Firestore
├── server.ts                   # Core Express entry point handling secure API requests
└── src
    ├── App.tsx                 # Master landing router with dual-theme configurations
    ├── components
    │   ├── FooterModals.tsx    # Live Privacy Guarantees, terms & support forms
    │   ├── Dashboard.tsx       # Live editor workspace & drag-and-drop link controllers
    │   ├── LinkTreePreview.tsx # Fluid preview cards with animations
    │   ├── LoginForm.tsx       # Authorization panel with responsive validations
    │   ├── MyLynkLogo.tsx      # SVG graphical badge
    │   └── PublicProfile.tsx   # Serves standalone, public-facing link pages
    ├── index.css               # Main Tailwind CSS configurations
    ├── types.ts                # Strict TypeScript interfaces
    └── main.tsx                # Client entry point
```

---

## 👨‍💻 Creators & Authors

Developed and designed with ❤️ by:
*   **Vaibhav Baviskar** — Maintained and optimized for next-generation developer portfolios.

---

## 📜 License
This workspace is licensed under the MIT License. Feel free to clone or customize your own brand landing pages in seconds!
