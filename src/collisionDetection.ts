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

export function isValidEventPlacementAllBalances(
  eventName: string,
  newStartTime: number,
  event: Event,
  events: Event[],
  eventValues: Record<string, number>
): boolean {
  // Get all balances this event affects
  const affectedBalances = [...new Set([...event.req, ...event.consumes])];
  
  // Check if the placement is valid for ALL affected balances
  for (const balance of affectedBalances) {
    if (!isValidEventPlacement(eventName, newStartTime, event, balance, events, eventValues)) {
      return false;
    }
  }
  
  return true;
}

export function findValidPlacementAllBalances(
  eventName: string,
  event: Event,
  events: Event[],
  eventValues: Record<string, number>,
  minTime: number = 0,
  maxTime: number = 5
): number | null {
  const step = 0.01;
  const maxDuration = Math.max(...event.consumes.map(() => event.duration), 0);
  
  for (let time = minTime; time <= maxTime - maxDuration; time += step) {
    if (isValidEventPlacementAllBalances(eventName, time, event, events, eventValues)) {
      return Math.round(time * 100) / 100;
    }
  }
  
  return null;
}

export function getNextValidPosition(
  eventName: string,
  currentTime: number,
  event: Event,
  balance: string,
  events: Event[],
  eventValues: Record<string, number>
): number {
  // If current position is valid for all balances, return it
  if (isValidEventPlacementAllBalances(eventName, currentTime, event, events, eventValues)) {
    return currentTime;
  }
  
  // First, try to find the closest valid position by searching both directions
  // from the current position
  const step = 0.01;
  const maxDistance = 1.0; // Maximum distance to search in each direction
  
  for (let distance = step; distance <= maxDistance; distance += step) {
    // Try backward first (prefer not jumping forward)
    const backwardTime = currentTime - distance;
    if (backwardTime >= 0 && isValidEventPlacementAllBalances(eventName, backwardTime, event, events, eventValues)) {
      return Math.round(backwardTime * 100) / 100;
    }
    
    // Then try forward
    const forwardTime = currentTime + distance;
    if (forwardTime <= 5 && isValidEventPlacementAllBalances(eventName, forwardTime, event, events, eventValues)) {
      return Math.round(forwardTime * 100) / 100;
    }
  }
  
  // If no nearby position found, try the full backward range
  const backwardPosition = findValidPlacementAllBalances(
    eventName, event, events, eventValues, 0, currentTime
  );
  
  if (backwardPosition !== null) {
    return backwardPosition;
  }
  
  // As last resort, try forward (but this should be rare)
  const forwardPosition = findValidPlacementAllBalances(
    eventName, event, events, eventValues, currentTime, 5
  );
  
  return forwardPosition !== null ? forwardPosition : currentTime;
}