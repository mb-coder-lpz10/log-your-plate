// Simple CSV parser for Google Fit "Daily Aggregations.csv" and
// Samsung Health "step_daily_trend" style exports. Header-based; robust to
// column order and locale-formatted numbers.

export type ImportedActivity = {
  logged_on: string; // YYYY-MM-DD
  steps: number;
  active_kcal: number;
  exercise_min: number;
  distance_m: number;
  source: "google_fit" | "samsung_health" | "csv";
};

function num(v: string | undefined): number {
  if (!v) return 0;
  const cleaned = v.replace(/["\s]/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.trim().replace(/"/g, "");
  // ISO yyyy-mm-dd or yyyy/mm/dd
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  // dd.mm.yyyy
  const eu = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (eu) return `${eu[3]}-${eu[2].padStart(2, "0")}-${eu[1].padStart(2, "0")}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

export function parseActivityCsv(text: string): ImportedActivity[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (needles: string[]) =>
    header.findIndex((h) => needles.some((n) => h.includes(n)));

  const iDate = idx(["date", "datum", "day"]);
  const iSteps = idx(["step", "schritt"]);
  const iKcal = idx(["calorie", "kcal", "kalor"]);
  const iMove = idx(["move minute", "active minute", "exercise", "aktivmin", "workout"]);
  const iDist = idx(["distance", "distanz"]);

  const isGoogle = header.some((h) => h.includes("move minute"));
  const isSamsung = header.some((h) => h.includes("com.samsung"));
  const source: ImportedActivity["source"] = isGoogle
    ? "google_fit" : isSamsung ? "samsung_health" : "csv";

  const rows: ImportedActivity[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const date = iDate >= 0 ? parseDate(cols[iDate]) : null;
    if (!date) continue;
    const steps = iSteps >= 0 ? Math.round(num(cols[iSteps])) : 0;
    const kcal = iKcal >= 0 ? Math.round(num(cols[iKcal])) : 0;
    const mins = iMove >= 0 ? Math.round(num(cols[iMove])) : 0;
    const dist = iDist >= 0 ? Math.round(num(cols[iDist])) : 0;
    if (steps === 0 && kcal === 0 && mins === 0 && dist === 0) continue;
    rows.push({
      logged_on: date, steps, active_kcal: kcal,
      exercise_min: mins, distance_m: dist, source,
    });
  }
  return rows;
}
