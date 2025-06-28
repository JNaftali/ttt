interface Event {
  name: string;
  req: string[];
  consumes: string[];
  duration: number;
}

interface TimeSpan {
  start: number;
  end: number;
  eventName: string;
}

export function getConsumptionPeriods(
  balance: string,
  events: Event[],
  eventValues: Record<string, number>
): TimeSpan[] {
  return events
    .filter(event => event.consumes.includes(balance))
    .map(event => ({
      start: eventValues[event.name] || 0,
      end: (eventValues[event.name] || 0) + event.duration,
      eventName: event.name
    }))
    .sort((a, b) => a.start - b.start);
}

export function isValidEventPlacement(
  eventName: string,
  newStartTime: number,
  event: Event,
  balance: string,
  events: Event[],
  eventValues: Record<string, number>
): boolean {
  // Get all consumption periods for this balance, excluding the current event
  const otherEvents = events.filter(e => e.name !== eventName);
  const consumptionPeriods = getConsumptionPeriods(balance, otherEvents, eventValues);
  
  // Check if this event requires the balance
  if (event.req.includes(balance)) {
    // Event cannot start during any consumption period
    for (const period of consumptionPeriods) {
      if (newStartTime >= period.start && newStartTime < period.end) {
        return false;
      }
    }
  }
  
  // Check if this event consumes the balance
  if (event.consumes.includes(balance)) {
    const newConsumptionEnd = newStartTime + event.duration;
    
    // New consumption period cannot overlap with existing consumption periods
    for (const period of consumptionPeriods) {
      // Check for overlap: new period starts before existing ends AND new period ends after existing starts
      if (newStartTime < period.end && newConsumptionEnd > period.start) {
        return false;
      }
    }
    
    // Also check that no other events requiring this balance start during our consumption
    const requiringEvents = otherEvents.filter(e => e.req.includes(balance));
    for (const reqEvent of requiringEvents) {
      const reqEventStart = eventValues[reqEvent.name] || 0;
      if (reqEventStart >= newStartTime && reqEventStart < newConsumptionEnd) {
        return false;
      }
    }
  }
  
  return true;
}

export function findValidPlacement(
  eventName: string,
  event: Event,
  balance: string,
  events: Event[],
  eventValues: Record<string, number>,
  minTime: number = 0,
  maxTime: number = 5
): number | null {
  const step = 0.01;
  
  for (let time = minTime; time <= maxTime - (event.consumes.includes(balance) ? event.duration : 0); time += step) {
    if (isValidEventPlacement(eventName, time, event, balance, events, eventValues)) {
      return Math.round(time * 100) / 100; // Round to avoid floating point issues
    }
  }
  
  return null;
}

export function validateAllEventPlacements(
  events: Event[],
  eventValues: Record<string, number>,
  balances: string[]
): { valid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  
  for (const balance of balances) {
    for (const event of events) {
      const eventStart = eventValues[event.name] || 0;
      if (!isValidEventPlacement(event.name, eventStart, event, balance, events, eventValues)) {
        conflicts.push(`${event.name} conflicts on ${balance} at time ${eventStart}`);
      }
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
}

export function getNextValidPosition(
  eventName: string,
  currentTime: number,
  event: Event,
  balance: string,
  events: Event[],
  eventValues: Record<string, number>
): number {
  // If current position is valid, return it
  if (isValidEventPlacement(eventName, currentTime, event, balance, events, eventValues)) {
    return currentTime;
  }
  
  // Find the next valid position
  const validPosition = findValidPlacement(eventName, event, balance, events, eventValues, currentTime);
  
  if (validPosition !== null) {
    return validPosition;
  }
  
  // If no valid position found forward, try backward from current position
  const backwardPosition = findValidPlacement(eventName, event, balance, events, eventValues, 0, currentTime);
  
  return backwardPosition !== null ? backwardPosition : currentTime;
}