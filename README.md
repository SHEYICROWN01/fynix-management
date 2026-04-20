# FynixCoBanking Admin Panel

Multi-tenant cooperative banking management platform.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router DOM v6
- **State**: TanStack React Query
- **Backend**: Laravel (PHP) with JWT auth

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at [http://localhost:8080](http://localhost:8080).

## Environment Variables

Copy `.env` and configure:

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_APP_NAME=FynixCoBanking Admin
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

