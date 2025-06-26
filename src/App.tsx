import { useState } from "react";
import {
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import "./App.css";

function App() {
  const [eventValues, setEventValues] = useState<Record<string, number>>({});
  
  const balances = ["eq", "bal", "pill", "salve", "pipe"];
  const events = [
    {
      name: "cast windlance",
      req: ["eq", "bal"],
      consumes: ["eq"],
      duration: 1.5,
    },
  ];

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
    <>
      <div>
        {balances.map((balance) => {
          const relevantEvents = events.filter(event => event.req.includes(balance));
          const consumingEvents = events.filter(event => event.consumes.includes(balance));
          
          const currentValues = relevantEvents.map(event => eventValues[event.name] || 0);
          const consumptionValues = consumingEvents.map(event => (eventValues[event.name] || 0) + event.duration);
          
          // Combine both requirement and consumption values for the slider
          const allValues = [...currentValues, ...consumptionValues];
          
          return (
            <Slider 
              key={balance} 
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
                  <SliderThumb 
                    key={`req-${event.name}`}
                    index={index}
                  />
                ))}
                {consumingEvents.map((event, index) => (
                  <SliderThumb 
                    key={`consume-${event.name}`}
                    index={currentValues.length + index}
                    style={{ opacity: 0.6, backgroundColor: 'red' }}
                  />
                ))}
              </SliderTrack>
            </Slider>
          );
        })}
      </div>
    </>
  );
}

export default App;
