# Overview

This is a cutting-edge Web3 video platform that revolutionizes content creation and monetization through blockchain technology, enabling creators to tokenize their content ecosystems and build interactive communities. Built with React, TypeScript, Express.js, and PostgreSQL, integrating Wagmi & RainbowKit for blockchain interactions on Base Sepolia testnet.

## Recent Changes (January 26, 2025)

### Creator Coins Feature with Zora SDK Integration 🎨
- **Added**: Complete content tokenization system using Zora's infrastructure
- **Features**: Multi-media content support (images, videos, audio, GIFs, documents)
- **Database**: New `creatorCoins` table with comprehensive metadata and social integration
- **Frontend**: Advanced content upload interface with drag-and-drop and live preview
- **Backend**: Zora SDK service with IPFS storage and automated thumbnail generation
- **API**: Full CRUD endpoints for creator coin management, deployment, and price tracking
- **Routes**: 
  - `/create-content-coin` - Main content tokenization interface
  - `/api/creator-coins/*` - Complete API for coin management

### Smart Contract Migration
- **Removed**: Old `unipump-contracts-main` directory 
- **Added**: New `EVM-Smart-Contract-main` with pump.fun clone implementation
- **Updated**: Contract ABIs and addresses for new architecture
  - PumpFun.sol: Main bonding curve contract with virtual reserves
  - TokenFactory.sol: ERC20 token deployment factory  
  - Token.sol: Standard ERC20 token implementation
- **Migration Status**: ✅ COMPLETE - Contracts deployed to Base Sepolia
  - TokenFactory: 0x24408Fc5a7f57c3b24E85B9f97016F582391C9A9
  - PumpFun: 0x41b3a6Dd39D41467D6D47E51e77c16dEF2F63201

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with custom YouTube-themed color variables and responsive design
- **State Management**: TanStack Query (React Query) for server state and caching
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API with structured error handling and request logging
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Development**: Hot module replacement and runtime error overlay for development experience

## Data Layer
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Schema**: Comprehensive YouTube-like data model including:
  - Channels with verification status and subscriber counts
  - Videos with metadata, view counts, and engagement metrics
  - Shorts with hashtag support
  - Playlists and music albums
  - Comments with threaded support
  - Subscription relationships
- **Migrations**: Drizzle Kit for database schema migrations and management

## UI/UX Design Patterns
- **Theme System**: Dark/light mode support with system preference detection
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Navigation**: Collapsible sidebar for desktop, bottom navigation for mobile
- **Component Architecture**: Reusable components with consistent props interfaces
- **Loading States**: Skeleton components and loading indicators for better UX

# External Dependencies

## Database & ORM
- **@neondatabase/serverless**: PostgreSQL database connection for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database schema management and migrations
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI Framework & Components
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **embla-carousel-react**: Carousel/slider functionality

## Development Tools
- **vite**: Build tool and development server
- **@vitejs/plugin-react**: React support for Vite
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **tsx**: TypeScript execution for development server

## Validation & Forms
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation
- **@hookform/resolvers**: Form validation resolvers for React Hook Form

## Utility Libraries
- **wouter**: Lightweight routing for React
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **lucide-react**: Icon library for consistent iconography