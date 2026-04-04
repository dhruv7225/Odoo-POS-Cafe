# POSCafe Project Context & Agent Guidelines

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
- `recharts` for data visualization 
- `react-hook-form` + `zod` for forms and validation
- `react-router-dom` for client-side routing
- `sonner` for toast notifications

## Design System Guidelines
- **Theme**: Light theme. Soft backgrounds (`#FAFAFA` or light beige). Active UI layers placed into standard white `bg-card` configurations.
- **Primary Color**: Orange Accent (`#FF6B35`). Used for primary CTAs and highlights.
- **Typography**: `Inter` font stack.
- **Border Radius**: Soft rounded corners (`12px` - `16px`).
- **Effects**: Soft shadows for a modern card feel. Clean spacing, alignment, and subtle CSS transitions. 

## Core Architectures Built 

### 1. Mock Authentication & Access Control
- Simulated backend JWT and session behavior entirely via browser `localStorage`.
- Handled locally inside `src/context/AuthContext.tsx` via standard React Context patterns interacting with `src/lib/auth.ts`.
- Implemented `ProtectedRoute.tsx` logic which heavily scrutinizes the `.role === "admin"` property, routing unauthorized traffic safely away to an interactive feedback page or back to Login. 
- Integrated Authentication pages (Login/Signup) following a 60/40 Split Screen UI holding a branded placeholder on the left and `zod` verified forms on the right.

### 2. Administrator Layout (`AdminLayout.tsx`)
- The main wrapper housing all authenticated flows utilizing a robust responsive architecture.
- **Sidebar**: Dynamic collapsible logic holding active Lucide-React routing paths.
- **Topbar**: Houses generic platform controls including Search fields, Notifications, and the globally aware Avatar matching the `AuthContext` user footprint.

### 3. POS Admin Dashboard (`/admin/dashboard`)
- Extensively customized to match premium exact-design criteria utilizing `Recharts`.
- Features KPI Widgets evaluating global Total Returns.
- Incorporates dynamic visual components:
  - Dual-Axis line charts charting `Income` vs `Expense`.
  - Nested transparent-centered Donut charts measuring `Top Categories`.
  - Icon-driven list metrics tracking `Order Types` (Dine-in vs Online).
  - Image block-card renderers showcasing the top `Trending Menus`.

### 4. Menu Management Feature (`/admin/menu`)
- Smart controller page `MenuManagement.tsx` encapsulating the POS item payload.
- Contains nested specialized components:
  - `AddMenuForm.tsx`: A complex state block handling multi-level variant creation flows, Dropdown Selectors, Pricing grids, and an intuitive **Drag-and-Drop Image Uploader** converting local `File` objects directly into Base64 blob visualizations utilizing the `FileReader API`.
  - `MenuTable.tsx`: A robust `shadcn` interactive table listing out the data arrays mapping statuses (`Available` vs `Out of Stock`) and controlling delete actions seamlessly.
  - Both layers rely on `localStorage` interactions mimicking persistent backend POST / DELETE routes successfully.

## Rule For Future Agents
- This application relies on `"strict": true` and `noUnusedLocals: true` inside of the `tsconfig`. **Any unused variables, imports or loose typing** will crash the `Vite` compiler outright. Please write perfectly clean TS React code.
