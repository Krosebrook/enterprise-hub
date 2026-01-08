/**
 * Input Component Tests
 * 
 * Tests for the Input UI component.
 * Validates rendering, types, interaction, and accessibility.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-utils'
import { Input } from '../input'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input aria-label="test input" />)
      expect(screen.getByLabelText('test input')).toBeInTheDocument()
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text..." />)
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
    })

    it('should render without explicit type attribute when not specified', () => {
      render(<Input aria-label="test input" />)
      const input = screen.getByLabelText('test input')
      // HTML5 inputs without type default to text, but attribute may not be present
      expect(input.type).toBe('text')
    })

    it('should apply default styling', () => {
      render(<Input aria-label="test input" />)
      const input = screen.getByLabelText('test input')
      expect(input).toHaveClass('flex', 'h-9', 'w-full', 'rounded-md', 'border')
    })
  })

  describe('Types', () => {
    it('should render with text type', () => {
      render(<Input type="text" aria-label="text input" />)
      const input = screen.getByLabelText('text input')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should render with email type', () => {
      render(<Input type="email" aria-label="email input" />)
      const input = screen.getByLabelText('email input')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should render with password type', () => {
      render(<Input type="password" aria-label="password input" />)
      const input = screen.getByLabelText('password input')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should render with number type', () => {
      render(<Input type="number" aria-label="number input" />)
      const input = screen.getByLabelText('number input')
      expect(input).toHaveAttribute('type', 'number')
    })
  })

  describe('Interaction', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup()
      
      render(<Input aria-label="test input" />)
      const input = screen.getByLabelText('test input')
      
      await user.type(input, 'Hello World')
      expect(input).toHaveValue('Hello World')
    })

    it('should call onChange handler', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Input aria-label="test input" onChange={handleChange} />)
      const input = screen.getByLabelText('test input')
      
      await user.type(input, 'Test')
      expect(handleChange).toHaveBeenCalled()
    })

    it('should call onFocus handler', async () => {
      const handleFocus = vi.fn()
      const user = userEvent.setup()
      
      render(<Input aria-label="test input" onFocus={handleFocus} />)
      const input = screen.getByLabelText('test input')
      
      await user.click(input)
      expect(handleFocus).toHaveBeenCalledOnce()
    })

    it('should call onBlur handler', async () => {
      const handleBlur = vi.fn()
      const user = userEvent.setup()
      
      render(<Input aria-label="test input" onBlur={handleBlur} />)
      const input = screen.getByLabelText('test input')
      
      await user.click(input)
      await user.tab()
      expect(handleBlur).toHaveBeenCalledOnce()
    })

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup()
      
      render(<Input aria-label="test input" disabled />)
      const input = screen.getByLabelText('test input')
      
      await user.type(input, 'Test')
      expect(input).toHaveValue('')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<Input aria-label="test input" />)
      const input = screen.getByLabelText('test input')
      
      input.focus()
      expect(input).toHaveFocus()
    })

    it('should have disabled state', () => {
      render(<Input aria-label="test input" disabled />)
      const input = screen.getByLabelText('test input')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('should support aria-label', () => {
      render(<Input aria-label="Custom input label" />)
      expect(screen.getByLabelText('Custom input label')).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-label="test input" aria-describedby="helper-text" />
          <span id="helper-text">Helper text</span>
        </>
      )
      const input = screen.getByLabelText('test input')
      expect(input).toHaveAttribute('aria-describedby', 'helper-text')
    })

    it('should support required attribute', () => {
      render(<Input aria-label="test input" required />)
      const input = screen.getByLabelText('test input')
      expect(input).toBeRequired()
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Input aria-label="test input" className="custom-class" />)
      const input = screen.getByLabelText('test input')
      expect(input).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Input ref={ref} aria-label="test input" />)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept value prop', () => {
      render(<Input aria-label="test input" value="Initial value" onChange={() => {}} />)
      const input = screen.getByLabelText('test input')
      expect(input).toHaveValue('Initial value')
    })

    it('should accept defaultValue prop', () => {
      render(<Input aria-label="test input" defaultValue="Default value" />)
      const input = screen.getByLabelText('test input')
      expect(input).toHaveValue('Default value')
    })

    it('should accept maxLength attribute', () => {
      render(<Input aria-label="test input" maxLength={10} />)
      const input = screen.getByLabelText('test input')
      expect(input).toHaveAttribute('maxLength', '10')
    })

    it('should accept name attribute', () => {
      render(<Input aria-label="test input" name="username" />)
      const input = screen.getByLabelText('test input')
      expect(input).toHaveAttribute('name', 'username')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Input aria-label="test input" value="" onChange={() => {}} />)
      const input = screen.getByLabelText('test input')
      expect(input).toHaveValue('')
    })

    it('should handle controlled input', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return (
          <Input
            aria-label="test input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />)
      const input = screen.getByLabelText('test input')

      await user.type(input, 'Controlled')
      expect(input).toHaveValue('Controlled')
    })

    it('should handle file input type', () => {
      render(<Input type="file" aria-label="file input" />)
      const input = screen.getByLabelText('file input')
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveClass('file:border-0', 'file:bg-transparent')
    })
  })
})
