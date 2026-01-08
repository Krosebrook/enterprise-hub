/**
 * Label Component Tests
 * 
 * Tests for the Label UI component.
 * Validates rendering, association with inputs, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-utils'
import { Label } from '../label'
import { Input } from '../input'

describe('Label Component', () => {
  describe('Rendering', () => {
    it('should render label element', () => {
      render(<Label>Test Label</Label>)
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Label data-testid="label">Label Text</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
    })

    it('should render as label element', () => {
      render(<Label htmlFor="test-input">Label</Label>)
      const label = screen.getByText('Label')
      expect(label.tagName).toBe('LABEL')
    })
  })

  describe('Association with Input', () => {
    it('should associate with input using htmlFor', () => {
      render(
        <>
          <Label htmlFor="username">Username</Label>
          <Input id="username" />
        </>
      )
      const label = screen.getByText('Username')
      const input = screen.getByLabelText('Username')
      expect(input).toBeInTheDocument()
    })

    it('should work with nested input', () => {
      render(
        <Label>
          Email
          <Input type="email" />
        </Label>
      )
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should support peer-disabled styling', () => {
      render(<Label data-testid="label">Disabled Label</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70')
    })

    it('should be clickable to focus associated input', async () => {
      const user = userEvent.setup()
      
      render(
        <>
          <Label htmlFor="clickable-input">Click me</Label>
          <Input id="clickable-input" />
        </>
      )
      
      const label = screen.getByText('Click me')
      const input = screen.getByLabelText('Click me')
      
      await user.click(label)
      expect(input).toHaveFocus()
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Label data-testid="label" className="custom-class">Custom Label</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Label ref={ref}>Label with ref</Label>)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept data attributes', () => {
      render(<Label data-testid="label" data-custom="value">Label</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Label data-testid="label"></Label>)
      expect(screen.getByTestId('label')).toBeInTheDocument()
    })

    it('should render with multiple children', () => {
      render(
        <Label>
          <span>Icon</span>
          <span>Text</span>
        </Label>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    it('should work with required indicator', () => {
      render(
        <Label>
          Username <span className="text-destructive">*</span>
        </Label>
      )
      expect(screen.getByText('Username')).toBeInTheDocument()
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })
})
