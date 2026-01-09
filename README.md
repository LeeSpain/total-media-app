# Total Media App

> AI-First Marketing Platform with Autonomous Agent Teams

## Vision

A standalone AI marketing platform that connects to any business via API and autonomously grows it through intelligent, coordinated marketing efforts.

**The AI doesn't assist with marketing. The AI IS the marketing team.**

---

## What's New in v0.2.0

### 🎮 Command Center
Talk directly to Commander - your AI strategist. Ask questions, request actions, get instant responses.

### 🚀 Campaign Builder
Create campaigns with a guided wizard. Set goals, choose channels, and let the AI team execute.

### 🧠 Knowledge Base
Visual knowledge management with categories. Agents use this to make informed decisions.

### 🎯 Lead Discovery
Scout agent finds and qualifies leads. See them scored and organized.

### ✍️ Content Creation
Writer agent generates social posts, emails, and articles. Review before publishing.

### 📊 Real-time Activity
See what agents are doing in real-time. Task flow visualization shows progress.

### 🏢 ICE SOS Lite Template
Pre-configured business template with products, audience, and brand data ready to go.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOTAL MEDIA APP                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    COMMANDER                              │   │
│  │           Strategy · Orchestration · Decisions            │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│  ┌──────▼──────┐   ┌───────▼───────┐   ┌─────▼──────┐         │
│  │ INTELLIGENCE │   │   CREATION    │   │  DELIVERY  │         │
│  │              │   │               │   │            │         │
│  │ Scout (Leads)│   │ Writer (Copy) │   │ Broadcaster│         │
│  │ Spy (Intel)  │   │ Artist (Visual│   │ Ambassador │         │
│  └──────────────┘   └───────────────┘   └────────────┘         │
│                            │                                     │
│                     ┌──────▼──────┐                             │
│                     │   ORACLE    │                             │
│                     │  Analytics  │                             │
│                     └─────────────┘                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  UNIFIED MEMORY (RAG)                     │   │
│  │    Business Knowledge · Market Intel · Content Library    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## The Agent Team

| Agent | Role | Capabilities |
|-------|------|--------------|
| **Commander** | Chief Strategist | Strategy, orchestration, review, learning |
| **Scout** | Lead Researcher | Lead discovery, enrichment, qualification |
| **Spy** | Market Intelligence | Competitor analysis, trend tracking |
| **Writer** | Content Creator | Social posts, emails, blogs, ad copy |
| **Artist** | Visual Creator | Image generation, graphics, thumbnails |
| **Broadcaster** | Distribution | Publishing, scheduling, email sending |
| **Ambassador** | Engagement | Comments, DMs, lead nurturing |
| **Oracle** | Analytics | Performance tracking, insights, optimization |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/total-media-app.git
   cd total-media-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run migrations: `supabase db push`
   - Deploy edge functions: `supabase functions deploy --no-verify-jwt`

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase URL and keys
   ```

5. **Add secrets to Supabase**
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_key
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

---

## Using ICE SOS Lite Template

When setting up a new business:

1. Click "Use Template" on the ICE SOS Lite card
2. Review and customize the pre-filled data
3. Click "Create Business"

This automatically populates:
- Product catalog (Core, Pendant, Family Add-on, Call Center)
- Target audience (elderly, adult children, care homes)
- Brand voice guidelines
- Competitor analysis
- 10+ knowledge base entries

---

## Project Structure

```
total-media-app/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout/          # App shell, nav, sidebar
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── command-center/  # Commander chat interface
│   │   ├── campaigns/       # Campaign builder
│   │   └── knowledge/       # Knowledge editor
│   ├── pages/               # Route pages
│   ├── hooks/               # React Query hooks
│   ├── contexts/            # Auth & Business contexts
│   └── integrations/        # Supabase client
├── supabase/
│   ├── functions/           # Edge functions (agents)
│   │   ├── _shared/         # Shared utilities
│   │   ├── commander/
│   │   ├── scout/
│   │   ├── spy/
│   │   ├── writer/
│   │   ├── artist/
│   │   ├── broadcaster/
│   │   ├── ambassador/
│   │   ├── oracle/
│   │   ├── task-processor/
│   │   └── embeddings/
│   └── migrations/          # Database schema
└── [config files]
```

---

## Database Schema

### Core Tables

- `profiles` - User accounts
- `businesses` - Companies being marketed
- `agents` - Agent configurations
- `tasks` - Task queue
- `campaigns` - Marketing campaigns
- `content` - Created content
- `leads` - Discovered leads
- `knowledge` - RAG storage with embeddings
- `analytics` - Performance metrics
- `connections` - Platform integrations

---

## Environment Variables

```env
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Edge Function Secrets (set via Supabase CLI)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| Database | PostgreSQL + pgvector |
| AI | OpenAI GPT-4o + Claude (optional) |
| State | TanStack Query + Zustand |

---

## Roadmap

- [ ] Social platform OAuth integrations
- [ ] Email provider integrations (Resend, SendGrid)
- [ ] Automated publishing queue
- [ ] A/B testing for content
- [ ] Multi-tenant SaaS features
- [ ] Mobile app (React Native)

---

## License

Private - All Rights Reserved

---

## Author

Built with Claude (Anthropic) as the architect.
Your AI marketing team, ready to grow your business.
