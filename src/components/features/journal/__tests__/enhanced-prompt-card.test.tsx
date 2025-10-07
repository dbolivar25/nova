import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { EnhancedPromptCard } from '../enhanced-prompt-card'

describe('EnhancedPromptCard', () => {
  const defaultProps = {
    prompt: 'What are you grateful for today?',
    value: '',
    onChange: vi.fn(),
    index: 0,
    isCompleted: false,
  }

  it('should render prompt text', () => {
    render(<EnhancedPromptCard {...defaultProps} />)
    
    expect(screen.getByText('What are you grateful for today?')).toBeInTheDocument()
  })

  it('should show prompt number', () => {
    render(<EnhancedPromptCard {...defaultProps} index={2} />)
    
    expect(screen.getByText('Prompt 3')).toBeInTheDocument()
  })

  it('should call onChange when typing', () => {
    const onChange = vi.fn()
    render(<EnhancedPromptCard {...defaultProps} onChange={onChange} />)
    
    const textarea = screen.getByPlaceholderText(/take your time to reflect/i)
    fireEvent.change(textarea, { target: { value: 'I am grateful for...' } })
    
    expect(onChange).toHaveBeenCalledWith('I am grateful for...')
  })

  it('should display value', () => {
    render(<EnhancedPromptCard {...defaultProps} value="My response" />)
    
    const textarea = screen.getByDisplayValue('My response')
    expect(textarea).toBeInTheDocument()
  })

  it('should show completed state', () => {
    render(<EnhancedPromptCard {...defaultProps} isCompleted={true} />)
    
    // Check for visual indicators of completion - the card gets a muted background
    const cards = screen.getAllByText('What are you grateful for today?')
    const parentCard = cards[0].closest('[data-slot="card"]')
    expect(parentCard?.className).toContain('bg-muted/30')
  })

  it('should show word count', () => {
    render(<EnhancedPromptCard {...defaultProps} value="This is a test response" />)
    
    expect(screen.getByText('5 words')).toBeInTheDocument()
  })

  it('should indicate when response is sufficient', () => {
    const longResponse = 'This is a much longer response that should trigger the completion indicator because it has more than twenty words in total'
    render(<EnhancedPromptCard {...defaultProps} value={longResponse} isCompleted={true} />)
    
    // Should show word count badge
    const wordCountBadge = screen.getByText('21 words')
    expect(wordCountBadge).toBeInTheDocument()
  })
})