import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Label,
  Input,
  Form,
  NumberField,
  CheckboxGroup,
  Checkbox,
} from "react-aria-components";
import { BalanceSlider } from "./BalanceSlider";
import {
  deserializeState,
  updateURL,
  getDefaultState,
  resetState,
} from "./urlState";
import { findValidPlacement } from "./collisionDetection";
import "./App.css";

interface Event {
  name: string;
  req: string[];
  consumes: string[];
  duration: number;
}

function App() {
  const [balances, setBalances] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventValues, setEventValues] = useState<Record<string, number>>({});
  const [timePeriod, setTimePeriod] = useState<number>(5);

  useEffect(() => {
    const urlState = deserializeState();
    if (urlState) {
      setBalances(urlState.balances);
      setEvents(urlState.events);
      setEventValues(urlState.eventValues);
      if (urlState.timePeriod) {
        setTimePeriod(urlState.timePeriod);
      }
    } else {
      const defaultState = getDefaultState();
      setBalances(defaultState.balances);
      setEvents(defaultState.events);
      setEventValues(defaultState.eventValues);
    }
  }, []);

  // Use debounced URL updates for eventValues changes, immediate for structural changes
  useEffect(() => {
    if (balances.length > 0 || events.length > 0) {
      updateURL({ balances, events, eventValues, timePeriod });
    }
  }, [balances, events, eventValues, timePeriod]);

  const [newBalance, setNewBalance] = useState("");
  const [newEvent, setNewEvent] = useState({
    name: "",
    req: [] as string[],
    consumes: [] as string[],
    duration: 0,
  });

  const addBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBalance.trim() && !balances.includes(newBalance.trim())) {
      setBalances([...balances, newBalance.trim()]);
      setNewBalance("");
    }
  };

  const removeBalance = (balanceToRemove: string) => {
    // Remove the balance
    setBalances(balances.filter(balance => balance !== balanceToRemove));
    
    // Remove or clean up events that depend on this balance
    const updatedEvents = events.filter(event => {
      // Remove events that require or consume this balance
      return !event.req.includes(balanceToRemove) && !event.consumes.includes(balanceToRemove);
    });
    
    // Clean up event values for removed events
    const updatedEventValues = { ...eventValues };
    events.forEach(event => {
      if (event.req.includes(balanceToRemove) || event.consumes.includes(balanceToRemove)) {
        delete updatedEventValues[event.name];
      }
    });
    
    setEvents(updatedEvents);
    setEventValues(updatedEventValues);
  };

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEvent.name.trim()) {
      const newEventObj = {
        ...newEvent,
        name: newEvent.name.trim(),
      };
      
      // Find valid starting positions for this event on all relevant balances
      const newEventValues = { ...eventValues };
      
      // Get all balances this event interacts with (requires or consumes)
      const relevantBalances = [...new Set([...newEvent.req, ...newEvent.consumes])];
      
      // Find the earliest valid position that works for all relevant balances
      let validStartTime = 0;
      for (const balance of relevantBalances) {
        const validPosition = findValidPlacement(
          newEventObj.name,
          newEventObj,
          balance,
          events,
          eventValues,
          validStartTime,
          timePeriod
        );
        
        if (validPosition !== null) {
          validStartTime = Math.max(validStartTime, validPosition);
        } else {
          // If no valid position found, try to place at the end
          validStartTime = timePeriod - (newEvent.consumes.includes(balance) ? newEvent.duration : 0);
        }
      }
      
      // Set the initial event value to the valid start time
      newEventValues[newEventObj.name] = Math.max(0, Math.min(validStartTime, timePeriod));
      
      // Update state in batch to reduce URL updates
      setEvents([...events, newEventObj]);
      setEventValues(newEventValues);
      setNewEvent({
        name: "",
        req: [],
        consumes: [],
        duration: 0,
      });
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "2rem",
          marginBottom: "2rem",
          alignItems: "flex-start",
        }}
      >
        <Form onSubmit={addBalance}>
          <TextField>
            <Label>Add Balance</Label>
            <Input
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="Enter balance name"
            />
          </TextField>
          <Button type="submit">Add Balance</Button>
        </Form>

        <Form onSubmit={addEvent}>
          <TextField>
            <Label>Event Name</Label>
            <Input
              value={newEvent.name}
              onChange={(e) =>
                setNewEvent({ ...newEvent, name: e.target.value })
              }
              placeholder="Enter event name"
            />
          </TextField>

          <NumberField
            value={newEvent.duration}
            onChange={(value) =>
              setNewEvent({ ...newEvent, duration: value || 0 })
            }
          >
            <Label>Duration</Label>
            <Input />
          </NumberField>

          <CheckboxGroup
            value={newEvent.req}
            onChange={(selected) =>
              setNewEvent({ ...newEvent, req: selected as string[] })
            }
          >
            <Label>Requirements</Label>
            {balances.map((balance) => (
              <Checkbox key={balance} value={balance}>
                {balance}
              </Checkbox>
            ))}
          </CheckboxGroup>

          <CheckboxGroup
            value={newEvent.consumes}
            onChange={(selected) =>
              setNewEvent({ ...newEvent, consumes: selected as string[] })
            }
          >
            <Label>Consumes</Label>
            {balances.map((balance) => (
              <Checkbox key={balance} value={balance}>
                {balance}
              </Checkbox>
            ))}
          </CheckboxGroup>

          <Button type="submit">Add Event</Button>
        </Form>

        <div>
          <NumberField
            value={timePeriod}
            onChange={(value) => setTimePeriod(value || 5)}
            minValue={1}
            maxValue={60}
            step={1}
          >
            <Label>Time Period (seconds)</Label>
            <Input />
          </NumberField>
          <Button onPress={resetState}>Reset</Button>
        </div>
      </div>

      <BalanceSlider
        balances={balances}
        events={events}
        eventValues={eventValues}
        setEventValues={setEventValues}
        removeBalance={removeBalance}
        timePeriod={timePeriod}
      />
    </>
  );
}

export default App;
