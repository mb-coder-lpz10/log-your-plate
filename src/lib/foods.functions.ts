// USDA FoodData Central search via server function.
// Uses DEMO_KEY by default (~30 req/hr shared). Set USDA_API_KEY for higher limits.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchInput = z.object({ query: z.string().trim().min(1).max(80) });

export type FdcFood = {
  fdcId: string;
  name: string;
  brand?: string;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

// USDA nutrient numbers
const N_ENERGY = "208";
const N_PROTEIN = "203";
const N_CARBS = "205";
const N_FAT = "204";

function getNutrient(food: any, num: string): number {
  const n = (food.foodNutrients ?? []).find(
    (x: any) => String(x.nutrientNumber ?? x.number ?? "") === num,
  );
  return Number(n?.value ?? 0);
}

export const searchFoods = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => SearchInput.parse(i))
  .handler(async ({ data }): Promise<FdcFood[]> => {
    const key = process.env.USDA_API_KEY || "DEMO_KEY";
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", key);
    url.searchParams.set("query", data.query);
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("USDA search failed", res.status, await res.text());
      return [];
    }
    const json: any = await res.json();
    const foods = (json.foods ?? []) as any[];

    return foods.map((f): FdcFood => {
      // Branded foods often provide servingSize (g) and per-100g nutrients.
      const servingSize = Number(f.servingSize ?? 0);
      const servingUnit = f.servingSizeUnit ?? "g";
      const householdText = f.householdServingFullText;

      const cal100 = getNutrient(f, N_ENERGY);
      const p100 = getNutrient(f, N_PROTEIN);
      const c100 = getNutrient(f, N_CARBS);
      const fa100 = getNutrient(f, N_FAT);

      const scale = servingSize > 0 && servingUnit === "g" ? servingSize / 100 : 1;
      const label =
        servingSize > 0
          ? householdText
            ? `${householdText} (${servingSize} ${servingUnit})`
            : `${servingSize} ${servingUnit}`
          : "100 g";

      return {
        fdcId: String(f.fdcId),
        name: f.description ?? "Unknown",
        brand: f.brandOwner ?? f.brandName ?? undefined,
        serving_label: label,
        calories: Math.round(cal100 * scale),
        protein_g: Math.round(p100 * scale * 10) / 10,
        carbs_g: Math.round(c100 * scale * 10) / 10,
        fat_g: Math.round(fa100 * scale * 10) / 10,
      };
    });
  });
