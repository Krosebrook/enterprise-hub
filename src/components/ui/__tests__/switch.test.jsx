/**
 * Switch Component Tests
 * 
 * Tests for the Switch UI component.
 * Validates rendering, checked state, interaction, and accessibility.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-utils'
import { Switch } from '../switch'

describe('Switch Component', () => {
  describe('Rendering', () => {
    it('should render switch element', () => {
      render(<Switch aria-label="test switch" />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Switch aria-label="test switch" data-testid="switch" />)
      const switchElem = screen.getByTestId('switch')
      expect(switchElem).toHaveClass('inline-flex', 'h-5', 'w-9', 'rounded-full', 'border-2')
    })

    it('should render unchecked by default', () => {
      render(<Switch aria-label="test switch" />)
      const switchElem = screen.getByRole('switch')
      expect(switchElem).toHaveAttribute('data-state', 'unchecked')
    })
  })

  describe('Checked State', () => {
    it('should render as checked when checked prop is true', () => {
      render(<Switch aria-label="test switch" checked />)
      const switchElem = screen.getByRole('switch')
      expect(switchElem).toHaveAttribute('data-state', 'checked')
    })

    it('should render as unchecked when checked prop is false', () => {
      render(<Switch aria-label="test switch" checked={false} />)
      const switchElem = screen.getByRole('switch')
      expect(switchElem).toHaveAttribute('data-state', 'unchecked')
    })
  })

  describe('Interaction', () => {
    it('should toggle when clicked', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Switch aria-label="test switch" onCheckedChange={handleChange} />)
      const switchElem = screen.getByRole('switch')
      
      await user.click(switchElem)
      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should call onCheckedChange with false when turning off', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Switch aria-label="test switch" checked onCheckedChange={handleChange} />)
      const switchElem = screen.getByRole('switch')
      
      await user.click(switchElem)
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('should not toggle when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Switch aria-label="test switch" disabled onCheckedChange={handleChange} />)
      const switchElem = screen.getByRole('switch')
      
      await user.click(switchElem)
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Switch aria-label="test switch" onCheckedChange={handleChange} />)
      const switchElem = screen.getByRole('switch')
      
      switchElem.focus()
      expect(switchElem).toHaveFocus()
      
      await user.keyboard(' ')
      expect(handleChange).toHaveBeenCalled()
    })

    it('should have disabled state', () => {
      render(<Switch aria-label="test switch" disabled data-testid="switch" />)
      const switchElem = screen.getByTestId('switch')
      expect(switchElem).toBeDisabled()
      expect(switchElem).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should support aria-label', () => {
      render(<Switch aria-label="Enable notifications" />)
      expect(screen.getByRole('switch', { name: /enable notifications/i })).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Switch aria-label="test switch" aria-describedby="helper-text" />
          <span id="helper-text">Helper text</span>
        </>
      )
      const switchElem = screen.getByRole('switch')
      expect(switchElem).toHaveAttribute('aria-describedby', 'helper-text')
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Switch aria-label="test switch" className="custom-class" data-testid="switch" />)
      const switchElem = screen.getByTestId('switch')
      expect(switchElem).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Switch ref={ref} aria-label="test switch" />)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Controlled Component', () => {
    it('should work as a controlled component', async () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false)
        return (
          <Switch
            aria-label="controlled switch"
            checked={checked}
            onCheckedChange={setChecked}
          />
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />)
      const switchElem = screen.getByRole('switch')

      expect(switchElem).toHaveAttribute('data-state', 'unchecked')
      
      await user.click(switchElem)
      expect(switchElem).toHaveAttribute('data-state', 'checked')
      
      await user.click(switchElem)
      expect(switchElem).toHaveAttribute('data-state', 'unchecked')
    })
  })

  describe('Edge Cases', () => {
    it('should handle defaultChecked prop', () => {
      render(<Switch aria-label="test switch" defaultChecked />)
      const switchElem = screen.getByRole('switch')
      expect(switchElem).toHaveAttribute('data-state', 'checked')
    })

    it('should work with form-like patterns', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Switch aria-label="Accept terms" />
          <button type="submit">Submit</button>
        </form>
      )
      
      expect(screen.getByRole('switch')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
