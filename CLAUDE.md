# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **InnSync**, a Professional Property Management System (PMS) built for boutique hotels and vacation rentals. The project is built with Next.js 14, TypeScript, and Shadcn/ui components, designed for speed, simplicity, and superior user experience.

## Key Technologies & Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS with CSS variables
- **UI Components**: Shadcn/ui (New York style) with Lucide icons
- **Database**: PostgreSQL with comprehensive schema for property management
- **Fonts**: Geist Sans and Geist Mono (local fonts)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Architecture

### Core Structure
- `app/` - Next.js App Router pages and layouts
- `lib/` - Utility functions and shared logic
- `components/` - Reusable React components (Shadcn/ui configured)
- `schema.sql` - Complete PostgreSQL database schema

### Shadcn/ui Configuration
- Style: "new-york"
- Base color: "neutral"
- CSS variables enabled
- Components path: `@/components/ui`
- Utils path: `@/lib/utils`

### Database Design
The application uses a comprehensive PostgreSQL schema with the following key entities:
- **Properties** - Main property information
- **Rooms** - Individual room details with status tracking
- **Guests** - Guest information and preferences
- **Reservations** - Booking management with status workflow
- **Payments** - Payment processing and tracking
- **Housekeeping** - Room maintenance and cleaning tasks
- **Staff** - Employee management
- **Expenses** - Property expense tracking

Key features:
- UUID primary keys throughout
- Enum types for status fields (booking_status, room_status, payment_status, etc.)
- Version control for optimistic updates
- Automatic updated_at triggers
- Comprehensive indexing for performance

### UI/UX Philosophy
The application follows these core principles:
- **Clarity Over Clutter**: Minimalist design with ample white space
- **Speed as a Feature**: Optimistic updates and instant UI feedback
- **Keyboard-First Navigation**: Command palette (`Cmd+K`) and shortcuts for power users
- **Responsive Design**: Works on desktop, laptop, and tablet

## Key Features (MVP Scope)

1. **Dashboard** - Real-time property overview with key metrics
2. **Reservation Grid** - Visual calendar for room bookings (drag-and-drop)
3. **Booking Management** - Quick reservation creation and guest management
4. **Front Desk Operations** - Check-in/check-out workflows
5. **Housekeeping** - Room status tracking and task management

## Development Guidelines

### Component Patterns
- Use Shadcn/ui components consistently
- Implement the `cn()` utility from `@/lib/utils` for conditional styling
- Follow the established alias patterns in `components.json`

### Data Management
- Use optimistic updates for better UX
- Implement version control for conflict resolution
- Leverage PostgreSQL enums for status fields
- Use UUID references throughout the schema

### Styling Approach
- Tailwind CSS with design system CSS variables
- Dark mode support via class-based toggle
- Consistent spacing and typography using Geist fonts
- Neutral color palette as base theme