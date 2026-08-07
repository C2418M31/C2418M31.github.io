import type { UpcomingFestival } from "./festivals";

export async function fetchUpcomingFestivals(): Promise<UpcomingFestival[]> {
  const res = await fetch("/api/events/festivals");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load festival data.");
  return json.festivals as UpcomingFestival[];
}
