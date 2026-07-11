// Built-in seed of common foods. Values per serving_label incl. micros.
export type SeedFood = {
  name: string;
  category: string;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
};

export const SEED_FOODS: SeedFood[] = [
  // Eggs, dairy
  { name: "Ei, ganz", category: "Eier & Milch", serving_label: "1 groß (50 g)", calories: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8, sugar_g: 0.2, fiber_g: 0, sodium_mg: 71 },
  { name: "Eiklar", category: "Eier & Milch", serving_label: "1 groß (33 g)", calories: 17, protein_g: 3.6, carbs_g: 0.2, fat_g: 0.1, sugar_g: 0.2, fiber_g: 0, sodium_mg: 55 },
  { name: "Griechischer Joghurt 2%", category: "Eier & Milch", serving_label: "1 Becher (245 g)", calories: 150, protein_g: 20, carbs_g: 8, fat_g: 4, sugar_g: 7, fiber_g: 0, sodium_mg: 65 },
  { name: "Skyr natur", category: "Eier & Milch", serving_label: "150 g", calories: 96, protein_g: 17, carbs_g: 6, fat_g: 0.3, sugar_g: 6, fiber_g: 0, sodium_mg: 60 },
  { name: "Quark, mager", category: "Eier & Milch", serving_label: "250 g", calories: 170, protein_g: 30, carbs_g: 10, fat_g: 0.5, sugar_g: 10, fiber_g: 0, sodium_mg: 100 },
  { name: "Milch, 1.5%", category: "Eier & Milch", serving_label: "1 Glas (240 ml)", calories: 118, protein_g: 8, carbs_g: 12, fat_g: 3.7, sugar_g: 12, fiber_g: 0, sodium_mg: 115 },
  { name: "Hafermilch", category: "Eier & Milch", serving_label: "1 Glas (240 ml)", calories: 120, protein_g: 3, carbs_g: 16, fat_g: 5, sugar_g: 7, fiber_g: 2, sodium_mg: 100 },
  { name: "Butter", category: "Eier & Milch", serving_label: "1 TL (5 g)", calories: 36, protein_g: 0, carbs_g: 0, fat_g: 4, sugar_g: 0, fiber_g: 0, sodium_mg: 30 },
  { name: "Cheddar", category: "Eier & Milch", serving_label: "28 g", calories: 115, protein_g: 7, carbs_g: 0.4, fat_g: 9.4, sugar_g: 0.1, fiber_g: 0, sodium_mg: 180 },
  { name: "Mozzarella", category: "Eier & Milch", serving_label: "28 g", calories: 85, protein_g: 6.3, carbs_g: 0.6, fat_g: 6.3, sugar_g: 0.3, fiber_g: 0, sodium_mg: 178 },
  { name: "Feta", category: "Eier & Milch", serving_label: "30 g", calories: 79, protein_g: 4.2, carbs_g: 1.2, fat_g: 6.4, sugar_g: 1.2, fiber_g: 0, sodium_mg: 316 },
  { name: "Hüttenkäse", category: "Eier & Milch", serving_label: "100 g", calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3, sugar_g: 2.7, fiber_g: 0, sodium_mg: 364 },

  // Grains / Starches
  { name: "Haferflocken, roh", category: "Getreide", serving_label: "50 g", calories: 190, protein_g: 6.8, carbs_g: 33, fat_g: 3.4, sugar_g: 0.5, fiber_g: 5, sodium_mg: 1 },
  { name: "Müsli, klassisch", category: "Getreide", serving_label: "50 g", calories: 200, protein_g: 5.5, carbs_g: 33, fat_g: 5, sugar_g: 8, fiber_g: 4, sodium_mg: 15 },
  { name: "Brot, Vollkorn", category: "Getreide", serving_label: "1 Scheibe (45 g)", calories: 105, protein_g: 4.5, carbs_g: 18, fat_g: 1.5, sugar_g: 1.5, fiber_g: 3, sodium_mg: 220 },
  { name: "Weißbrot", category: "Getreide", serving_label: "1 Scheibe (35 g)", calories: 90, protein_g: 3, carbs_g: 17, fat_g: 1, sugar_g: 1.5, fiber_g: 0.7, sodium_mg: 175 },
  { name: "Brötchen", category: "Getreide", serving_label: "1 (60 g)", calories: 165, protein_g: 5.5, carbs_g: 32, fat_g: 1.5, sugar_g: 1.5, fiber_g: 1.5, sodium_mg: 350 },
  { name: "Reis, weiß, gekocht", category: "Getreide", serving_label: "1 Tasse (158 g)", calories: 205, protein_g: 4.3, carbs_g: 45, fat_g: 0.4, sugar_g: 0.1, fiber_g: 0.6, sodium_mg: 2 },
  { name: "Reis, Vollkorn, gekocht", category: "Getreide", serving_label: "1 Tasse (195 g)", calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8, sugar_g: 0.7, fiber_g: 3.5, sodium_mg: 10 },
  { name: "Pasta, gekocht", category: "Getreide", serving_label: "1 Tasse (140 g)", calories: 220, protein_g: 8, carbs_g: 43, fat_g: 1.3, sugar_g: 0.8, fiber_g: 2.5, sodium_mg: 4 },
  { name: "Quinoa, gekocht", category: "Getreide", serving_label: "1 Tasse (185 g)", calories: 222, protein_g: 8, carbs_g: 39, fat_g: 3.6, sugar_g: 1.6, fiber_g: 5, sodium_mg: 13 },
  { name: "Couscous, gekocht", category: "Getreide", serving_label: "1 Tasse (157 g)", calories: 176, protein_g: 6, carbs_g: 36, fat_g: 0.3, sugar_g: 0.2, fiber_g: 2.2, sodium_mg: 8 },
  { name: "Kartoffel, gekocht", category: "Getreide", serving_label: "1 mittel (150 g)", calories: 130, protein_g: 3, carbs_g: 30, fat_g: 0.2, sugar_g: 1.3, fiber_g: 2.2, sodium_mg: 10 },
  { name: "Süßkartoffel, gebacken", category: "Getreide", serving_label: "1 mittel (150 g)", calories: 130, protein_g: 2.9, carbs_g: 30, fat_g: 0.2, sugar_g: 9.4, fiber_g: 4.6, sodium_mg: 55 },
  { name: "Bulgur, gekocht", category: "Getreide", serving_label: "1 Tasse (182 g)", calories: 151, protein_g: 5.6, carbs_g: 34, fat_g: 0.4, sugar_g: 0.2, fiber_g: 8.2, sodium_mg: 9 },

  // Meat & Fish
  { name: "Hähnchenbrust, gegart", category: "Fleisch & Fisch", serving_label: "100 g", calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, sugar_g: 0, fiber_g: 0, sodium_mg: 74 },
  { name: "Pute, gegart", category: "Fleisch & Fisch", serving_label: "100 g", calories: 135, protein_g: 30, carbs_g: 0, fat_g: 1, sugar_g: 0, fiber_g: 0, sodium_mg: 65 },
  { name: "Rinderhack 5%, gegart", category: "Fleisch & Fisch", serving_label: "100 g", calories: 170, protein_g: 26, carbs_g: 0, fat_g: 7, sugar_g: 0, fiber_g: 0, sodium_mg: 65 },
  { name: "Schweinefilet, gegart", category: "Fleisch & Fisch", serving_label: "100 g", calories: 143, protein_g: 26, carbs_g: 0, fat_g: 3.5, sugar_g: 0, fiber_g: 0, sodium_mg: 55 },
  { name: "Schinken, gekocht", category: "Fleisch & Fisch", serving_label: "30 g", calories: 33, protein_g: 6, carbs_g: 0.5, fat_g: 1, sugar_g: 0.3, fiber_g: 0, sodium_mg: 340 },
  { name: "Salami", category: "Fleisch & Fisch", serving_label: "20 g", calories: 78, protein_g: 4.5, carbs_g: 0.2, fat_g: 6.5, sugar_g: 0, fiber_g: 0, sodium_mg: 380 },
  { name: "Lachs, gegart", category: "Fleisch & Fisch", serving_label: "100 g", calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, sugar_g: 0, fiber_g: 0, sodium_mg: 60 },
  { name: "Thunfisch, in Wasser", category: "Fleisch & Fisch", serving_label: "100 g", calories: 116, protein_g: 26, carbs_g: 0, fat_g: 0.8, sugar_g: 0, fiber_g: 0, sodium_mg: 247 },
  { name: "Garnelen, gegart", category: "Fleisch & Fisch", serving_label: "100 g", calories: 99, protein_g: 24, carbs_g: 0.2, fat_g: 0.3, sugar_g: 0, fiber_g: 0, sodium_mg: 111 },
  { name: "Kabeljau, gegart", category: "Fleisch & Fisch", serving_label: "100 g", calories: 105, protein_g: 23, carbs_g: 0, fat_g: 0.9, sugar_g: 0, fiber_g: 0, sodium_mg: 78 },

  // Legumes / plant protein
  { name: "Tofu, natur", category: "Hülsenfrüchte", serving_label: "100 g", calories: 144, protein_g: 15, carbs_g: 2.8, fat_g: 8.7, sugar_g: 0.6, fiber_g: 2.3, sodium_mg: 14 },
  { name: "Tempeh", category: "Hülsenfrüchte", serving_label: "100 g", calories: 193, protein_g: 20, carbs_g: 7.6, fat_g: 11, sugar_g: 0, fiber_g: 0, sodium_mg: 9 },
  { name: "Kichererbsen, gekocht", category: "Hülsenfrüchte", serving_label: "1 Tasse (164 g)", calories: 269, protein_g: 15, carbs_g: 45, fat_g: 4.3, sugar_g: 8, fiber_g: 12.5, sodium_mg: 11 },
  { name: "Linsen, gekocht", category: "Hülsenfrüchte", serving_label: "1 Tasse (198 g)", calories: 230, protein_g: 18, carbs_g: 40, fat_g: 0.8, sugar_g: 3.6, fiber_g: 15.6, sodium_mg: 4 },
  { name: "Schwarze Bohnen, gekocht", category: "Hülsenfrüchte", serving_label: "1 Tasse (172 g)", calories: 227, protein_g: 15, carbs_g: 41, fat_g: 0.9, sugar_g: 0.6, fiber_g: 15, sodium_mg: 2 },
  { name: "Hummus", category: "Hülsenfrüchte", serving_label: "2 EL (30 g)", calories: 80, protein_g: 2, carbs_g: 4, fat_g: 6, sugar_g: 0.5, fiber_g: 1.5, sodium_mg: 130 },

  // Veggies
  { name: "Brokkoli, gedünstet", category: "Gemüse", serving_label: "1 Tasse (156 g)", calories: 55, protein_g: 3.7, carbs_g: 11, fat_g: 0.6, sugar_g: 2.2, fiber_g: 5.1, sodium_mg: 64 },
  { name: "Spinat, frisch", category: "Gemüse", serving_label: "100 g", calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, sugar_g: 0.4, fiber_g: 2.2, sodium_mg: 79 },
  { name: "Blattsalat, gemischt", category: "Gemüse", serving_label: "1 Tasse (36 g)", calories: 5, protein_g: 0.5, carbs_g: 1, fat_g: 0.1, sugar_g: 0.4, fiber_g: 0.6, sodium_mg: 10 },
  { name: "Tomate", category: "Gemüse", serving_label: "1 mittel (123 g)", calories: 22, protein_g: 1.1, carbs_g: 4.8, fat_g: 0.2, sugar_g: 3.2, fiber_g: 1.5, sodium_mg: 6 },
  { name: "Gurke", category: "Gemüse", serving_label: "100 g", calories: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, sugar_g: 1.7, fiber_g: 0.5, sodium_mg: 2 },
  { name: "Paprika, rot", category: "Gemüse", serving_label: "1 mittel (120 g)", calories: 37, protein_g: 1.2, carbs_g: 7, fat_g: 0.4, sugar_g: 5, fiber_g: 2.5, sodium_mg: 5 },
  { name: "Karotte", category: "Gemüse", serving_label: "1 mittel (61 g)", calories: 25, protein_g: 0.6, carbs_g: 6, fat_g: 0.1, sugar_g: 2.9, fiber_g: 1.7, sodium_mg: 42 },
  { name: "Zucchini, gedünstet", category: "Gemüse", serving_label: "1 Tasse (180 g)", calories: 27, protein_g: 2, carbs_g: 5, fat_g: 0.5, sugar_g: 2.5, fiber_g: 1.8, sodium_mg: 8 },
  { name: "Avocado", category: "Gemüse", serving_label: "1/2 (100 g)", calories: 160, protein_g: 2, carbs_g: 9, fat_g: 15, sugar_g: 0.7, fiber_g: 6.7, sodium_mg: 7 },

  // Fruit
  { name: "Banane", category: "Obst", serving_label: "1 mittel (118 g)", calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, sugar_g: 14, fiber_g: 3.1, sodium_mg: 1 },
  { name: "Apfel", category: "Obst", serving_label: "1 mittel (182 g)", calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, sugar_g: 19, fiber_g: 4.4, sodium_mg: 2 },
  { name: "Erdbeeren", category: "Obst", serving_label: "1 Tasse (152 g)", calories: 49, protein_g: 1, carbs_g: 12, fat_g: 0.5, sugar_g: 7.4, fiber_g: 3, sodium_mg: 2 },
  { name: "Blaubeeren", category: "Obst", serving_label: "1 Tasse (148 g)", calories: 84, protein_g: 1.1, carbs_g: 21, fat_g: 0.5, sugar_g: 15, fiber_g: 3.6, sodium_mg: 1 },
  { name: "Orange", category: "Obst", serving_label: "1 mittel (131 g)", calories: 62, protein_g: 1.2, carbs_g: 15, fat_g: 0.2, sugar_g: 12, fiber_g: 3.1, sodium_mg: 0 },
  { name: "Weintrauben", category: "Obst", serving_label: "1 Tasse (151 g)", calories: 104, protein_g: 1.1, carbs_g: 27, fat_g: 0.2, sugar_g: 23, fiber_g: 1.4, sodium_mg: 3 },
  { name: "Mango", category: "Obst", serving_label: "1 Tasse (165 g)", calories: 99, protein_g: 1.4, carbs_g: 25, fat_g: 0.6, sugar_g: 22.5, fiber_g: 2.6, sodium_mg: 2 },
  { name: "Ananas", category: "Obst", serving_label: "1 Tasse (165 g)", calories: 82, protein_g: 0.9, carbs_g: 22, fat_g: 0.2, sugar_g: 16, fiber_g: 2.3, sodium_mg: 2 },

  // Nuts / fats
  { name: "Mandeln", category: "Nüsse & Fette", serving_label: "28 g", calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14, sugar_g: 1.2, fiber_g: 3.5, sodium_mg: 0 },
  { name: "Walnüsse", category: "Nüsse & Fette", serving_label: "28 g", calories: 185, protein_g: 4.3, carbs_g: 3.9, fat_g: 18.5, sugar_g: 0.7, fiber_g: 1.9, sodium_mg: 1 },
  { name: "Cashews", category: "Nüsse & Fette", serving_label: "28 g", calories: 157, protein_g: 5.2, carbs_g: 8.6, fat_g: 12.4, sugar_g: 1.7, fiber_g: 0.9, sodium_mg: 3 },
  { name: "Erdnussbutter", category: "Nüsse & Fette", serving_label: "2 EL (32 g)", calories: 190, protein_g: 8, carbs_g: 8, fat_g: 16, sugar_g: 3, fiber_g: 2, sodium_mg: 140 },
  { name: "Olivenöl", category: "Nüsse & Fette", serving_label: "1 EL (14 g)", calories: 119, protein_g: 0, carbs_g: 0, fat_g: 13.5, sugar_g: 0, fiber_g: 0, sodium_mg: 0 },
  { name: "Chiasamen", category: "Nüsse & Fette", serving_label: "1 EL (12 g)", calories: 60, protein_g: 2, carbs_g: 5, fat_g: 3.8, sugar_g: 0, fiber_g: 4.1, sodium_mg: 2 },
  { name: "Leinsamen, gemahlen", category: "Nüsse & Fette", serving_label: "1 EL (7 g)", calories: 37, protein_g: 1.3, carbs_g: 2, fat_g: 3, sugar_g: 0.1, fiber_g: 1.9, sodium_mg: 2 },

  // Snacks & sweets
  { name: "Zartbitterschokolade 70%", category: "Süßes", serving_label: "20 g", calories: 120, protein_g: 1.6, carbs_g: 9, fat_g: 8.5, sugar_g: 6.8, fiber_g: 2.2, sodium_mg: 4 },
  { name: "Milchschokolade", category: "Süßes", serving_label: "20 g", calories: 108, protein_g: 1.5, carbs_g: 12, fat_g: 6, sugar_g: 11, fiber_g: 0.3, sodium_mg: 15 },
  { name: "Gummibärchen", category: "Süßes", serving_label: "30 g", calories: 100, protein_g: 2, carbs_g: 22, fat_g: 0, sugar_g: 15, fiber_g: 0, sodium_mg: 6 },
  { name: "Cookie, Schoko", category: "Süßes", serving_label: "1 (16 g)", calories: 80, protein_g: 0.8, carbs_g: 10, fat_g: 4, sugar_g: 6, fiber_g: 0.3, sodium_mg: 55 },
  { name: "Chips, Salz", category: "Süßes", serving_label: "30 g", calories: 160, protein_g: 2, carbs_g: 15, fat_g: 10, sugar_g: 0.2, fiber_g: 1.3, sodium_mg: 170 },
  { name: "Proteinriegel", category: "Süßes", serving_label: "1 (60 g)", calories: 220, protein_g: 20, carbs_g: 22, fat_g: 7, sugar_g: 3, fiber_g: 8, sodium_mg: 180 },

  // Drinks
  { name: "Kaffee, schwarz", category: "Getränke", serving_label: "1 Tasse (240 ml)", calories: 2, protein_g: 0.3, carbs_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0, sodium_mg: 5 },
  { name: "Cappuccino mit Milch", category: "Getränke", serving_label: "1 Tasse (240 ml)", calories: 74, protein_g: 4, carbs_g: 6, fat_g: 4, sugar_g: 6, fiber_g: 0, sodium_mg: 55 },
  { name: "Grüner Tee", category: "Getränke", serving_label: "1 Tasse (240 ml)", calories: 2, protein_g: 0.5, carbs_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0, sodium_mg: 2 },
  { name: "Orangensaft", category: "Getränke", serving_label: "1 Glas (240 ml)", calories: 112, protein_g: 1.7, carbs_g: 26, fat_g: 0.5, sugar_g: 21, fiber_g: 0.5, sodium_mg: 2 },
  { name: "Cola", category: "Getränke", serving_label: "1 Dose (330 ml)", calories: 139, protein_g: 0, carbs_g: 35, fat_g: 0, sugar_g: 35, fiber_g: 0, sodium_mg: 15 },
  { name: "Bier", category: "Getränke", serving_label: "0.5 L", calories: 215, protein_g: 2.3, carbs_g: 18, fat_g: 0, sugar_g: 0, fiber_g: 0, sodium_mg: 20 },
  { name: "Rotwein", category: "Getränke", serving_label: "1 Glas (150 ml)", calories: 125, protein_g: 0.1, carbs_g: 3.8, fat_g: 0, sugar_g: 0.9, fiber_g: 0, sodium_mg: 6 },

  // Prepared meals
  { name: "Pizza Margherita", category: "Fertig & Restaurant", serving_label: "1 Stück (120 g)", calories: 285, protein_g: 12, carbs_g: 36, fat_g: 10, sugar_g: 4, fiber_g: 2.5, sodium_mg: 640 },
  { name: "Burger, klassisch", category: "Fertig & Restaurant", serving_label: "1 (250 g)", calories: 540, protein_g: 27, carbs_g: 46, fat_g: 28, sugar_g: 9, fiber_g: 3, sodium_mg: 960 },
  { name: "Sushi (6 Nigiri)", category: "Fertig & Restaurant", serving_label: "6 Stück (180 g)", calories: 340, protein_g: 18, carbs_g: 55, fat_g: 4, sugar_g: 6, fiber_g: 2, sodium_mg: 620 },
  { name: "Döner Kebab", category: "Fertig & Restaurant", serving_label: "1 (400 g)", calories: 680, protein_g: 40, carbs_g: 65, fat_g: 28, sugar_g: 8, fiber_g: 5, sodium_mg: 1400 },
  { name: "Caesar Salat mit Hähnchen", category: "Fertig & Restaurant", serving_label: "1 Portion (350 g)", calories: 440, protein_g: 32, carbs_g: 18, fat_g: 27, sugar_g: 4, fiber_g: 4, sodium_mg: 890 },

  // Supplements
  { name: "Whey Protein", category: "Supplements", serving_label: "1 Scoop (30 g)", calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5, sugar_g: 2, fiber_g: 0, sodium_mg: 60 },
  { name: "Casein Protein", category: "Supplements", serving_label: "1 Scoop (30 g)", calories: 110, protein_g: 24, carbs_g: 3, fat_g: 0.5, sugar_g: 1, fiber_g: 0, sodium_mg: 100 },
  { name: "Kreatin Monohydrat", category: "Supplements", serving_label: "5 g", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0, sodium_mg: 0 },
];

export const FOOD_CATEGORIES = Array.from(new Set(SEED_FOODS.map((f) => f.category)));
