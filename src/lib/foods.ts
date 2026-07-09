// Small built-in seed of common foods for instant logging.
// Values are per the given serving_label.
export type SeedFood = {
  name: string;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export const SEED_FOODS: SeedFood[] = [
  { name: "Egg, whole", serving_label: "1 large (50 g)", calories: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8 },
  { name: "Oatmeal, cooked", serving_label: "1 cup (234 g)", calories: 158, protein_g: 6, carbs_g: 27, fat_g: 3.2 },
  { name: "Banana", serving_label: "1 medium (118 g)", calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4 },
  { name: "Apple", serving_label: "1 medium (182 g)", calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3 },
  { name: "Greek yogurt, plain 2%", serving_label: "1 cup (245 g)", calories: 150, protein_g: 20, carbs_g: 8, fat_g: 4 },
  { name: "Chicken breast, cooked", serving_label: "100 g", calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { name: "Salmon, cooked", serving_label: "100 g", calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13 },
  { name: "White rice, cooked", serving_label: "1 cup (158 g)", calories: 205, protein_g: 4.3, carbs_g: 45, fat_g: 0.4 },
  { name: "Brown rice, cooked", serving_label: "1 cup (195 g)", calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8 },
  { name: "Pasta, cooked", serving_label: "1 cup (140 g)", calories: 220, protein_g: 8, carbs_g: 43, fat_g: 1.3 },
  { name: "Bread, whole wheat", serving_label: "1 slice (43 g)", calories: 100, protein_g: 4, carbs_g: 17, fat_g: 1.5 },
  { name: "Olive oil", serving_label: "1 tbsp (14 g)", calories: 119, protein_g: 0, carbs_g: 0, fat_g: 13.5 },
  { name: "Almonds", serving_label: "28 g (1 oz)", calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14 },
  { name: "Peanut butter", serving_label: "2 tbsp (32 g)", calories: 190, protein_g: 8, carbs_g: 8, fat_g: 16 },
  { name: "Broccoli, cooked", serving_label: "1 cup (156 g)", calories: 55, protein_g: 3.7, carbs_g: 11, fat_g: 0.6 },
  { name: "Sweet potato, baked", serving_label: "1 medium (150 g)", calories: 130, protein_g: 2.9, carbs_g: 30, fat_g: 0.2 },
  { name: "Avocado", serving_label: "1/2 (100 g)", calories: 160, protein_g: 2, carbs_g: 9, fat_g: 15 },
  { name: "Milk, 2%", serving_label: "1 cup (244 g)", calories: 122, protein_g: 8, carbs_g: 12, fat_g: 4.8 },
  { name: "Cheddar cheese", serving_label: "28 g (1 oz)", calories: 115, protein_g: 7, carbs_g: 0.4, fat_g: 9.4 },
  { name: "Black beans, cooked", serving_label: "1 cup (172 g)", calories: 227, protein_g: 15, carbs_g: 41, fat_g: 0.9 },
  { name: "Ground beef, 90% cooked", serving_label: "100 g", calories: 217, protein_g: 26, carbs_g: 0, fat_g: 12 },
  { name: "Tofu, firm", serving_label: "100 g", calories: 144, protein_g: 15, carbs_g: 2.8, fat_g: 8.7 },
  { name: "Tuna, canned in water", serving_label: "100 g", calories: 116, protein_g: 26, carbs_g: 0, fat_g: 0.8 },
  { name: "Protein shake (whey)", serving_label: "1 scoop (30 g)", calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5 },
  { name: "Coffee, black", serving_label: "1 cup (240 g)", calories: 2, protein_g: 0.3, carbs_g: 0, fat_g: 0 },
];
