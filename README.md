# ScaleSmart | Execution Systems for Growing Businesses

> **Build the system that prevents the problem.**  
> ScaleSmart is an execution layer that combines systems design, automation, and structured delegation — helping businesses operate with clarity, speed, and control.

---

## 🚀 Platform Overview

ScaleSmart is not a traditional agency. We remove operational chaos from growing businesses by designing and deploying repeatable execution systems powered by modern technology and trained operators.

Most companies don't struggle because of lack of ambition — they struggle because execution is fragmented, workflows are manual, and systems don't scale with growth. **We build the systems that fix that.**

---

## 🛠️ Tools & Features

### 🎓 ScaleSmart Academy

**Route:** `/academy`

A comprehensive learning platform for Amazon & E-commerce operations — combining official certification concepts with real-world operator judgment and battle-tested playbooks.

#### ✨ What It Does

ScaleSmart Academy trains operators to think like directors managing live capital — not just button-clickers. It blends Amazon Ads Academy alignment with practical execution systems, Coach Wesley operator philosophy, and scenario-based learning.

#### 🔧 Key Features

| Feature                      | Description                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Certifications & Badges**  | Earn Amazon-aligned credentials and ScaleSmart Operator certifications with shareable badges                                                       |
| **Learning Paths**           | Structured end-to-end progression tracks from foundational advertising to 7-figure brand catalog management                                        |
| **Courses & Scenario Labs**  | Deep-dive operational lessons, bid math guides, troubleshooting case studies, and live battlefield scenarios                                       |
| **Operator Philosophy**      | Coach Wesley's "System-First" thinking layer — training judgment, not just knowledge                                                               |
| **Level-Based Progression**  | Beginner → Intermediate → Advanced pathways with clear competency milestones                                                                       |
| **Featured Modules**         | Curated courses combining theory with operational playbooks (e.g., Bid Math Mastery, Creative Testing, Catalog Expansion)                          |
| **Interactive Roadmaps**     | Step-by-step visual progression showing exactly what to learn next                                                                                 |
| **Comparison Framework**     | Clear differentiation between standard course platforms vs. ScaleSmart's operator-centric approach                                                 |

#### 🏗️ Architecture

```
src/app/academy/
├── page.tsx                          # Main academy landing page
├── certifications/
│   ├── page.tsx                      # Certifications listing
│   └── [slug]/                       # Individual certification detail pages
└── courses/
    ├── page.tsx                      # Courses listing
    └── [slug]/                       # Individual course detail pages

src/components/academy/
├── AcademyHero.tsx                   # Hero section with CTAs
├── AcademyNavTabs.tsx                # Navigation tabs (Academy, Certifications, Courses, Paths)
├── OperatorCallout.tsx               # Coach Wesley philosophy section
├── AcademyFaqSection.tsx             # FAQ component
└── ...                               # Additional academy-specific components

src/data/academy/
├── courses.ts                        # Course data definitions
├── learning-paths.ts                 # Learning path configurations
└── certifications.ts                 # Certification metadata
```

---

### 🤖 Prompt Request Generator

**Route:** `/prompt-request-generator`

A free, fully client-side AI prompt structuring tool available to **all users** — no login required. It helps anyone craft well-structured, high-quality prompts for any AI assistant (ChatGPT, Claude, Gemini, etc.).

#### ✨ What It Does

Transforms raw ideas into structured, professional AI prompts using a **System-First** approach — ensuring AI assistants receive all the context they need to deliver precise, useful results.

#### 🔧 Key Features

| Feature                    | Description                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category Selection**     | Pre-defined categories (General Assistance, Technical, Writing, Strategy, etc.) + Custom category support                                                                                              |
| **Structured Fields**      | Request, Context, Parent Task, Subtask, Output Format, Constraints, Examples, Tone, Additional Info, Code Snippet                                                                                      |
| **9 Starter Templates**    | One-click templates for: Analysis & Research, Professional Writing, Strategic Planning, Technical Solving, Communication, Process Optimization, Learning & Education, Creative Ideation, Summarization |
| **Save & Load Requests**   | Persist prompt drafts locally (browser `localStorage`) with full CRUD operations                                                                                                                       |
| **Undo / Redo**            | Full edit history — never lose a draft                                                                                                                                                                 |
| **Draft Autosave**         | Visual autosave indicator shows when your work is being saved                                                                                                                                          |
| **Export / Import (JSON)** | Backup your saved prompts or migrate them across devices                                                                                                                                               |
| **Copy to Clipboard**      | One-click copy of the final structured prompt                                                                                                                                                          |
| **Keyboard Shortcuts**     | Power-user shortcuts for all major actions                                                                                                                                                             |
| **User Guide Modal**       | Built-in strategy guide explaining the "System-First" prompting philosophy                                                                                                                             |

#### ⌨️ Keyboard Shortcuts

| Action            | Shortcut                 |
| ----------------- | ------------------------ |
| Generate Prompt   | `Ctrl + Enter`           |
| Save Request      | `Ctrl + S`               |
| Clear Form        | `Ctrl + K`               |
| Copy Output       | `Ctrl + Shift + C`       |
| Undo              | `Ctrl + Z`               |
| Redo              | `Ctrl + Y`               |
| Open Templates    | `Ctrl + T`               |
| Duplicate Request | `Ctrl + D`               |
| Focus Fields      | `Ctrl + Alt + 1 / 2 / 3` |

#### 🏗️ Architecture

