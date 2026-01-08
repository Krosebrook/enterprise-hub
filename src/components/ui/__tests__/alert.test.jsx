/**
 * Alert Component Tests
 * 
 * Tests for the Alert UI component and its sub-components.
 * Validates rendering, variants, and composition.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test-utils'
import { Alert, AlertTitle, AlertDescription } from '../alert'

describe('Alert Component', () => {
  describe('Alert', () => {
    it('should render alert element', () => {
      render(<Alert data-testid="alert">Alert content</Alert>)
      expect(screen.getByTestId('alert')).toBeInTheDocument()
    })

    it('should have role="alert"', () => {
      render(<Alert>Alert message</Alert>)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Alert data-testid="alert">Content</Alert>)
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'px-4', 'py-3', 'text-sm')
    })

    it('should render with default variant', () => {
      render(<Alert data-testid="alert">Default alert</Alert>)
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('bg-background', 'text-foreground')
    })

    it('should render with destructive variant', () => {
      render(<Alert data-testid="alert" variant="destructive">Error alert</Alert>)
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Alert ref={ref}>Alert</Alert>)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept custom className', () => {
      render(<Alert data-testid="alert" className="custom-class">Alert</Alert>)
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('custom-class')
    })
  })

  describe('AlertTitle', () => {
    it('should render alert title', () => {
      render(
        <Alert>
          <AlertTitle>Title Text</AlertTitle>
        </Alert>
      )
      expect(screen.getByText('Title Text')).toBeInTheDocument()
    })

    it('should render as h5 element', () => {
      render(<AlertTitle data-testid="title">Title</AlertTitle>)
      const title = screen.getByTestId('title')
      expect(title.tagName).toBe('H5')
    })

    it('should apply title styling', () => {
      render(<AlertTitle data-testid="title">Title</AlertTitle>)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<AlertTitle ref={ref}>Title</AlertTitle>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('AlertDescription', () => {
    it('should render alert description', () => {
      render(
        <Alert>
          <AlertDescription>Description text</AlertDescription>
        </Alert>
      )
      expect(screen.getByText('Description text')).toBeInTheDocument()
    })

    it('should apply description styling', () => {
      render(<AlertDescription data-testid="desc">Description</AlertDescription>)
      const desc = screen.getByTestId('desc')
      expect(desc).toHaveClass('text-sm')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<AlertDescription ref={ref}>Description</AlertDescription>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Composition', () => {
    it('should render complete alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Error Occurred</AlertTitle>
          <AlertDescription>Something went wrong. Please try again.</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Error Occurred')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })

    it('should work with only title', () => {
      render(
        <Alert>
          <AlertTitle>Simple Alert</AlertTitle>
        </Alert>
      )

      expect(screen.getByText('Simple Alert')).toBeInTheDocument()
    })

    it('should work with only description', () => {
      render(
        <Alert>
          <AlertDescription>Alert without title</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Alert without title')).toBeInTheDocument()
    })

    it('should work with icon, title, and description', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon">Icon</svg>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This is a warning message</AlertDescription>
        </Alert>
      )

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      expect(screen.getByText('Warning')).toBeInTheDocument()
      expect(screen.getByText('This is a warning message')).toBeInTheDocument()
    })
  })

  describe('Variants with Content', () => {
    it('should render default variant with content', () => {
      render(
        <Alert variant="default" data-testid="alert">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>Informational message</AlertDescription>
        </Alert>
      )

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('bg-background')
      expect(screen.getByText('Info')).toBeInTheDocument()
    })

    it('should render destructive variant with content', () => {
      render(
        <Alert variant="destructive" data-testid="alert">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Error message</AlertDescription>
        </Alert>
      )

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('text-destructive')
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty alert', () => {
      render(<Alert data-testid="alert"></Alert>)
      expect(screen.getByTestId('alert')).toBeInTheDocument()
    })

    it('should render multiple alerts', () => {
      render(
        <>
          <Alert>
            <AlertTitle>First Alert</AlertTitle>
          </Alert>
          <Alert>
            <AlertTitle>Second Alert</AlertTitle>
          </Alert>
        </>
      )

      expect(screen.getByText('First Alert')).toBeInTheDocument()
      expect(screen.getByText('Second Alert')).toBeInTheDocument()
    })

    it('should work with long description text', () => {
      const longText = 'This is a very long alert description that contains multiple sentences and might wrap to multiple lines in the UI.'
      render(
        <Alert>
          <AlertDescription>{longText}</AlertDescription>
        </Alert>
      )

      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })
})
