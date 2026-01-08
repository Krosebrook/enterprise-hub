# Contributing to Enterprise Hub

Thank you for your interest in contributing to Enterprise Hub! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Security](#security)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, or nationality.

### Expected Behavior

- Be respectful and considerate in your communication
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility and apologize for mistakes
- Learn from the experience and improve

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

### Enforcement

Violations of the Code of Conduct should be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Base44 account for testing

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/enterprise-hub.git
cd enterprise-hub
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/Krosebrook/enterprise-hub.git
```

4. **Install dependencies**:
```bash
npm install
```

5. **Create environment file**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Base44 credentials.

6. **Start development server**:
```bash
npm run dev
```

7. **Verify setup**: Open http://localhost:5173 in your browser

---

## Development Workflow

### Branching Strategy

We use a feature branch workflow:

- `main` - Production-ready code
- `develop` - Integration branch for features (if applicable)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions/improvements

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Making Changes

1. **Make your changes** following our [Coding Standards](#coding-standards)

2. **Test your changes** thoroughly

3. **Lint your code**:
```bash
npm run lint:fix
npm run typecheck
```

4. **Commit your changes**:
```bash
git add .
git commit -m "Clear description of your changes"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: Add new feature`
- `fix: Fix bug in component`
- `docs: Update documentation`
- `style: Format code`
- `refactor: Refactor component`
- `test: Add tests`
- `chore: Update dependencies`

5. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request** on GitHub

---

## Coding Standards

### React/JavaScript

#### Component Structure

```javascript
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Component description
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Title to display
 */
export default function MyComponent({ title, onAction }) {
  const [isLoading, setIsLoading] = useState(false);

  // Query data
  const { data, error } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => base44.entities.MyEntity.list('-created_date', 50)
  });

  // Event handlers
  const handleClick = () => {
    setIsLoading(true);
    onAction();
    setIsLoading(false);
  };

  // Render loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Render error state
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Main render
  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={handleClick}>Action</Button>
    </Card>
  );
}
```

#### Key Principles

1. **Functional Components**: Always use functional components with hooks
2. **Single Responsibility**: Each component should do one thing well
3. **Props Destructuring**: Destructure props in the function signature
4. **Hooks Order**: Follow React hooks rules (order matters!)
5. **Early Returns**: Handle loading/error states with early returns
6. **Clear Naming**: Use descriptive names for variables and functions

### Styling

#### Tailwind CSS

```javascript
// Good: Use utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-slate-900">Title</h2>
  <Button>Action</Button>
</div>

// Avoid: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  ...
</div>
```

#### Responsive Design

```javascript
// Mobile-first approach
<div className="
  p-4              /* mobile */
  md:p-6           /* tablet */
  lg:p-8           /* desktop */
  grid grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
">
  {/* Content */}
</div>
```

### State Management

#### Local State

```javascript
// Use useState for component-local state
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });
```

#### Server State

```javascript
// Use React Query for server state
const { data: agents, isLoading } = useQuery({
  queryKey: ['agents'],
  queryFn: () => base44.entities.Agent.list('-created_date', 50),
  initialData: []
});

// Mutations
const createMutation = useMutation({
  mutationFn: (newAgent) => base44.entities.Agent.create(newAgent),
  onSuccess: () => {
    queryClient.invalidateQueries(['agents']);
  }
});
```

#### Global State

```javascript
// Use Context for global state
import { useAuth } from '@/lib/AuthContext';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  // ...
}
```

### Error Handling

```javascript
// Always handle errors
try {
  const result = await base44.entities.Agent.create(data);
  toast.success('Agent created successfully');
} catch (error) {
  console.error('Error creating agent:', error);
  toast.error(error.message || 'Failed to create agent');
}

// Error boundaries for components
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

### File Organization

```
src/
├── api/              # API clients
├── components/
│   ├── ui/          # Reusable UI components
│   ├── domain/      # Domain-specific components
│   └── layouts/     # Layout components
├── hooks/           # Custom hooks
├── lib/             # Utilities and contexts
├── pages/           # Page components
└── utils/           # Helper functions
```

### Naming Conventions

