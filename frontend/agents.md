# POSCafe Project Context & Guidelines

## Website Overview
- **Name**: POSCafe
- **Target Audience**: Restaurant owners, managers, and staff.
- **Description**: A multi-restaurant smart POS system and SaaS application.
- **Aesthetics Goal**: A modern, clean, premium dashboard feel (similar to Stripe or modern admin panels).

## Tech Stack
- React 19 (via Vite)
- TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `shadcn/ui` components (radix-ui)
- `lucide-react` for icons
- `react-hook-form` + `zod` for forms and validation
- `react-router-dom` for client-side routing

## Design System Guidelines
- **Theme**: Light theme. Soft backgrounds (`#FAFAFA` or light beige).
- **Primary Color**: Orange Accent (`#FF6B35`). Used for primary CTAs and highlights.
- **Typography**: `Inter` / `Poppins` or modern equivalents (currently Geist/Inter).
- **Border Radius**: Soft rounded corners (`12px` - `16px`).
- **Effects**: Soft shadows for a modern card feel. Clean spacing and alignment. Smooth hover effects and minimal fade-in animations on load.

## Core Features (Authentication Module)
- **Layout**: Split-screen layout vertically centered. Left side (40%) contains branding (POSCafe), tagline ("Smart Restaurant Management & POS System"), soft gradient background, and illustration. Right side (60%) contains the auth form card. Stacked sequentially on mobile.
- **Login Page**:
  - Email & Password fields.
  - "Remember me" checkout.
  - "Forgot Password?" link.
  - Social login options (Google placeholder).
  - Footer directing to Signup.
- **Signup Page**:
  - Full Name, Email, Password, Confirm Password.
  - Organization Name.
  - Role Selection (Admin, Manager, Staff).
- **UX Rules**: Clear error states (red borders/messages), highlight borders on input focus, password visibility toggles, loading state on submit buttons.
