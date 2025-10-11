# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build the application for production
- `npm start` - Start production server (after build)
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a Next.js 15 application using the App Router architecture with TypeScript and Tailwind CSS.

## Tasks

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have the list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them complete as you go.
5. Every step of the way give me a high level explanation of what changes you made.
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.

### Key Structure
- **App Router**: Uses the `app/` directory structure for routing
- **Layout System**: Root layout in `app/layout.tsx` with Geist fonts (sans and mono)
- **Styling**: Tailwind CSS 4 with custom CSS variables for theming
- **TypeScript**: Strict mode enabled with path mapping (`@/*` points to root)

### Technology Stack
- **Framework**: Next.js 15.5.4 with React 19.1.0
- **Styling**: Tailwind CSS 4 with PostCSS
- **TypeScript**: v5 with strict configuration
- **Linting**: ESLint with Next.js core-web-vitals and TypeScript presets
- **Fonts**: Geist Sans and Geist Mono from Google Fonts

### Styling Patterns
- Uses CSS custom properties for theme colors (background/foreground)
- Dark mode support via `prefers-color-scheme`
- Tailwind utility classes with custom theme integration
- Font variables set via CSS custom properties

### File Organization
- Components and pages in `app/` directory
- Global styles in `app/globals.css`
- Static assets in `public/` directory
- TypeScript configuration allows `@/*` imports for root-level files