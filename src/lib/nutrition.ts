// Nutrition math — BMR (Mifflin-St Jeor), TDEE, macro splits.

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain" | "build_muscle";

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary — little or no exercise",
  light: "Light — 1-3x / week",
  moderate: "Moderate — 3-5x / week",
  active: "Active — 6-7x / week",
  very_active: "Very active — hard daily training",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Lose weight",
  maintain: "Maintain",
  gain: "Gain weight",
  build_muscle: "Build muscle",
};

export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function tdee(sex: Sex, weightKg: number, heightCm: number, age: number, activity: ActivityLevel): number {
  return bmr(sex, weightKg, heightCm, age) * ACTIVITY_MULT[activity];
}

// 1 kg body weight ≈ 7700 kcal
export function calorieTarget(
  tdeeKcal: number,
  goal: Goal,
  targetRateKgPerWeek: number,
): number {
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
  // Protein: g/kg by goal
  const proteinPerKg = goal === "build_muscle" ? 2.0 : goal === "lose" ? 1.8 : 1.6;
  const protein_g = Math.round(weightKg * proteinPerKg);
  const fatCalRatio = 0.28;
  const fat_g = Math.round((calories * fatCalRatio) / 9);
  const remaining = calories - protein_g * 4 - fat_g * 9;
  const carbs_g = Math.max(50, Math.round(remaining / 4));
  return { protein_g, carbs_g, fat_g };
}
