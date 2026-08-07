/**
 * Manually curated calendar of major recurring Philippine festivals.
 *
 * Deliberately NOT a live API integration: there is no reliable free feed
 * for Philippine local events (Facebook's Events API has been locked down
 * for years, and general event-discovery APIs barely cover PH local
 * festivals). A curated list of the known big annual ones — updated by
 * hand when dates shift or new ones matter — was the agreed tradeoff over
 * either a paid demand-intelligence API or missing this signal entirely.
 *
 * month/day is a simplified "usually falls around here" recurring date,
 * not the exact officially-announced date for any specific year — several
 * of these move by a week or so year to year (e.g. "third Sunday of
 * January"), and Moriones is tied to the Holy Week lunar calendar and
 * shifts by weeks. Treat nextDate as an estimate; update the `note` field
 * or exact day when you have the real announced date for the year.
 */
export interface FestivalDefinition {
  name: string;
  location: string;
  coordinates: [number, number];
  /** 1-12 */
  month: number;
  day: number;
  note?: string;
}

export const FESTIVALS: FestivalDefinition[] = [
  {
    name: "Dinagyang Festival",
    location: "Iloilo City",
    coordinates: [122.5621, 10.7202],
    month: 1,
    day: 26,
    note: "Falls on the fourth Sunday of January; exact date shifts yearly.",
  },
  {
    name: "Sinulog Festival",
    location: "Cebu City",
    coordinates: [123.8854, 10.3157],
    month: 1,
    day: 19,
    note: "Falls on the third Sunday of January; exact date shifts yearly.",
  },
  {
    name: "Ati-Atihan Festival",
    location: "Kalibo, Aklan",
    coordinates: [122.3667, 11.7],
    month: 1,
    day: 19,
    note: "Falls on the third Sunday of January; exact date shifts yearly.",
  },
  {
    name: "Panagbenga Flower Festival",
    location: "Baguio City",
    coordinates: [120.596, 16.4023],
    month: 2,
    day: 1,
    note: "Month-long festival through February; date shown is the typical start.",
  },
  {
    name: "Moriones Festival",
    location: "Marinduque",
    coordinates: [121.8412, 13.4457],
    month: 4,
    day: 5,
    note: "Tied to Holy Week (lunar calendar) — shifts by weeks year to year.",
  },
  {
    name: "Bangus Festival",
    location: "Dagupan City",
    coordinates: [120.3333, 16.0433],
    month: 4,
    day: 24,
  },
  {
    name: "Pahiyas Festival",
    location: "Lucban, Quezon",
    coordinates: [121.5559, 14.1136],
    month: 5,
    day: 15,
    note: "Fixed date — feast of San Isidro Labrador.",
  },
  {
    name: "Lechon Festival",
    location: "Balayan, Batangas",
    coordinates: [120.7314, 13.9367],
    month: 6,
    day: 24,
  },
  {
    name: "T'nalak Festival",
    location: "Koronadal City",
    coordinates: [124.8467, 6.5],
    month: 7,
    day: 15,
    note: "Month-long celebration through July; date shown is approximate.",
  },
  {
    name: "Sandugo Festival",
    location: "Tagbilaran City, Bohol",
    coordinates: [123.8536, 9.6474],
    month: 7,
    day: 1,
    note: "Month-long celebration through July; date shown is approximate.",
  },
  {
    name: "Kadayawan Festival",
    location: "Davao City",
    coordinates: [125.4553, 7.1907],
    month: 8,
    day: 17,
    note: "Falls on the third week of August; exact date shifts yearly.",
  },
  {
    name: "Penafrancia Festival",
    location: "Naga City",
    coordinates: [123.1948, 13.6218],
    month: 9,
    day: 20,
    note: "Falls on the third Saturday of September; exact date shifts yearly.",
  },
  {
    name: "MassKara Festival",
    location: "Bacolod City",
    coordinates: [122.9509, 10.6765],
    month: 10,
    day: 19,
    note: "Falls on the third weekend of October; exact date shifts yearly.",
  },
  {
    name: "Higantes Festival",
    location: "Angono, Rizal",
    coordinates: [121.1531, 14.5261],
    month: 11,
    day: 23,
  },
];

export interface UpcomingFestival extends FestivalDefinition {
  /** ISO date of the next occurrence from "now". */
  nextDate: string;
  daysUntil: number;
  /** Crowdsource readings within NEARBY_RADIUS_KM (see app/api/events/festivals). */
  nearbyPointCount: number;
}

/** Next occurrence of month/day on or after `from`, rolling into next year if this year's date has passed. */
export function nextOccurrence(month: number, day: number, from: Date): Date {
  const year = from.getFullYear();
  let candidate = new Date(Date.UTC(year, month - 1, day));
  // Compare at day granularity so "today" still counts as upcoming.
  const fromDay = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  if (candidate < fromDay) {
    candidate = new Date(Date.UTC(year + 1, month - 1, day));
  }
  return candidate;
}

export function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toDay - fromDay) / MS_PER_DAY);
}
