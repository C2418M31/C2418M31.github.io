/**
 * Models occasionally wrap JSON in markdown fences or add stray text.
 * Strip fences and slice to the outermost braces before parsing.
 */
export function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonSlice = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;

  return JSON.parse(jsonSlice);
}
