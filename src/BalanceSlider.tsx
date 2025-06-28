import React, { useCallback, useMemo } from "react";
import {
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import {
  getNextValidPosition,
  getConsumptionPeriods,
  isValidEventPlacement
} from "./collisionDetection";

interface Event {
  name: string;
  req: string[];
  consumes: string[];
  duration: number;
}

interface BalanceSliderProps {
  balances: string[];
  events: Event[];
  eventValues: Record<string, number>;
  setEventValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function BalanceSlider({ balances, events, eventValues, setEventValues }: BalanceSliderProps) {

  const handleSliderChange = useCallback((balance: string, newValues: number[]) => {
    const relevantEvents = events.filter(event => event.req.includes(balance));
    
    setEventValues(prev => {
      const updated = { ...prev };
      let hasChanges = false;
      
      relevantEvents.forEach((event, index) => {
        const requestedTime = newValues[index];
        const validTime = getNextValidPosition(
          event.name,
          requestedTime,
          event,
          balance,
          events,
          prev
        );
        
        // Only update if the value actually changed
        if (Math.abs((prev[event.name] || 0) - validTime) > 0.001) {
          updated[event.name] = validTime;
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });
  }, [events]);

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
        
        // Only use requirement values for the slider - consumption thumbs are visual indicators only
        const allValues = currentValues;
        
        return (
          <div key={balance}>
            <Slider 
              minValue={0} 
              maxValue={5} 
              step={0.01} 
              value={allValues}
              onChange={(newValues) => handleSliderChange(balance, newValues)}
            >
              <Label>{balance}</Label>
              <SliderOutput />
              <SliderTrack>
                {/* Consumption period indicators */}
                {getConsumptionPeriods(balance, events, eventValues).map((period, index) => (
                  <div
                    key={`consumption-${period.eventName}-${index}`}
                    className="consumption-period"
                    style={{
                      position: 'absolute',
                      left: `${(period.start / 5) * 100}%`,
                      width: `${((period.end - period.start) / 5) * 100}%`,
                      height: '100%',
                      backgroundColor: 'rgba(255, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 0, 0, 0.4)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                    title={`${period.eventName} consumes ${balance} from ${period.start} to ${period.end}`}
                  />
                ))}
                
                {relevantEvents.map((event, index) => {
                  const currentTime = currentValues[index];
                  const isValidPosition = isValidEventPlacement(
                    event.name,
                    currentTime,
                    event,
                    balance,
                    events,
                    eventValues
                  );
                  
                  return (
                    <div key={`req-container-${event.name}`} className="thumb-container">
                      <div 
                        className="thumb-label" 
                        style={{
                          left: `${(currentTime / 5) * 100}%`,
                          color: isValidPosition ? 'black' : 'red',
                          fontWeight: isValidPosition ? 'normal' : 'bold'
                        }}
                      >
                        {event.name}
                      </div>
                      <SliderThumb 
                        key={`req-${event.name}`}
                        index={index}
                        style={{
                          backgroundColor: isValidPosition ? undefined : '#ff6b6b',
                          border: isValidPosition ? undefined : '2px solid #ff0000'
                        }}
                        aria-labelledby={`event-label-${event.name}`}
                        aria-describedby={`req-desc-${event.name}-${balance}`}
                      />
                    </div>
                  );
                })}
                
                {/* Consumption thumbs as visual indicators only - not interactive */}
                {consumingEvents.map((event) => {
                  const consumptionEndTime = (eventValues[event.name] || 0) + event.duration;
                  
                  return (
                    <div
                      key={`consume-indicator-${event.name}`}
                      className="consumption-thumb"
                      style={{
                        position: 'absolute',
                        left: `${(consumptionEndTime / 5) * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'red',
                        opacity: 0.6,
                        pointerEvents: 'none',
                        border: '2px solid darkred',
                        zIndex: 2
                      }}
                      title={`${event.name} consumption ends at ${consumptionEndTime.toFixed(2)}`}
                    />
                  );
                })}
              </SliderTrack>
            </Slider>
          </div>
        );
      })}
    </div>
  );
}