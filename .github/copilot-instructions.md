# GitHub Copilot Instructions for Enterprise Hub

This document provides specific guidance for GitHub Copilot agents working on the Enterprise Hub repository.

## Quick Reference

**Repository**: Krosebrook/enterprise-hub  
**Purpose**: Enterprise AI governance, compliance, and architecture management platform  
**Stack**: React 18 + Vite 6+ + Tailwind CSS + Radix UI + Base44 SDK

## Before Starting Any Task

1. **Review** `DOCS_INDEX_LLM.md` to find relevant documentation for your task
2. **Read** `.github/FEATURE_TO_PR_TEMPLATE.md` for the complete feature implementation workflow
3. **Check** `README.md` for setup and environment configuration
4. **Understand** the codebase structure (see below)
5. **Run** `npm install` if dependencies are not yet installed

## Repository Structure

```
enterprise-hub/
├── src/
│   ├── pages/           # Main application pages (Dashboard, Agents, etc.)
│   ├── components/      # Reusable React components
│   │   ├── ui/         # Radix UI wrapper components
│   │   ├── architecture/ # Architecture-specific components
│   │   ├── dashboard/  # Dashboard-specific components
│   │   ├── policy/     # Policy-related components
│   │   └── rbac/       # Role-Based Access Control components
│   ├── lib/            # Utility libraries and contexts
│   ├── hooks/          # Custom React hooks
│   ├── api/            # API client configuration
│   ├── utils/          # Utility functions
│   └── pages.config.js # Page routing configuration
├── functions/          # Backend serverless functions (Base44)
└── .github/            # GitHub and Copilot configuration
```

## Coding Standards

### React Components

- Use **functional components** with hooks
- Follow existing file naming: PascalCase for components (e.g., `AgentCard.jsx`)
- Import order: React → third-party → local components → utilities → styles
- Use destructuring for props
- Keep components focused and single-responsibility

**Example**:
```jsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function MyComponent({ title, data }) {
  const [loading, setLoading] = useState(false);
  
  // Component logic here
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {/* Rest of component */}
    </Card>
  );
}
```

### Styling

- **Always use Tailwind CSS** utility classes
- Reference existing components for consistent spacing, colors, and patterns
- Use theme colors from `tailwind.config.js`:
  - `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`
- For custom colors, extend the theme in `tailwind.config.js` rather than using arbitrary values

### State Management

- **Local state**: `useState` for component-specific state
- **Global state**: React Context (see `src/lib/AuthContext.jsx`)
- **Server state**: `@tanstack/react-query` with `useQuery` and `useMutation`
- **Forms**: React Hook Form (if needed for complex forms)

### Authentication & Authorization

- Use `useAuth()` hook from `src/lib/AuthContext.jsx` to access user and auth state
- Use `<PermissionGate>` component for RBAC checks
- Base44 authentication is handled via `base44.auth.me()` and `base44.auth.login()`

**Example**:
```jsx
import { useAuth } from '@/lib/AuthContext';
import PermissionGate from '@/components/rbac/PermissionGate';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <PermissionGate permission="admin">
      <Button>Admin Only Action</Button>
    </PermissionGate>
  );
}
```

### Data Fetching

Use React Query for all API calls:

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function MyComponent() {
  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list('-created_date', 50),
    initialData: []
  });
  
  // Mutate data
  const createMutation = useMutation({
    mutationFn: (newAgent) => base44.entities.Agent.create(newAgent),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['agents']);
    }
  });
  
  return (/* ... */);
}
```

### Error Handling

- Use try/catch blocks for async operations
- Display user-friendly error messages using `toast` from `react-hot-toast` or `sonner`
- Log errors to console for debugging: `console.error('Error context:', error)`
- Consider error boundaries for component-level errors

### Component Library

**Always use Radix UI components** from `src/components/ui/`:
- Button, Card, Dialog, Dropdown, Input, Label, Select, Tabs, Toast, etc.
- These are pre-styled wrappers around Radix primitives
- Check existing components for usage examples

### Icons

Use **Lucide React** for all icons:
```jsx
import { Plus, Edit, Trash2, Check } from 'lucide-react';
```

## Common Patterns

### Page Layout

Most pages follow this structure:

```jsx
export default function MyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Page Title</h1>
        <Button>Action</Button>
      </div>
      
      {/* Main content */}
      <div className="grid gap-6">
        {/* Content cards */}
      </div>
    </div>
  );
}
```

### Loading States

```jsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
}
```

### Empty States

```jsx
{data.length === 0 && (
  <Card className="p-12 text-center">
    <p className="text-muted-foreground mb-4">No items found</p>
    <Button onClick={handleCreate}>
      <Plus className="mr-2 h-4 w-4" />
      Create New
    </Button>
  </Card>
)}
```

## Testing

⚠️ **Note**: This repository currently has no test infrastructure set up.

When adding tests in the future:
- Set up Vitest for unit and component testing
- Use React Testing Library for component tests
- Follow the patterns in `.github/FEATURE_TO_PR_TEMPLATE.md`

## Linting & Code Quality

Before committing:
```bash
npm run lint        # Check for errors
npm run lint:fix    # Auto-fix issues
```

**Common issues**: Unused imports (use lint:fix to clean up)

## Environment Setup

Create `.env.local` with:
```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

## Git Workflow

1. Work on feature branches: `feature/description` or `fix/description`
2. Keep commits focused and atomic
3. Write clear commit messages: "Add agent filtering feature" not "Update files"
4. Use `report_progress` tool frequently to commit and update PR

## When Adding New Features

1. ✅ **DO**: Check existing similar features for patterns
2. ✅ **DO**: Reuse existing components from `src/components/ui`
3. ✅ **DO**: Follow existing file structure and naming
4. ✅ **DO**: Add to `pages.config.js` if creating a new page
5. ❌ **DON'T**: Create duplicate components
6. ❌ **DON'T**: Use inline styles or custom CSS files
7. ❌ **DON'T**: Add new dependencies without justification

## Security Considerations

- Never commit API keys, tokens, or credentials
- Always validate user inputs
- Use server-side authorization checks (not just UI hiding)
- Be careful with user-generated content (XSS risks)
- Run `npm audit` before adding new dependencies

## Performance Best Practices

- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` for expensive computations
- Lazy load heavy components with `React.lazy`
- Optimize images and assets
- Keep bundle size in check (check with `npm run build`)

## Questions or Issues?

Refer to:
- `DOCS_INDEX_LLM.md` - Quick reference to all documentation
- `.github/FEATURE_TO_PR_TEMPLATE.md` - Complete workflow guide
- `README.md` - Setup and getting started
- Existing code - Look for similar implementations

When stuck, **ask specific questions** rather than guessing patterns.

---

**Last Updated**: 2025-12-30
