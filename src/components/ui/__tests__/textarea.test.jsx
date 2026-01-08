/**
 * Textarea Component Tests
 * 
 * Tests for the Textarea UI component.
 * Validates rendering, interaction, and accessibility.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-utils'
import { Textarea } from '../textarea'

describe('Textarea Component', () => {
  describe('Rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea aria-label="test textarea" />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render with placeholder', () => {
      render(<Textarea placeholder="Enter description..." />)
      expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Textarea aria-label="test textarea" data-testid="textarea" />)
      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveClass('flex', 'min-h-[60px]', 'w-full', 'rounded-md', 'border')
    })
  })

  describe('Interaction', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup()
      
      render(<Textarea aria-label="test textarea" />)
      const textarea = screen.getByRole('textbox')
      
      await user.type(textarea, 'Hello World')
      expect(textarea).toHaveValue('Hello World')
    })

    it('should call onChange handler', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea aria-label="test textarea" onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')
      
      await user.type(textarea, 'Test')
      expect(handleChange).toHaveBeenCalled()
    })

    it('should call onFocus handler', async () => {
      const handleFocus = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea aria-label="test textarea" onFocus={handleFocus} />)
      const textarea = screen.getByRole('textbox')
      
      await user.click(textarea)
      expect(handleFocus).toHaveBeenCalledOnce()
    })

    it('should call onBlur handler', async () => {
      const handleBlur = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea aria-label="test textarea" onBlur={handleBlur} />)
      const textarea = screen.getByRole('textbox')
      
      await user.click(textarea)
      await user.tab()
      expect(handleBlur).toHaveBeenCalledOnce()
    })

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup()
      
      render(<Textarea aria-label="test textarea" disabled />)
      const textarea = screen.getByRole('textbox')
      
      await user.type(textarea, 'Test')
      expect(textarea).toHaveValue('')
    })

    it('should support multiline text', async () => {
      const user = userEvent.setup()
      
      render(<Textarea aria-label="test textarea" />)
      const textarea = screen.getByRole('textbox')
      
      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3')
      expect(textarea.value).toContain('\n')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<Textarea aria-label="test textarea" />)
      const textarea = screen.getByRole('textbox')
      
      textarea.focus()
      expect(textarea).toHaveFocus()
    })

    it('should have disabled state', () => {
      render(<Textarea aria-label="test textarea" disabled data-testid="textarea" />)
      const textarea = screen.getByTestId('textarea')
      expect(textarea).toBeDisabled()
      expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should support aria-label', () => {
      render(<Textarea aria-label="Description input" />)
      expect(screen.getByLabelText('Description input')).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Textarea aria-label="test textarea" aria-describedby="helper-text" />
          <span id="helper-text">Helper text</span>
        </>
      )
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-describedby', 'helper-text')
    })

    it('should support required attribute', () => {
      render(<Textarea aria-label="test textarea" required />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeRequired()
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Textarea aria-label="test textarea" className="custom-class" data-testid="textarea" />)
      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Textarea ref={ref} aria-label="test textarea" />)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept value prop', () => {
      render(<Textarea aria-label="test textarea" value="Initial value" onChange={() => {}} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Initial value')
    })

    it('should accept defaultValue prop', () => {
      render(<Textarea aria-label="test textarea" defaultValue="Default value" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Default value')
    })

    it('should accept rows attribute', () => {
      render(<Textarea aria-label="test textarea" rows={5} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('should accept maxLength attribute', () => {
      render(<Textarea aria-label="test textarea" maxLength={100} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxLength', '100')
    })

    it('should accept name attribute', () => {
      render(<Textarea aria-label="test textarea" name="description" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('name', 'description')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Textarea aria-label="test textarea" value="" onChange={() => {}} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })

    it('should handle controlled textarea', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return (
          <Textarea
            aria-label="test textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Controlled text')
      expect(textarea).toHaveValue('Controlled text')
    })

    it('should handle readonly attribute', () => {
      render(<Textarea aria-label="test textarea" readOnly value="Readonly text" />)
      const textarea = screen.getByRole('textbox')
      // Check for the React prop 'readOnly'
      expect(textarea).toHaveAttribute('readonly')
    })
  })
})