- **Components**: PascalCase (e.g., `AgentCard.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAgents.js`)
- **Utilities**: camelCase (e.g., `formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **CSS Classes**: kebab-case (via Tailwind)

---

## Pull Request Process

### Before Submitting

- [ ] Code follows our style guidelines
- [ ] All tests pass (once testing is set up)
- [ ] Linting passes without errors
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Changes work on mobile and desktop
- [ ] No security vulnerabilities introduced

### PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: Add real-time collaboration to Architecture Designer
fix: Correct agent cost calculation
docs: Update API documentation
refactor: Simplify authentication flow
```

### PR Description Template

```markdown
## Description
[Clear description of what this PR does]

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added feature X
- Updated component Y
- Fixed bug in Z

## Testing
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Added integration tests
- [ ] Manual testing performed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tests pass
```

### Review Process

1. **Automated Checks**: CI/CD runs linting, tests, builds
2. **Code Review**: At least one maintainer reviews your code
3. **Feedback**: Address review comments
4. **Approval**: Once approved, a maintainer will merge

### After Merge

- Delete your feature branch (if no longer needed)
- Update your local repository:
```bash
git checkout main
git pull upstream main
```

---

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Open Vitest UI (interactive dashboard)
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests should be co-located with source files:

```
src/
├── components/
│   └── MyComponent.jsx
│   └── __tests__/
│       └── MyComponent.test.jsx
```

### Unit Tests

```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onAction when button clicked', async () => {
    const mockAction = vi.fn()
    const user = userEvent.setup()
    
    render(<MyComponent title="Test" onAction={mockAction} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(mockAction).toHaveBeenCalledOnce()
  })
})
```

### Testing with Providers

For components that need React Query, Router, or Auth context:

```javascript
import { renderWithProviders } from '@/test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render with providers', () => {
    const { getByText } = renderWithProviders(<MyComponent />)
    expect(getByText('Hello')).toBeInTheDocument()
  })
})
```

### Mock Data Factories

Use test factories for creating mock data:

```javascript
import { createMockAgent, createMockUser, createMany } from '@/test-factories'

// Create single entity
const agent = createMockAgent({ name: 'Custom Name' })

// Create multiple entities
const users = createMany(createMockUser, 5)
```

### Mocking Base44 API Calls

```javascript
import { vi } from 'vitest'
import { base44 } from '@/api/base44Client'

// Mock the API call
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Agent: {
        list: vi.fn(() => Promise.resolve([createMockAgent()])),
        create: vi.fn((data) => Promise.resolve({ id: 'new-id', ...data })),
      },
    },
  },
}))
```

### Integration Tests

Integration tests validate complete user flows end-to-end:

```javascript
import { renderWithProviders } from '@/test-utils'

describe('Agent Creation Flow', () => {
  it('creates agent successfully', async () => {
    const user = userEvent.setup()
    
    // Render the agent creation form
    renderWithProviders(<AgentCreate />)
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/name/i), 'Test Agent')
    await user.type(screen.getByLabelText(/description/i), 'Test description')
    await user.selectOptions(screen.getByLabelText(/model/i), 'gpt-4')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }))
    
    // Verify success message
    expect(await screen.findByText(/agent created/i)).toBeInTheDocument()
  })
})
```

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] Error states handled gracefully
- [ ] Loading states display correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] No console errors
- [ ] Accessibility: Keyboard navigation works
- [ ] Accessibility: Screen reader friendly

---

## Documentation

### Code Documentation

```javascript
/**
 * Fetches and filters agents based on status
 * 
 * @param {string} status - Agent status to filter by
 * @returns {Promise<Array>} List of filtered agents
 * @throws {Error} If API request fails
 */
async function fetchAgentsByStatus(status) {
  // Implementation
}
```

### README Updates

Update `README.md` when you:
- Add new features
- Change setup process
- Update dependencies
- Modify configuration

### Documentation Files

- `ARCHITECTURE.md` - For architectural changes
- `API_DOCUMENTATION.md` - For API changes
- `DATABASE_SCHEMA.md` - For entity changes
- `MVP_ROADMAP.md` - For roadmap updates

---

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security contact (TBD)
2. Use GitHub Security Advisories
3. Provide detailed reproduction steps

See [SECURITY.md](./SECURITY.md) for full details.

### Security Checklist

- [ ] No hardcoded credentials or API keys
- [ ] All user inputs validated
- [ ] Authorization checks on server side
- [ ] No XSS vulnerabilities
- [ ] Dependencies scanned (`npm audit`)
- [ ] Sensitive data encrypted
- [ ] Error messages don't leak sensitive info

---

## Getting Help

### Resources

- **Documentation**: See root folder markdown files
- **GitHub Issues**: Search existing issues first
- **GitHub Discussions**: For questions and ideas
- **Feature Template**: `.github/FEATURE_TO_PR_TEMPLATE.md`

### Questions?

- Open a [GitHub Discussion](https://github.com/Krosebrook/enterprise-hub/discussions)
- Tag your question appropriately
- Provide context and code examples
- Be patient and respectful

---

## Recognition

Contributors will be recognized in:
- `CHANGELOG.md` for significant contributions
- GitHub contributors list
- Release notes for major features

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Enterprise Hub!** 🎉

Your contributions help make AI governance more accessible and effective for organizations worldwide.

---

**Last Updated**: 2025-01-07  
**Version**: 1.0
