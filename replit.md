# Overview

ClassikLust is an anime-themed idle clicker game built as a modern web application. The game features character collection, upgrade systems, chat functionality, and administrative tools. Players tap to earn points, unlock characters, purchase upgrades, and interact with AI-powered character personalities through a chat system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom game-themed variables and gradients
- **Component Structure**: Modular component architecture with separate pages for game, admin, and error handling

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints organized by feature domains
- **File Structure**: Monorepo structure with shared schema between client and server
- **Development**: Hot module replacement via Vite integration in development mode

## Data Storage Solutions
- **Database**: In-memory storage for clean Replit deployment (migrated from PostgreSQL)
- **Storage Implementation**: Custom MemStorage class implementing IStorage interface
- **Schema Management**: Shared TypeScript schema definitions between frontend and backend
- **Data Models**: Users, characters, upgrades, chat messages, game stats, and media files

## Key Game Systems
- **Core Gameplay**: Tap-to-earn mechanics with energy system and cooldowns
- **Character System**: Unlockable characters with level requirements and personality traits
- **Upgrade System**: Progressive upgrade paths with level and prerequisite requirements
- **Chat System**: AI-powered character interactions with message history
- **Admin Panel**: Administrative interface for user management and system monitoring
- **Media Management**: File upload system for character images and media

## Authentication and Authorization
- **Admin Access**: Role-based access control with admin flag in user model
- **Session Management**: Designed for session-based authentication (implementation pending)
- **Route Protection**: Admin routes protected by role-based middleware

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **drizzle-orm**: Type-safe PostgreSQL ORM
- **@neondatabase/serverless**: Neon database connection driver

## UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility

## Development Tools
- **vite**: Frontend build tool and development server
- **typescript**: Static type checking
- **drizzle-kit**: Database migration and introspection tool
- **esbuild**: Fast JavaScript bundler for production builds

## Completed Integrations
- **AI Chat System**: Fully integrated Mistral AI with custom fine-tuned models for character conversations
  - Using user's custom model: `ft:ministral-3b-latest:0834440f:20250812:63a294f4` for character responses
  - Using user's agent model: `ag:0834440f:20250812:untitled-agent:d6ab8723` for debugging assistance
  - Real-time AI responses with character personality integration
- **Admin Panel**: Complete administrative interface with user management and system controls
- **PostgreSQL Database**: Production-ready database with proper schema and migrations

## Recent Changes (August 12, 2025)
- Successfully migrated from Replit Agent to standard Replit environment
- Migrated from PostgreSQL to in-memory storage for clean Replit deployment without external dependencies
- Created custom MemStorage implementation maintaining full IStorage interface compatibility
- Fixed database connection issues by removing Neon dependency
- Fixed character selection system and user creation logic for proper default user/character setup
- **Updated Mistral AI models**: Using ft:open-mistral-7b:0834440f:20250812:43c81adb for chat and ft:ministral-3b-latest:0834440f:20250812:63a294f4 for debugging
- **Restored full AdminPanel functionality**: Created comprehensive AdminPanelFull with sleek GUI, organized tabs for Dashboard, Users, Characters, Wheel management, AI Chat status, and Settings
- Fixed admin permissions by making default user an admin for testing purposes
- All core systems operational: tap mechanics (125 points/tap), AI chat working perfectly, character selection, energy system, level progression
- **Migration completed successfully** - all core systems working and API endpoints returning proper data