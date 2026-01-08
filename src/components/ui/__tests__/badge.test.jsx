/**
 * Badge Component Tests
 * 
 * Tests for the Badge UI component.
 * Validates rendering, variants, and styling.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-utils'
import { Badge } from '../badge'

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render badge element', () => {
      render(<Badge data-testid="badge">Badge Text</Badge>)
      expect(screen.getByTestId('badge')).toBeInTheDocument()
      expect(screen.getByText('Badge Text')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Badge data-testid="badge">Badge</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md', 'border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold')
    })

    it('should render with default variant', () => {
      render(<Badge data-testid="badge">Default</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })
  })

  describe('Variants', () => {
    it('should render with secondary variant', () => {
      render(<Badge data-testid="badge" variant="secondary">Secondary</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should render with destructive variant', () => {
      render(<Badge data-testid="badge" variant="destructive">Destructive</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('should render with outline variant', () => {
      render(<Badge data-testid="badge" variant="outline">Outline</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('text-foreground')
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Badge data-testid="badge" className="custom-class">Custom</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('custom-class')
    })

    it('should accept data attributes', () => {
      render(<Badge data-testid="badge" data-custom="value">Badge</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-custom', 'value')
    })

    it('should accept onClick handler', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Badge data-testid="badge" onClick={handleClick}>Clickable</Badge>)
      const badge = screen.getByTestId('badge')
      
      await user.click(badge)
      expect(handleClick).toHaveBeenCalledOnce()
    })
  })

  describe('Content', () => {
    it('should render with text content', () => {
      render(<Badge>Simple Text</Badge>)
      expect(screen.getByText('Simple Text')).toBeInTheDocument()
    })

    it('should render with numeric content', () => {
      render(<Badge>42</Badge>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render with icon and text', () => {
      render(
        <Badge>
          <span>🔥</span>
          <span>Hot</span>
        </Badge>
      )
      expect(screen.getByText('🔥')).toBeInTheDocument()
      expect(screen.getByText('Hot')).toBeInTheDocument()
    })

    it('should handle empty content', () => {
      render(<Badge data-testid="badge"></Badge>)
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should render multiple badges', () => {
      render(
        <>
          <Badge>First</Badge>
          <Badge>Second</Badge>
          <Badge>Third</Badge>
        </>
      )
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
    })

    it('should work with long text', () => {
      const longText = 'This is a very long badge text that might wrap'
      render(<Badge>{longText}</Badge>)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })
})
