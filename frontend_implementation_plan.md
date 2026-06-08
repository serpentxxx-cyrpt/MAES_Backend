# MAES — Frontend Implementation Plan

## 1. Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite (TypeScript)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching/Routing**: Axios, React Router DOM
- **Authentication**: Supabase Auth
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Hosting**: Vercel (Free Tier)

## 2. Theme & Styling Strategy (Tailwind Configuration)

The platform adopts a modern, brutalist yet clean aesthetic designed for maximum readability and information hierarchy, replicating a high-stakes dashboard.

### Core Color Palette
- **Primary / Brand (Authority)**: Deep Forest Green (`#062c22`) — Used for high-emphasis headers, structural anchoring, and primary buttons.
- **Background / Canvas**: Soft Cream (`#f6f5f0`) — Ensures high scannability, avoiding pure-white glare during extended sessions.
- **Accent / Alert (Triage)**: Safety Coral (`#e88b56`) — Urgent call-to-actions, emergency status indicators, and interactive elements.
- **Text & Borders**: Charcoal/Black (`#111111`) — Crisp, stark geometric lines creating a structured "perception loop" blueprint layout.

### `tailwind.config.js` Setup
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#062c22', // Deep Forest Green
          dark: '#041f18',
        },
        canvas: {
          DEFAULT: '#f6f5f0', // Soft Cream
          dark: '#062c22',    // Inverse
        },
        alert: {
          DEFAULT: '#e88b56', // Safety Coral
          hover: '#d07848',
        },
        ink: {
          DEFAULT: '#111111', // Charcoal/Black
          muted: '#444444',
          inverse: '#f6f5f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Clean, modern sans
        mono: ['JetBrains Mono', 'monospace'],      // Dashboard aesthetic
      },
      borderWidth: {
        '1': '1px', // Stark geometric borders
      }
    },
  },
  plugins: [],
}
```

### CSS Variable Mapping (`index.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-brand: #062c22;
    --color-canvas: #f6f5f0;
    --color-alert: #e88b56;
    --color-ink: #111111;
  }

  body {
    @apply bg-canvas text-ink font-sans antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply text-brand font-semibold tracking-tight;
  }
}

@layer components {
  /* Brutalist UI Components */
  .btn-primary {
    @apply bg-brand text-canvas px-4 py-2 font-medium border border-ink hover:bg-brand-dark transition-colors;
  }
  
  .btn-alert {
    @apply bg-alert text-ink px-4 py-2 font-medium border border-ink hover:bg-alert-hover transition-colors shadow-[2px_2px_0px_#111111];
  }
  
  .panel-container {
    @apply bg-canvas border border-ink p-4;
  }
}
```

## 3. UI Architecture (NotebookLM-Style)
The core application will use a 3-panel layout designed for an optimal learning experience:

### Left Panel: Sources Management
- **Purpose**: Manage the knowledge base the tutor uses.
- **Features**:
  - File Upload (PDF, DOCX, TXT, MD, CSV)
  - URL Import (Backend scrapes text)
  - YouTube Import (Extracts transcripts)
  - Google Drive Integration
  - Toggle specific sources on/off.

### Center Panel: Socratic Chat
- **Purpose**: The main interaction area with Agent A.
- **Features**:
  - Chat bubbles (Student vs. Tutor)
  - Inline citations linking to sources in the left panel.
  - Bloom's Taxonomy badges on tutor hints.
  - Current pedagogical register indicator (e.g., Socratic, Analogy).
  - Typing indicators with "thinking" states.

### Right Panel: Studio
- **Purpose**: Auto-generated study aids and progress tracking.
- **Features**:
  - Notes editor and Flashcard decks (with spaced repetition UI).
  - Generated quizzes grounded in the uploaded sources.
  - Recharts-based Bloom Progression Chart.

## 4. Application Structure
```text
frontend/
├── src/
│   ├── pages/
│   │   ├── NotebookView.tsx     # Main 3-panel workspace
│   │   ├── NotebookList.tsx     # Grid of user notebooks (Home)
│   │   ├── TeacherDashboard.tsx # In-app analytics
│   │   ├── AdminPanel.tsx       # System configs & simulations
│   │   └── LoginPage.tsx        # Supabase Auth
│   ├── components/
│   │   ├── panels/              # SourcesPanel, ChatPanel, StudioPanel
│   │   ├── sources/             # SourceUploader, SourceCard, UrlImporter, etc.
│   │   ├── chat/                # ChatBubble, BloomBadge, RegisterBadge, etc.
│   │   ├── studio/              # NotesEditor, FlashcardDeck, QuizGenerator, etc.
│   │   ├── dashboard/           # RubricScoreChart, SessionTimeline
│   │   └── shared/              # Navbar, StatusBar, Modal
│   ├── hooks/                   # useSession, useAuditLog, useSources, etc.
│   ├── stores/                  # Zustand stores: sessionStore, sourceStore
│   └── lib/                     # supabaseClient, apiClient
├── .env.local
├── tailwind.config.js
└── vite.config.ts
```

## 5. Key Implementation Phases
1. **Scaffolding**: Initialize Vite app, configure Tailwind, setup React Router and Supabase client.
2. **Auth & Routing**: Build `LoginPage` and protect inner routes using Supabase sessions.
3. **Core Layout**: Build the `Navbar`, `StatusBar`, and the responsive 3-panel shell in `NotebookView`.
4. **Chat Panel Integration**: Connect `useSession` hook to the backend `/turn` API. Render chat bubbles and typing indicators.
5. **Sources Panel Integration**: Implement file upload UI and connect to backend source processing APIs.
6. **Studio Panel**: Implement flashcard flipping logic, notes saving, and Recharts rendering.
7. **Dashboards**: Build `TeacherDashboard` fetching from Supabase analytics views.

## 6. Deployment
- Deployed automatically via GitHub Actions `.github/workflows/deploy-frontend.yml` to Vercel on pushes to the `main` branch.
