/**
 * Skeleton Component Tests
 * 
 * Tests for the Skeleton UI component.
 * Validates rendering and styling for loading states.
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test-utils'
import { Skeleton } from '../skeleton'

describe('Skeleton Component', () => {
  describe('Rendering', () => {
    it('should render skeleton element', () => {
      render(<Skeleton data-testid="skeleton" />)
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Skeleton data-testid="skeleton" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-primary/10')
    })

    it('should render as a div element', () => {
      render(<Skeleton data-testid="skeleton" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton.tagName).toBe('DIV')
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Skeleton data-testid="skeleton" className="custom-class" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('custom-class')
    })

    it('should accept custom dimensions', () => {
      render(<Skeleton data-testid="skeleton" className="h-10 w-40" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-10', 'w-40')
    })

    it('should accept data attributes', () => {
      render(<Skeleton data-testid="skeleton" data-custom="value" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Common Use Cases', () => {
    it('should work as text placeholder', () => {
      render(<Skeleton data-testid="skeleton" className="h-4 w-full" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-4', 'w-full')
    })

    it('should work as avatar placeholder', () => {
      render(<Skeleton data-testid="skeleton" className="h-12 w-12 rounded-full" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full')
    })

    it('should work as card placeholder', () => {
      render(
        <div>
          <Skeleton data-testid="header" className="h-8 w-3/4 mb-4" />
          <Skeleton data-testid="content" className="h-4 w-full mb-2" />
          <Skeleton data-testid="footer" className="h-4 w-2/3" />
        </div>
      )

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  describe('Multiple Skeletons', () => {
    it('should render multiple skeleton elements', () => {
      render(
        <>
          <Skeleton data-testid="skeleton1" className="h-4 w-full mb-2" />
          <Skeleton data-testid="skeleton2" className="h-4 w-full mb-2" />
          <Skeleton data-testid="skeleton3" className="h-4 w-3/4" />
        </>
      )

      expect(screen.getByTestId('skeleton1')).toBeInTheDocument()
      expect(screen.getByTestId('skeleton2')).toBeInTheDocument()
      expect(screen.getByTestId('skeleton3')).toBeInTheDocument()
    })

    it('should work in list pattern', () => {
      const skeletons = [1, 2, 3]
      render(
        <div>
          {skeletons.map((i) => (
            <Skeleton key={i} data-testid={`skeleton-${i}`} className="h-16 mb-4" />
          ))}
        </div>
      )

      expect(screen.getByTestId('skeleton-1')).toBeInTheDocument()
      expect(screen.getByTestId('skeleton-2')).toBeInTheDocument()
      expect(screen.getByTestId('skeleton-3')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty skeleton', () => {
      render(<Skeleton data-testid="skeleton"></Skeleton>)
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('should work with different shapes', () => {
      render(
        <>
          <Skeleton data-testid="rect" className="rounded-md" />
          <Skeleton data-testid="circle" className="rounded-full" />
          <Skeleton data-testid="square" className="rounded-none" />
        </>
      )

      expect(screen.getByTestId('rect')).toHaveClass('rounded-md')
      expect(screen.getByTestId('circle')).toHaveClass('rounded-full')
      expect(screen.getByTestId('square')).toHaveClass('rounded-none')
    })
  })
})
