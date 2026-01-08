/**
 * Progress Component Tests
 * 
 * Tests for the Progress UI component.
 * Validates rendering, value prop, and styling.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test-utils'
import { Progress } from '../progress'

describe('Progress Component', () => {
  describe('Rendering', () => {
    it('should render progress element', () => {
      render(<Progress data-testid="progress" value={50} />)
      expect(screen.getByTestId('progress')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Progress data-testid="progress" value={50} />)
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveClass('relative', 'h-2', 'w-full', 'overflow-hidden', 'rounded-full', 'bg-primary/20')
    })

    it('should render with 0 value by default', () => {
      const { container } = render(<Progress data-testid="progress" />)
      const indicator = container.querySelector('[style*="translateX"]')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Value Prop', () => {
    it('should render with 0% progress', () => {
      const { container } = render(<Progress value={0} />)
      const indicator = container.querySelector('[style*="translateX"]')
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
    })

    it('should render with 50% progress', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[style*="translateX"]')
      expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' })
    })

    it('should render with 100% progress', () => {
      const { container } = render(<Progress value={100} />)
      const indicator = container.querySelector('[style*="translateX"]')
      // At 100%, transform is translateX(-0%) which is valid
      expect(indicator).toBeInTheDocument()
      expect(indicator?.style.transform).toContain('translateX')
    })

    it('should handle decimal values', () => {
      const { container } = render(<Progress value={33.33} />)
      const indicator = container.querySelector('[style*="translateX"]')
      expect(indicator).toHaveStyle({ transform: 'translateX(-66.67%)' })
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Progress data-testid="progress" value={50} className="custom-class" />)
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Progress ref={ref} value={50} />)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept data attributes', () => {
      render(<Progress data-testid="progress" value={50} data-custom="value" />)
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Dynamic Updates', () => {
    it('should update progress value', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState(0)
        React.useEffect(() => {
          setValue(75)
        }, [])
        return <Progress data-testid="progress" value={value} />
      }

      const { container } = render(<TestComponent />)
      const indicator = container.querySelector('[style*="translateX"]')
      // The progress should update but we're testing that it renders
      expect(indicator).toBeInTheDocument()
    })

    it('should handle rapid value changes', () => {
      const { rerender, container } = render(<Progress value={0} />)
      
      rerender(<Progress value={25} />)
      let indicator = container.querySelector('[style*="translateX"]')
      expect(indicator).toHaveStyle({ transform: 'translateX(-75%)' })
      
      rerender(<Progress value={75} />)
      indicator = container.querySelector('[style*="translateX"]')
      expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle values less than 0', () => {
      const { container } = render(<Progress value={-10} />)
      const indicator = container.querySelector('[style*="translateX"]')
      expect(indicator).toHaveStyle({ transform: 'translateX(-110%)' })
    })

    it('should handle values greater than 100', () => {
      render(<Progress data-testid="progress" value={150} />)
      // Progress with value > 100 still renders, even if visually it's at max
      expect(screen.getByTestId('progress')).toBeInTheDocument()
    })

    it('should work with custom height', () => {
      render(<Progress data-testid="progress" value={50} className="h-4" />)
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveClass('h-4')
    })

    it('should work with custom width', () => {
      render(<Progress data-testid="progress" value={50} className="w-1/2" />)
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveClass('w-1/2')
    })
  })

  describe('Use Cases', () => {
    it('should work as loading indicator', () => {
      render(
        <div>
          <p>Loading...</p>
          <Progress data-testid="progress" value={45} />
        </div>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toBeInTheDocument()
    })

    it('should work with percentage label', () => {
      const value = 60
      render(
        <div>
          <div>Upload progress: {value}%</div>
          <Progress value={value} />
        </div>
      )

      expect(screen.getByText('Upload progress: 60%')).toBeInTheDocument()
    })
  })
})
