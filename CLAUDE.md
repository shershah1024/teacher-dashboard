# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` or `npm run dev:turbo` (for faster builds)
- **Build**: `npm run build`  
- **Production server**: `npm start`
- **Linting**: `npm run lint`
- **Type checking**: `npm run typecheck`

## Architecture Overview

This is a Next.js 15 teacher dashboard application for monitoring telc A1 German language learning progress. The application uses the App Router with TypeScript and integrates with Supabase for data and Clerk for authentication.

### Key Technologies
- **Framework**: Next.js 15 with App Router and React Server Components
- **Authentication**: Clerk (configured with sign-in/sign-up pages)
- **Database**: Supabase with direct table access to existing telc_a1 learning platform
- **UI**: shadcn/ui components with Tailwind CSS and custom theming
- **Icons**: Lucide React
- **Deployment**: Configured for Vercel with security headers

### Project Structure

- `app/` - Next.js app router pages and API routes
  - `api/teacher-dashboard/` - API endpoints for fetching student data
  - `teacher-dashboard/` - Main dashboard pages
  - `sign-in/` and `sign-up/` - Clerk authentication pages
- `components/ui/` - shadcn/ui reusable components
- `lib/utils.ts` - Utility functions including `cn()` for class name merging
- `middleware.ts` - Clerk authentication middleware with route protection

### Authentication Flow
- Uses Clerk for user authentication
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/(.*)`
- All other routes require authentication via `auth.protect()`
- Redirects to `/teacher-dashboard` after successful authentication

### Data Architecture
The application connects to an existing Supabase database with multiple tables:
- `user_organizations` - Links users to organizations (e.g., 'ANB' for A&B Recruiting)
- `german_user_vocabulary` - Vocabulary learning progress
- `lesson_*_scores` tables - Various skill assessments (speaking, listening, reading, writing, grammar)
- `task_completions` - Daily streak and completion tracking
- `user_lesson_progress` - Overall course progress
- `pronunciation_scores` - Pronunciation assessment data

### Environment Variables
Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase connection
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `OPENAI_API_KEY` - AI features
- `NEXT_PUBLIC_APP_URL` - Application URL

### Student Analytics
The teacher dashboard fetches comprehensive student data including:
- Overall progress percentage based on lesson completions
- Daily learning streaks calculated from task completions
- Skill-specific scores (speaking, listening, reading, writing, grammar, pronunciation, vocabulary)
- Weekly vocabulary acquisition
- Conversation practice metrics
- Recent activity tracking

### UI Patterns
- Uses shadcn/ui design system with custom color scheme
- Implements tabs for different view modes (overview, grid, detailed, analytics)
- Card-based layout for student information
- Responsive design with mobile-first approach
- Dark mode support via Tailwind classes