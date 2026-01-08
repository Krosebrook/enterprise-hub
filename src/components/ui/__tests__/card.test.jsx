/**
 * Card Component Tests
 * 
 * Tests for the Card UI component and its sub-components.
 * Validates rendering, composition, and styling.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../card'

describe('Card Component', () => {
  describe('Card', () => {
    it('should render card element', () => {
      render(<Card data-testid="card">Card content</Card>)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should apply default styling', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'shadow')
    })

    it('should accept custom className', () => {
      render(<Card data-testid="card" className="custom-class">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Card ref={ref}>Content</Card>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('CardHeader', () => {
    it('should render header section', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header content</CardHeader>
        </Card>
      )
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('should apply correct styling', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })
  })

  describe('CardTitle', () => {
    it('should render title text', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('should apply title styling', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight')
    })
  })

  describe('CardDescription', () => {
    it('should render description text', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Test description</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('should apply description styling', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>)
      const desc = screen.getByTestId('desc')
      expect(desc).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    it('should render content section', () => {
      render(
        <Card>
          <CardContent>Main content here</CardContent>
        </Card>
      )
      expect(screen.getByText('Main content here')).toBeInTheDocument()
    })

    it('should apply content styling', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })
  })

  describe('CardFooter', () => {
    it('should render footer section', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should apply footer styling', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })
  })

  describe('Composition', () => {
    it('should render complete card with all sections', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main card content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description goes here')).toBeInTheDocument()
      expect(screen.getByText('Main card content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('should work with only title and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>Content only</CardContent>
        </Card>
      )

      expect(screen.getByText('Simple Card')).toBeInTheDocument()
      expect(screen.getByText('Content only')).toBeInTheDocument()
    })

    it('should work with only content', () => {
      render(
        <Card>
          <CardContent>Minimal content</CardContent>
        </Card>
      )

      expect(screen.getByText('Minimal content')).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('should accept onClick handler on card', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(
        <Card data-testid="card" onClick={handleClick}>
          Clickable card
        </Card>
      )
      
      const card = screen.getByTestId('card')
      await user.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should accept data attributes', () => {
      render(
        <Card data-testid="card" data-custom="value">
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-custom', 'value')
    })
  })
})
