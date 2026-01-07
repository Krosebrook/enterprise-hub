/**
 * Test Utilities
 * 
 * Reusable utilities for testing React components.
 * Includes custom render functions with providers and common test helpers.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'

/**
 * Create a new QueryClient for testing
 * Configures client with test-friendly defaults (no retries, fast timeouts)
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper component that provides all necessary context providers
 * Use this to wrap components that need Router, QueryClient, or Auth context
 */
export function AllTheProviders({ children, queryClient }) {
  const testQueryClient = queryClient || createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

/**
 * Custom render function that wraps components with providers
 * Use this instead of RTL's render for components that need context
 * 
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(ui, options = {}) {
  const { queryClient, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

/**
 * Custom render for components that only need QueryClient (no Router/Auth)
 */
export function renderWithQueryClient(ui, options = {}) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...renderOptions,
  })
}

/**
 * Wait for an element to be removed from the document
 * Useful for testing loading states
 * 
 * @example
 * await waitForElementToBeRemoved(() => screen.getByText('Loading...'))
 */
export { waitForElementToBeRemoved } from '@testing-library/react'

/**
 * Wait for assertions to pass
 * Useful for async operations
 * 
 * @example
 * await waitFor(() => {
 *   expect(screen.getByText('Success')).toBeInTheDocument()
 * })
 */
export { waitFor } from '@testing-library/react'

/**
 * User event utilities for simulating user interactions
 * More realistic than fireEvent
 * 
 * @example
 * const user = userEvent.setup()
 * await user.click(button)
 * await user.type(input, 'Hello')
 */
export { default as userEvent } from '@testing-library/user-event'

/**
 * Create a mock user object for testing auth
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'developer',
    created_date: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock auth context value
 */
export function createMockAuthContext(overrides = {}) {
  return {
    user: createMockUser(),
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

// Re-export everything from RTL for convenience
export * from '@testing-library/react'
