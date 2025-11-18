import { Scenario } from '@/types';

const STORAGE_KEY = 'ilp_dispatch_scenarios';

export function getSavedScenarios(): Scenario[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveScenario(scenario: Scenario): void {
  const scenarios = getSavedScenarios();
  scenarios.unshift(scenario);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function deleteScenario(id: string): void {
  const scenarios = getSavedScenarios();
  const filtered = scenarios.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateScenarioId(): string {
  return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate heading from two points (16 compass directions)
export function calculateHeading(
  from: [number, number],
  to: [number, number]
): string {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;

  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;

  // Calculate angle in degrees (0 = North, clockwise)
  let angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  // Map to 16 compass directions
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];

  const index = Math.round(angle / 22.5) % 16;
  return directions[index];
}

// Calculate cumulative cost based on steps
export function calculateCumulativeCost(
  stepNumber: number,
  costPerMove: number = 0.00015
): number {
  return stepNumber * costPerMove;
}