```
src/app/prompt-request-generator/
├── page.tsx                          # Main page — layout, autosave, dialogs, shortcuts
├── components/
│   ├── PromptInputForm.tsx           # Main multi-field input form
│   ├── PromptActionButtons.tsx       # Toolbar: generate, save, undo/redo, export/import
│   ├── PromptOutputDisplay.tsx       # Generated prompt output with copy action
│   ├── PromptTemplateSelector.tsx    # 9 filterable starter templates
│   ├── SavedRequestsPanel.tsx        # Slide-out panel: load, rename, update, delete saved prompts
│   ├── SaveRequestDialog.tsx         # Save dialog with smart name suggestions
│   ├── DeleteConfirmationDialog.tsx  # Confirmation modal for destructive actions
│   ├── UserGuideModal.tsx            # Built-in "Prompt Strategy Guide"
│   ├── CharacterCounter.tsx          # Live character count for input fields
│   ├── LoadingSpinner.tsx            # Reusable loading indicator
│   ├── Skeleton.tsx                  # Content loading skeleton
│   └── form-sections/               # Modular form section components
src/hooks/
├── use-prompt-generator.ts           # Core state: CRUD, history, persistence, generation
└── use-generator-shortcuts.ts        # Global keyboard shortcut bindings
src/lib/prompt-generator/
├── types.ts                          # TypeScript types: PromptData, SavedRequest
└── constants.ts                      # Shared constants (e.g., CUSTOM_CATEGORY_VALUE)
```

---

## 📦 What We Build

We design and deploy operational systems that replace chaos with repeatable execution.

### Core Systems

- **Execution Systems** — Structured delegation frameworks powered by trained virtual assistants and defined workflows.
- **Growth Systems** — Lead capture, qualification, and pipeline structures that convert traffic into structured opportunities.
- **Automation Layer** — Lightweight integrations using Google Apps Script, APIs, and workflow automation to reduce manual work.
- **Content & Knowledge Systems** — MDX-powered documentation and playbooks that turn business knowledge into scalable assets.
- **Operational Visibility Systems** — Structured tracking using Google Sheets and dashboards for real-time execution awareness.

---

## 🔄 How It Works

```
Visitor / Demand
  → Structured Intake (Forms)
  → Google Sheets System (Data Layer)
  → Review & Qualification
  → System Deployment / Execution Support
```

We don't just collect leads — we structure them into actionable operational data.

---

## 💻 Implementation Stack

| Layer              | Technology                                         |
| ------------------ | -------------------------------------------------- |
| **Framework**      | Next.js 16+ (App Router), React 19                 |
| **Styling**        | Tailwind CSS, Shadcn/UI, Framer Motion             |
| **Validation**     | Zod + React Hook Form                              |
| **Automation**     | Google Apps Script + Webhooks (Google Sheets)      |
| **Content System** | MDX (technical guides & operational documentation) |

---

## 🧭 Operational Philosophy

> We don't optimize tasks. We design systems that eliminate the need for repetitive tasks.

Growth breaks when execution depends on memory, effort, or individual heroics. Scale happens when **systems carry the workload instead of people.**

### What Makes ScaleSmart Different

- We build **systems, not task lists**
- We design for **execution clarity, not complexity**
- We combine **human operators + automation layers**
- We prioritize **speed, structure, and controllability**
- We operate as an **execution partner, not a service vendor**

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment** (optional — for Google Sheets integration):

   ```bash
   # Set your webhook URL in src/constants/links.ts
   GOOGLE_SHEETS_WEBHOOK_URL=your_webhook_url_here
   ```

3. **Run the development server:**

   ```bash
   npm run dev:next
   ```

4. **Open the app:**

   ```
   http://localhost:3000
   ```

5. **Update blog post sorting:**

   ```bash
   npm run blog:update-order
   ```

6. **Try the Prompt Generator (no setup needed):**
   ```
   http://localhost:3000/prompt-request-generator
   ```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Home page
│   ├── about/                        # About page
│   ├── services/                     # Service pages
│   ├── pricing/                      # Pricing page
│   ├── blog/                         # Blog / content
│   ├── contact/                      # Contact form
│   ├── faq/                          # FAQ page
│   ├── careers/                      # Careers page
│   ├── academy/                      # 🎓 ScaleSmart Academy (learning platform)
│   │   ├── page.tsx                  # Academy landing page
│   │   ├── certifications/           # Certification listings & detail pages
│   │   └── courses/                  # Course listings & detail pages
│   ├── prompt-request-generator/     # 🤖 Free AI Prompt Tool (public)
│   └── api/                          # API routes
├── components/                       # Shared UI components
│   └── academy/                      # Academy-specific components
├── hooks/                            # Custom React hooks
├── lib/                              # Utilities, types, constants
├── constants/                        # App-wide constants & links
└── data/
    └── academy/                      # Academy data: courses, paths, certifications
```

---

## 🎯 Purpose

ScaleSmart is built for operators, founders, and teams who are ready to move from reactive execution to structured systems.

**Chaos → Structure → Scalable Execution**

The Prompt Request Generator is our gift to the community — a free, open tool that helps every user interact with AI more effectively, embodying our belief that the right structure unlocks better results.

**ScaleSmart Academy** extends this mission by training the next generation of Amazon & E-commerce operators — combining official certification frameworks with real-world battlefield judgment, so teams can scale with confidence and operational clarity.

---

## 📄 License

MIT
