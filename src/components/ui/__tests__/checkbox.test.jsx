/**
 * Checkbox Component Tests
 * 
 * Tests for the Checkbox UI component.
 * Validates rendering, checked state, interaction, and accessibility.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-utils'
import { Checkbox } from '../checkbox'

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('should render checkbox element', () => {
      render(<Checkbox aria-label="test checkbox" />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Checkbox aria-label="test checkbox" data-testid="checkbox" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('h-4', 'w-4', 'rounded-sm', 'border', 'border-primary')
    })

    it('should render unchecked by default', () => {
      render(<Checkbox aria-label="test checkbox" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('Checked State', () => {
    it('should render as checked when checked prop is true', () => {
      render(<Checkbox aria-label="test checkbox" checked />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('should render as unchecked when checked prop is false', () => {
      render(<Checkbox aria-label="test checkbox" checked={false} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    })

    it('should show check icon when checked', () => {
      const { container } = render(<Checkbox checked aria-label="test checkbox" />)
      const indicator = container.querySelector('[data-state="checked"]')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('should toggle when clicked', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Checkbox aria-label="test checkbox" onCheckedChange={handleChange} />)
      const checkbox = screen.getByRole('checkbox')
      
      await user.click(checkbox)
      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should call onCheckedChange with false when unchecking', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Checkbox aria-label="test checkbox" checked onCheckedChange={handleChange} />)
      const checkbox = screen.getByRole('checkbox')
      
      await user.click(checkbox)
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('should not toggle when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Checkbox aria-label="test checkbox" disabled onCheckedChange={handleChange} />)
      const checkbox = screen.getByRole('checkbox')
      
      await user.click(checkbox)
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Checkbox aria-label="test checkbox" onCheckedChange={handleChange} />)
      const checkbox = screen.getByRole('checkbox')
      
      checkbox.focus()
      expect(checkbox).toHaveFocus()
      
      await user.keyboard(' ')
      expect(handleChange).toHaveBeenCalled()
    })

    it('should have disabled state', () => {
      render(<Checkbox aria-label="test checkbox" disabled data-testid="checkbox" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toBeDisabled()
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should support aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />)
      expect(screen.getByRole('checkbox', { name: /accept terms/i })).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Checkbox aria-label="test checkbox" aria-describedby="helper-text" />
          <span id="helper-text">Helper text</span>
        </>
      )
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-describedby', 'helper-text')
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Checkbox aria-label="test checkbox" className="custom-class" data-testid="checkbox" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Checkbox ref={ref} aria-label="test checkbox" />)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept value attribute', () => {
      render(<Checkbox aria-label="test checkbox" value="accepted" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('value', 'accepted')
    })
  })

  describe('Controlled Component', () => {
    it('should work as a controlled component', async () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false)
        return (
          <Checkbox
            aria-label="controlled checkbox"
            checked={checked}
            onCheckedChange={setChecked}
          />
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />)
      const checkbox = screen.getByRole('checkbox')

      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
      
      await user.click(checkbox)
      expect(checkbox).toHaveAttribute('data-state', 'checked')
      
      await user.click(checkbox)
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    })
  })

  describe('Edge Cases', () => {
    it('should handle defaultChecked prop', () => {
      render(<Checkbox aria-label="test checkbox" defaultChecked />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('should work with form submission', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Checkbox name="newsletter" value="subscribed" aria-label="Subscribe" />
          <button type="submit">Submit</button>
        </form>
      )
      
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
