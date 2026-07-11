// Nutrition math — BMR (Mifflin-St Jeor), TDEE, macros, water, streak.

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain" | "build_muscle";
export type DietPref =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "high_protein"
  | "low_carb"
  | "mediterranean"
  | "gluten_free"
  | "lactose_free";

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Kaum Bewegung",
  light: "Leicht — 1–3× / Woche",
  moderate: "Moderat — 3–5× / Woche",
  active: "Aktiv — 6–7× / Woche",
  very_active: "Sehr aktiv — hartes tägliches Training",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Abnehmen",
  maintain: "Gewicht halten",
  gain: "Zunehmen",
  build_muscle: "Muskelaufbau",
};

export const DIET_PREF_LABELS: Record<DietPref, string> = {
  vegetarian: "Vegetarisch",
  vegan: "Vegan",
  pescatarian: "Pescetarisch",
  high_protein: "High Protein",
  low_carb: "Low Carb",
  mediterranean: "Mediterran",
  gluten_free: "Glutenfrei",
  lactose_free: "Laktosefrei",
};

export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function tdee(sex: Sex, weightKg: number, heightCm: number, age: number, activity: ActivityLevel): number {
  return bmr(sex, weightKg, heightCm, age) * ACTIVITY_MULT[activity];
}

export function calorieTarget(tdeeKcal: number, goal: Goal, targetRateKgPerWeek: number): number {
  const dailyDelta = (targetRateKgPerWeek * 7700) / 7;
  let target = tdeeKcal;
  if (goal === "lose") target = tdeeKcal - Math.abs(dailyDelta);
  else if (goal === "gain" || goal === "build_muscle") target = tdeeKcal + Math.abs(dailyDelta);
  return Math.max(1200, Math.round(target));
}

export function macroTargets(
  calories: number,
  weightKg: number,
  goal: Goal,
): { protein_g: number; carbs_g: number; fat_g: number } {
  const proteinPerKg = goal === "build_muscle" ? 2.0 : goal === "lose" ? 1.8 : 1.6;
  const protein_g = Math.round(weightKg * proteinPerKg);
  const fatCalRatio = 0.28;
  const fat_g = Math.round((calories * fatCalRatio) / 9);
  const remaining = calories - protein_g * 4 - fat_g * 9;
  const carbs_g = Math.max(50, Math.round(remaining / 4));
  return { protein_g, carbs_g, fat_g };
}

// ~35 ml water per kg body weight, +350 ml per training day / 7
export function waterTargetMl(weightKg: number, trainingDaysPerWeek: number = 0): number {
  const base = weightKg * 35;
  const training = (trainingDaysPerWeek / 7) * 500;
  return Math.round((base + training) / 50) * 50;
}

// Streak: count consecutive days ending today that have at least one entry.
export function calculateStreak(datesWithLogs: string[]): number {
  if (datesWithLogs.length === 0) return 0;
  const set = new Set(datesWithLogs);
  let d = new Date();
  let streak = 0;
  // Grace: if today has no log yet, start counting from yesterday.
  const today = d.toISOString().slice(0, 10);
  if (!set.has(today)) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Simple level curve — every level = +150 XP, XP from streak * 10 + logs * 2.
export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  const step = 150;
  const level = Math.floor(xp / step) + 1;
  const into = xp % step;
  return { level, into, needed: step };
}
