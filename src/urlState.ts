interface Event {
  name: string;
  req: string[];
  consumes: string[];
  duration: number;
}

interface AppState {
  balances: string[];
  events: Event[];
  eventValues: Record<string, number>;
}

export function serializeState(state: AppState): string {
  const params = new URLSearchParams();
  params.set("state", btoa(JSON.stringify(state)));
  return params.toString();
}

export function deserializeState(): AppState | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    if (!stateParam) return null;

    return JSON.parse(atob(stateParam));
  } catch (error) {
    console.warn("Failed to deserialize state from URL:", error);
    return null;
  }
}

export function updateURL(state: AppState): void {
  const url = new URL(window.location.href);
  url.search = serializeState(state);
  window.history.replaceState({}, "", url.toString());
}

export function getDefaultState(): AppState {
  return {
    balances: ["eq", "bal", "pill", "salve", "pipe"],
    events: [
      {
        name: "cast windlance",
        req: ["eq", "bal"],
        consumes: ["eq"],
        duration: 1.5,
      },
    ],
    eventValues: {},
  };
}

export function resetState(): void {
  const url = new URL(window.location.href);
  url.search = "";
  window.location.href = url.toString();
}
