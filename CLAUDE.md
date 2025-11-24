# Track Your Finance - Full Stack Project

## IMPORTANT: Full Stack Development Workflow
**This repository contains the FRONTEND, but Claude will work on BOTH frontend AND backend simultaneously.**

- **Frontend Location**: `/Users/jahom/work/jahom/trackyourfinancefe` (this repo)
- **Backend Location**: `./backend` symlink → `/Users/jahom/GolandProjects/trackyourfinancebe`
- **Go Installation**: `/Users/jahom/sdk/go/go1.24.0/bin/go`
- **GOPATH**: `/Users/jahom/go`
- **Backend Runtime**: User runs backend via GoLand IDE (debugger listens on 127.0.0.1:59021)
- **Working Method**: All feature requests should be implemented in BOTH frontend and backend
- **Workflow**:
  1. Update backend (Go handlers, models, migrations, Swagger docs)
  2. User runs backend via GoLand IDE
  3. Regenerate Swagger: `/Users/jahom/sdk/go/go1.24.0/bin/go install github.com/swaggo/swag/cmd/swag@latest && /Users/jahom/go/bin/swag init -g cmd/server/main.go -o docs` (in backend dir)
  4. Regenerate API client (`npm run generate-api`) (in frontend dir)
  5. Update frontend (React components, pages, hooks)
  6. Test integration

## Project Overview
React TypeScript frontend for the Track Your Finance application, built with Vite and Tailwind CSS.

## Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Heroicons
- **Date Handling**: date-fns

## Development Commands

### Start Development Server
```bash
npm run dev
# Starts development server on http://localhost:3000
# API requests are proxied to backend at http://localhost:8080
```

### Build for Production
```bash
npm run build
# Builds the project for production
```

### Lint Code
```bash
npm run lint
# Run ESLint to check for code issues
```

### Preview Production Build
```bash
npm run preview
# Preview the production build locally
```

### Generate API Client
```bash
npm run generate-api
# Fetches latest Swagger spec from backend and regenerates TypeScript API client
# Generated files are placed in src/generated/
```

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main app layout with navigation
│   └── ProtectedRoute.tsx # Route protection component
├── pages/              # Page components
│   ├── Landing.tsx     # Landing page with login/register
│   ├── AcceptInvitation.tsx # Complete registration with password
│   ├── Dashboard.tsx   # Main dashboard with stats
│   ├── SpendingDiary.tsx # Transaction management
│   └── RealEstate.tsx  # Property management
├── hooks/              # Custom React hooks
│   └── useAuth.tsx     # Authentication state management
├── services/           # API service functions
│   └── api.ts          # Generated API client wrapper
├── generated/          # Auto-generated from Swagger (DO NOT EDIT)
│   ├── api.ts          # Generated API classes and types
│   ├── base.ts         # Base API functionality
│   ├── configuration.ts # API configuration
│   └── index.ts        # Main exports
├── types/              # TypeScript type definitions (custom)
├── utils/              # Utility functions
├── App.tsx             # Root app component
├── main.tsx           # App entry point
└── index.css          # Global styles with Tailwind
```

## Features Implemented ✅

### Authentication System
- ✅ JWT-based authentication with local storage
- ✅ Protected routes that redirect to login
- ✅ Auth context provider for global state
- ✅ Login form with error handling

### Navigation & Layout
- ✅ Responsive navigation bar
- ✅ Route-based active states
- ✅ User profile display
- ✅ Logout functionality

### Dashboard
- ✅ Monthly financial overview
- ✅ Income, expense, and net amount cards
- ✅ Category breakdown with colors
- ✅ Integration with backend stats API

### API Integration
- ✅ Complete TypeScript types matching backend
- ✅ Axios client with JWT interceptor
- ✅ API services for all endpoints:
  - Authentication (login, register)
  - User profile management
  - Categories CRUD
  - Transactions CRUD
  - Properties CRUD
  - Real estate transactions CRUD
  - Statistics endpoints

## Backend Integration

### API Proxy Configuration
The Vite dev server proxies `/api` requests to `http://localhost:8080` (your Go backend).

### Authentication Flow
1. **Registration**: User provides nickname + email → Account created
2. **Email Invitation**: User receives email with activation link
3. **Accept Invitation**: User clicks link → `/accept-invitation?token=...` → Sets password
4. **Login**: User logs in with email + password → JWT token stored
5. **Authentication**: Token added to all API requests via interceptor
6. **Protected Routes**: Check for valid user state, redirect if needed

### Generated API Client
The project now includes auto-generated TypeScript API client from your backend's Swagger specification:

- **Generated Code**: Located in `src/generated/` (never edit manually)
- **Wrapper Service**: `src/services/generatedApi.ts` provides compatible interface
- **Type Safety**: Fully typed API calls matching your Go backend structs
- **Authentication**: Automatically includes JWT tokens from localStorage
- **Regeneration**: Run `npm run generate-api` to update after backend changes

### API Usage
All API calls now use the generated client:

```typescript
import { authApi, categoriesApi, transactionsApi } from '../services/api'

// Fully typed API calls
const categories = await categoriesApi.list({ type: 'EXPENSE' })
const user = await userApi.getProfile()
```

### Data Types
All TypeScript interfaces are auto-generated from your Go backend structs:
- Generated types: `ModelsUser`, `ModelsCategory`, `ModelsTransaction`, etc.
- All types are located in `src/generated/api.ts`

## Next Steps for Implementation

### Spending Diary Features
- [ ] Transaction list with pagination
- [ ] Add/Edit/Delete transaction forms
- [ ] Category management interface
- [ ] Date range filtering
- [ ] Monthly/yearly statistics charts

### Real Estate Features
- [ ] Property list with balance calculations
- [ ] Add/Edit property forms
- [ ] Property income/expense tracking
- [ ] ROI calculations and charts
- [ ] Property comparison views

### UI/UX Improvements
- [ ] Loading states and error boundaries
- [ ] Form validation with proper error messages
- [ ] Responsive design improvements
- [ ] Data visualization with charts (Chart.js/Recharts)
- [ ] Export functionality (PDF/CSV)

### Advanced Features
- [ ] Dark mode support
- [ ] Mobile-first responsive design
- [ ] Progressive Web App (PWA) features
- [ ] Real-time updates (WebSocket integration)

## Usage Examples

### Running the Full Stack
1. Start your Go backend: `go run cmd/server/main.go`
2. Start the React frontend: `npm run dev`
3. Navigate to `http://localhost:3000`
4. Login with your backend credentials

### API Integration Example
```typescript
// In a component
import { useState, useEffect } from 'react'
import { transactionsApi } from '../services/api'
import { ModelsTransaction } from '../generated'

const [transactions, setTransactions] = useState<ModelsTransaction[]>([])

useEffect(() => {
  const loadTransactions = async () => {
    try {
      const { transactions } = await transactionsApi.list({ page: 1, limit: 10 })
      setTransactions(transactions)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }
  
  loadTransactions()
}, [])
```

The frontend is now ready to work with your Go backend! Start the backend server and you'll have a fully functional finance tracking application.