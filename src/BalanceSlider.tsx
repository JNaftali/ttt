import { useState } from "react";
import {
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";

interface Event {
  name: string;
  req: string[];
  consumes: string[];
  duration: number;
}

interface BalanceSliderProps {
  balances: string[];
  events: Event[];
}

export function BalanceSlider({ balances, events }: BalanceSliderProps) {
  const [eventValues, setEventValues] = useState<Record<string, number>>({});

  const handleSliderChange = (balance: string, newValues: number[]) => {
    const relevantEvents = events.filter(event => event.req.includes(balance));
    
    setEventValues(prev => {
      const updated = { ...prev };
      relevantEvents.forEach((event, index) => {
        updated[event.name] = newValues[index];
      });
      return updated;
    });
  };

  return (
    <div>
      {/* Single label per event */}
      {events.map((event) => (
        <label key={`event-label-${event.name}`} id={`event-label-${event.name}`}>
          {event.name}
        </label>
      ))}
      
      {/* Description elements for thumbs */}
      {balances.map((balance) => {
        const relevantEvents = events.filter(event => event.req.includes(balance));
        const consumingEvents = events.filter(event => event.consumes.includes(balance));
        
        return (
          <div key={`descriptions-${balance}`} style={{ display: 'none' }}>
            {relevantEvents.map((event) => (
              <div key={`req-desc-${event.name}-${balance}`} id={`req-desc-${event.name}-${balance}`}>
                Balance requirement for {balance}
              </div>
            ))}
            {consumingEvents.map((event) => (
              <div key={`consume-desc-${event.name}-${balance}`} id={`consume-desc-${event.name}-${balance}`}>
                Balance consumption for {balance}
              </div>
            ))}
          </div>
        );
      })}
      
      {balances.map((balance) => {
        const relevantEvents = events.filter(event => event.req.includes(balance));
        const consumingEvents = events.filter(event => event.consumes.includes(balance));
        
        const currentValues = relevantEvents.map(event => eventValues[event.name] || 0);
        const consumptionValues = consumingEvents.map(event => (eventValues[event.name] || 0) + event.duration);
        
        // Combine both requirement and consumption values for the slider
        const allValues = [...currentValues, ...consumptionValues];
        
        return (
          <div key={balance}>
            <Slider 
              minValue={0} 
              maxValue={5} 
              step={0.01} 
              value={allValues}
              onChange={(newValues) => handleSliderChange(balance, newValues.slice(0, currentValues.length))}
            >
              <Label>{balance}</Label>
              <SliderOutput />
              <SliderTrack>
                {relevantEvents.map((event, index) => (
                  <div key={`req-container-${event.name}`} className="thumb-container">
                    <div 
                      className="thumb-label" 
                      style={{
                        left: `${(currentValues[index] / 5) * 100}%`,
                      }}
                    >
                      {event.name}
                    </div>
                    <SliderThumb 
                      key={`req-${event.name}`}
                      index={index}
                      aria-labelledby={`event-label-${event.name}`}
                      aria-describedby={`req-desc-${event.name}-${balance}`}
                    />
                  </div>
                ))}
                {consumingEvents.map((event, index) => (
                  <SliderThumb 
                    key={`consume-${event.name}`}
                    index={currentValues.length + index}
                    style={{ opacity: 0.6, backgroundColor: 'red' }}
                    aria-labelledby={`event-label-${event.name}`}
                    aria-describedby={`consume-desc-${event.name}-${balance}`}
                  />
                ))}
              </SliderTrack>
            </Slider>
          </div>
        );
      })}
    </div>
  );
}