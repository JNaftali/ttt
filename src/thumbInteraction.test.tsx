import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { BalanceSlider } from './BalanceSlider'

const mockEvents = [
  {
    name: 'cast windlance',
    req: ['eq', 'bal'],
    consumes: ['eq'],
    duration: 1.5
  },
  {
    name: 'drink health', 
    req: ['pill'],
    consumes: ['pill'],
    duration: 0.5
  },
  {
    name: 'smoke pipe',
    req: [],
    consumes: ['pipe'],
    duration: 2.0
  }
]

describe('BalanceSlider - Thumb Interaction', () => {
  const mockSetEventValues = vi.fn()
  const mockRemoveBalance = vi.fn()
  const defaultProps = {
    balances: ['eq', 'bal', 'pill', 'pipe'],
    events: mockEvents,
    eventValues: {
      'cast windlance': 1.0,
      'drink health': 2.5,
      'smoke pipe': 0.5
    },
    setEventValues: mockSetEventValues,
    removeBalance: mockRemoveBalance,
    timePeriod: 5
  }

  beforeEach(() => {
    mockSetEventValues.mockClear()
  })

  it('should render only requirement thumbs as interactive sliders', () => {
    const { container } = render(<BalanceSlider {...defaultProps} />)
    
    // Find all slider input elements (the actual interactive elements)
    const sliderInputs = container.querySelectorAll('input[type="range"]')
    
    // Should have inputs for events that require balances:
    // - cast windlance requires eq, bal (2 inputs)
    // - drink health requires pill (1 input)
    // - smoke pipe requires nothing (0 inputs)
    // Total: 3 interactive inputs
    expect(sliderInputs.length).toBe(3)
    
    // Verify the inputs are for the correct events
    const inputLabels = Array.from(sliderInputs).map(input => 
      input.getAttribute('aria-labelledby')
    )
    
    expect(inputLabels.some(label => label?.includes('cast windlance'))).toBe(true)
    expect(inputLabels.some(label => label?.includes('drink health'))).toBe(true)
    expect(inputLabels.every(label => !label?.includes('smoke pipe'))).toBe(true)
  })

  it('should render consumption indicators as non-interactive elements', () => {
    const { container } = render(<BalanceSlider {...defaultProps} />)
    
    // Find consumption indicators (visual only)
    const consumptionIndicators = container.querySelectorAll('.consumption-thumb')
    
    // Should have indicators for events that consume balances:
    // - cast windlance consumes eq (1 indicator)
    // - drink health consumes pill (1 indicator) 
    // - smoke pipe consumes pipe (1 indicator)
    // Total: 3 consumption indicators
    expect(consumptionIndicators.length).toBe(3)
    
    // Consumption indicators should not be interactive
    consumptionIndicators.forEach(indicator => {
      expect(indicator).toHaveStyle('pointer-events: none')
    })
  })

  it('should render consumption periods as background indicators', () => {
    const { container } = render(<BalanceSlider {...defaultProps} />)
    
    // Find consumption period overlays
    const consumptionPeriods = container.querySelectorAll('.consumption-period')
    
    // Should have periods for balances that are consumed:
    // - eq consumed by cast windlance
    // - pill consumed by drink health
    // - pipe consumed by smoke pipe
    // Total: 3 consumption periods
    expect(consumptionPeriods.length).toBe(3)
  })

  it('should correctly position consumption indicators at end times', () => {
    const { container } = render(<BalanceSlider {...defaultProps} />)
    
    const consumptionIndicators = container.querySelectorAll('.consumption-thumb')
    
    // Find the indicator for 'cast windlance' consuming 'eq'
    // Should be positioned at 1.0 + 1.5 = 2.5, which is (2.5/5)*100 = 50%
    const windlanceIndicator = Array.from(consumptionIndicators).find(el => 
      el.getAttribute('title')?.includes('cast windlance')
    )
    expect(windlanceIndicator).toHaveStyle('left: 50%')
    
    // Find the indicator for 'drink health' consuming 'pill'
    // Should be positioned at 2.5 + 0.5 = 3.0, which is (3.0/5)*100 = 60%
    const healthIndicator = Array.from(consumptionIndicators).find(el =>
      el.getAttribute('title')?.includes('drink health')
    )
    expect(healthIndicator).toHaveStyle('left: 60%')
  })

  it('should handle events that both require and consume the same balance', () => {
    const eventsBothRequireAndConsume = [
      {
        name: 'complex action',
        req: ['eq'],
        consumes: ['eq'],
        duration: 1.0
      }
    ]
    
    const props = {
      ...defaultProps,
      events: eventsBothRequireAndConsume,
      eventValues: { 'complex action': 1.5 }
    }
    
    const { container } = render(<BalanceSlider {...props} />)
    
    // Should have 1 interactive input (for requirement)
    const sliderInputs = container.querySelectorAll('input[type="range"]')
    expect(sliderInputs.length).toBe(1)
    
    // Should have 1 consumption indicator (for consumption end)
    const consumptionIndicators = container.querySelectorAll('.consumption-thumb')
    expect(consumptionIndicators.length).toBe(1)
    
    // Consumption indicator should be at 1.5 + 1.0 = 2.5 = 50%
    expect(consumptionIndicators[0]).toHaveStyle('left: 50%')
  })
})