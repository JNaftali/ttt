import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App - Slider Thumb Linking', () => {
  it('should link thumbs across sliders for the same event', async () => {
    render(<App />)
    
    // Find all labels for eq and bal (there might be multiple due to React Aria)
    const eqLabels = screen.getAllByText('eq')
    const balLabels = screen.getAllByText('bal')
    
    // Both balance types should have labels
    expect(eqLabels.length).toBeGreaterThan(0)
    expect(balLabels.length).toBeGreaterThan(0)
    
    // Find the sliders by their container elements (role="group")
    const eqSlider = eqLabels[0].closest('[role="group"]')
    const balSlider = balLabels[0].closest('[role="group"]')
    
    expect(eqSlider).toBeInTheDocument()
    expect(balSlider).toBeInTheDocument()
    
    // Both sliders should have input elements for the "cast windlance" event
    const eqInput = eqSlider?.querySelector('input[type="range"]')
    const balInput = balSlider?.querySelector('input[type="range"]')
    
    expect(eqInput).toBeInTheDocument()
    expect(balInput).toBeInTheDocument()
  })

  it('should render sliders for all balance types', () => {
    render(<App />)
    
    // Check that all balance types have sliders
    const balanceTypes = ['eq', 'bal', 'pill', 'salve', 'pipe']
    
    balanceTypes.forEach(balance => {
      const labels = screen.getAllByText(balance)
      expect(labels.length).toBeGreaterThan(0)
    })
  })

  it('should only show thumbs for relevant events', () => {
    render(<App />)
    
    // eq and bal should have thumbs (required by "cast windlance")
    const eqLabels = screen.getAllByText('eq')
    const balLabels = screen.getAllByText('bal')
    const pillLabels = screen.getAllByText('pill')
    
    const eqSlider = eqLabels[0].closest('[role="group"]')
    const balSlider = balLabels[0].closest('[role="group"]')  
    const pillSlider = pillLabels[0].closest('[role="group"]')
    
    // eq and bal should have slider inputs (they're required by the event)
    expect(eqSlider?.querySelector('input[type="range"]')).toBeInTheDocument()
    expect(balSlider?.querySelector('input[type="range"]')).toBeInTheDocument()
    
    // pill should not have input elements (not required by any event)
    expect(pillSlider?.querySelector('input[type="range"]')).toBe(null)
  })

  it('should maintain consistent state structure', () => {
    // This test ensures the component renders without errors
    // and maintains the expected structure
    const { container } = render(<App />)
    
    // Should have sliders for all balance types
    const sliders = container.querySelectorAll('[role="group"]')
    expect(sliders).toHaveLength(5) // eq, bal, pill, salve, pipe
    
    // Should have labels for all balance types
    const labels = ['eq', 'bal', 'pill', 'salve', 'pipe']
    labels.forEach(label => {
      const labelElements = screen.getAllByText(label)
      expect(labelElements.length).toBeGreaterThan(0)
    })
  })

  it('should keep thumbs linked when one is moved', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Get the eq and bal sliders (both have "cast windlance" event)
    const eqLabels = screen.getAllByText('eq')
    const balLabels = screen.getAllByText('bal')
    
    const eqSlider = eqLabels[0].closest('[role="group"]')
    const balSlider = balLabels[0].closest('[role="group"]')
    
    const eqInput = eqSlider?.querySelector('input[type="range"]')
    const balInput = balSlider?.querySelector('input[type="range"]')
    
    expect(eqInput).toBeInTheDocument()
    expect(balInput).toBeInTheDocument()
    
    // Both inputs should start at the same position (0)
    expect(eqInput).toHaveValue('0')
    expect(balInput).toHaveValue('0')
    
    // Focus and move the eq slider input
    if (eqInput) {
      (eqInput as HTMLInputElement).focus()
      await user.keyboard('{ArrowRight}')
      
      // After moving eq input, both inputs should have the same value
      // since they represent the same event ("cast windlance")
      const eqValue = (eqInput as HTMLInputElement).value
      const balValue = (balInput as HTMLInputElement).value
      
      expect(eqValue).toBe(balValue)
      expect(parseFloat(eqValue)).toBeGreaterThan(0)
    }
  })

  it('should show consumption thumbs offset by event duration', () => {
    render(<App />)
    
    // eq should have both requirement and consumption thumbs
    const eqLabels = screen.getAllByText('eq')
    const eqSlider = eqLabels[0].closest('[role="group"]')
    
    // eq should have 2 input elements: one for requirement, one for consumption
    const eqInputs = eqSlider?.querySelectorAll('input[type="range"]')
    expect(eqInputs).toHaveLength(2)
    
    // bal should only have requirement thumb (not consumed by the event)
    const balLabels = screen.getAllByText('bal')
    const balSlider = balLabels[0].closest('[role="group"]')
    
    const balInputs = balSlider?.querySelectorAll('input[type="range"]')
    expect(balInputs).toHaveLength(1)
  })

  it('should display event labels and link them to thumbs with proper descriptions', () => {
    render(<App />)
    
    // Should show single event label (but there might be multiple in test environment)
    const eventLabels = screen.getAllByText('cast windlance')
    expect(eventLabels.length).toBeGreaterThan(0)
    
    // Check that thumbs have aria-labelledby pointing to the single event label
    // and aria-describedby pointing to description elements
    const eqLabels = screen.getAllByText('eq')
    const eqSlider = eqLabels[0].closest('[role="group"]')
    const eqInputs = eqSlider?.querySelectorAll('input[type="range"]')
    
    if (eqInputs) {
      // First input should be requirement thumb
      expect(eqInputs[0].getAttribute('aria-labelledby')).toContain('event-label-cast windlance')
      expect(eqInputs[0].getAttribute('aria-describedby')).toContain('req-desc-cast windlance-eq')
      
      // Second input should be consumption thumb  
      expect(eqInputs[1].getAttribute('aria-labelledby')).toContain('event-label-cast windlance')
      expect(eqInputs[1].getAttribute('aria-describedby')).toContain('consume-desc-cast windlance-eq')
    }
    
    // bal should only have requirement thumb with proper aria attributes
    const balLabels = screen.getAllByText('bal')
    const balSlider = balLabels[0].closest('[role="group"]')
    const balInputs = balSlider?.querySelectorAll('input[type="range"]')
    
    if (balInputs) {
      expect(balInputs[0].getAttribute('aria-labelledby')).toContain('event-label-cast windlance')
      expect(balInputs[0].getAttribute('aria-describedby')).toContain('req-desc-cast windlance-bal')
    }
  })
})