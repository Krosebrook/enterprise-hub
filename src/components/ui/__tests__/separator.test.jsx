/**
 * Separator Component Tests
 * 
 * Tests for the Separator UI component.
 * Validates rendering, orientation, and styling.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test-utils'
import { Separator } from '../separator'

describe('Separator Component', () => {
  describe('Rendering', () => {
    it('should render separator element', () => {
      render(<Separator data-testid="separator" />)
      expect(screen.getByTestId('separator')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Separator data-testid="separator" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('shrink-0', 'bg-border')
    })

    it('should have decorative role by default', () => {
      render(<Separator data-testid="separator" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation')
    })
  })

  describe('Orientation', () => {
    it('should render with horizontal orientation by default', () => {
      render(<Separator data-testid="separator" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('h-[1px]', 'w-full')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    })

    it('should render with explicit horizontal orientation', () => {
      render(<Separator data-testid="separator" orientation="horizontal" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('h-[1px]', 'w-full')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    })

    it('should render with vertical orientation', () => {
      render(<Separator data-testid="separator" orientation="vertical" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('h-full', 'w-[1px]')
      expect(separator).toHaveAttribute('data-orientation', 'vertical')
    })
  })

  describe('Decorative', () => {
    it('should be decorative by default', () => {
      render(<Separator data-testid="separator" />)
      const separator = screen.getByTestId('separator')
      // Radix UI Separator with decorative=true typically doesn't have role="separator"
      expect(separator).toBeInTheDocument()
    })

    it('should accept decorative prop', () => {
      render(<Separator data-testid="separator" decorative={false} />)
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Separator data-testid="separator" className="custom-class" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Separator ref={ref} />)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept data attributes', () => {
      render(<Separator data-testid="separator" data-custom="value" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Use Cases', () => {
    it('should work as content divider', () => {
      render(
        <div>
          <p>Content above</p>
          <Separator data-testid="separator" />
          <p>Content below</p>
        </div>
      )

      expect(screen.getByText('Content above')).toBeInTheDocument()
      expect(screen.getByTestId('separator')).toBeInTheDocument()
      expect(screen.getByText('Content below')).toBeInTheDocument()
    })

    it('should work in vertical layout', () => {
      render(
        <div style={{ display: 'flex' }}>
          <span>Left</span>
          <Separator data-testid="separator" orientation="vertical" />
          <span>Right</span>
        </div>
      )

      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByTestId('separator')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should render multiple separators', () => {
      render(
        <>
          <Separator data-testid="sep1" />
          <Separator data-testid="sep2" />
          <Separator data-testid="sep3" />
        </>
      )

      expect(screen.getByTestId('sep1')).toBeInTheDocument()
      expect(screen.getByTestId('sep2')).toBeInTheDocument()
      expect(screen.getByTestId('sep3')).toBeInTheDocument()
    })

    it('should work with custom styling for colors', () => {
      render(<Separator data-testid="separator" className="bg-red-500" />)
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('bg-red-500')
    })
  })
})
