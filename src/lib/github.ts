import { readFileSync } from 'fs';

export function getEventData() {
  const eventData = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH ?? '', 'utf8'));
  return eventData;
}
