# Nova AI Journal App

> **Current State**: Frontend prototype with beautiful UI. See
> [CLAUDE.md](./CLAUDE.md) for detailed implementation status and roadmap.

## Vision

Nova is a minimalist personal development and journaling web application
designed to help users reflect on their experiences, track their growth, and
receive personalized insights. This application creates a sanctuary for
self-reflection with an AI companion that provides guidance based on journal
entries.

Nova represents the intelligence built into the platform - a personalized AI
companion that serves as:

- A voice of stability in times of turmoil
- A voice of reason in times of anger
- A voice that unveils purpose and hope in times of despair and depression

## Core Features

### 1. Daily Journal Entries

- **Single Entry Per Day**: Users create one journal entry per day, editable
  throughout the day
- **Guided Prompts**: 2-3 carefully selected questions from a curated database
  to unlock deep thinking and reflection
- **Freeform Space**: Open area for unstructured thoughts and reflections
- **Calendar Interface**: Navigate entries by date with visual indicators of
  journal activity

### 2. Intelligent Prompt System

- **Dynamic Question Pool**: 20+ deep reflection prompts designed to facilitate
  meaningful introspection
- **Daily Rotation**: Random selection of 2-3 prompts per user per day
- **Regular Updates**: Prompt database refreshed periodically to maintain
  freshness
- **Personalization**: Future iterations will tailor prompts based on user
  personality analysis

### 3. Nova AI Assistant

Nova operates in two modes:

#### Reactive Mode (Conversational)

- Chat interface for on-demand support and guidance
- Context-aware responses based on journal history
- Personalized tone adapted to user's emotional state and needs

#### Proactive Mode (Automated Insights)

- Weekly insights generated every Saturday at midnight (user's timezone)
- Ultra-focused analysis of the past week's entries
- Pattern recognition across emotional, behavioral, and topical dimensions
- Insights stored and used as context for future conversations

### 4. Personalization & Memory

- **Personality Analysis**: Build understanding of user over time through
  journal entries
- **Contextual Memory**: Weekly insights inform future Nova interactions
- **Agentic Memory** (Future): Nova maintains long-term memory of user
  preferences, patterns, and growth

## Technical Architecture

### Frontend

- **Framework**: Next.js 14+ with App Router
- **UI Components**: Shadcn/ui with Slate color palette
- **Animations**: Framer Motion for smooth, delightful interactions
- **Styling**: Tailwind CSS with minimalist design principles

### Backend & Services

- **Authentication**: Clerk for secure user management
- **Database**: Supabase for journal entries and user data
- **AI Integration**: BAML for structured AI interactions
- **Schema Validation**: Arktype for type-safe data handling
- **Background Jobs**: Cron jobs for weekly insights generation

### Design Principles

- **Minimalist Aesthetic**: Clean, distraction-free interface
- **Emotional Design**: Calming colors, thoughtful spacing, gentle animations
- **Accessibility**: WCAG compliant, keyboard navigation, screen reader support
- **Responsive**: Seamless experience across desktop and mobile devices

## Data Privacy & Security

- User journal entries are private and encrypted
- AI analysis happens server-side with no data retention
- Users maintain full control over their data
- Export functionality for data portability

## Development Phases

### Phase 1: Core Journaling (MVP)

- User authentication with Clerk
- Basic journal entry creation/editing
- Calendar view navigation
- Simple prompt system
- Responsive design

### Phase 2: Nova Integration

- Basic Nova chat interface
- Weekly insights generation
- Personality analysis foundation
- Context-aware responses

### Phase 3: Advanced Personalization

- Sophisticated prompt personalization
- Agentic memory system
- Advanced pattern recognition
- Mood tracking and visualization

### Phase 4: Enhanced Features

- Voice journaling option
- Meditation/mindfulness integrations
- Goal tracking linked to reflections
- Community features (optional, privacy-first)

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BAML_API_KEY=
```

## Contributing

This project follows a user-centric development approach. All features should
enhance the core mission of providing a supportive, intelligent journaling
experience that helps users grow and find clarity in their lives.

