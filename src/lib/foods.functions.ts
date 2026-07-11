// USDA FoodData Central search via server function.
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
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
};

export const searchFoods = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => SearchInput.parse(i))
  .handler(async ({ data }): Promise<FdcFood[]> => {
    const N = {
      energy: "208",
      protein: "203",
      carbs: "205",
      fat: "204",
      sugar: "269",
      fiber: "291",
      sodium: "307",
    };
    const getNutrient = (food: any, num: string): number => {
      const n = (food.foodNutrients ?? []).find(
        (x: any) => String(x.nutrientNumber ?? x.number ?? "") === num,
      );
      return Number(n?.value ?? 0);
    };

    const key = process.env.USDA_API_KEY || "DEMO_KEY";
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", key);
    url.searchParams.set("query", data.query);
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("USDA search failed", res.status);
      return [];
    }
    const json: any = await res.json();
    const foods = (json.foods ?? []) as any[];

    return foods.map((f): FdcFood => {
      const servingSize = Number(f.servingSize ?? 0);
      const servingUnit = f.servingSizeUnit ?? "g";
      const householdText = f.householdServingFullText;

      const scale =
        servingSize > 0 && servingUnit === "g" ? servingSize / 100 : 1;
      const label =
        servingSize > 0
          ? householdText
            ? `${householdText} (${servingSize} ${servingUnit})`
            : `${servingSize} ${servingUnit}`
          : "100 g";

      const r1 = (v: number) => Math.round(v * 10) / 10;
      return {
        fdcId: String(f.fdcId),
        name: f.description ?? "Unknown",
        brand: f.brandOwner ?? f.brandName ?? undefined,
        serving_label: label,
        calories: Math.round(getNutrient(f, N.energy) * scale),
        protein_g: r1(getNutrient(f, N.protein) * scale),
        carbs_g: r1(getNutrient(f, N.carbs) * scale),
        fat_g: r1(getNutrient(f, N.fat) * scale),
        sugar_g: r1(getNutrient(f, N.sugar) * scale),
        fiber_g: r1(getNutrient(f, N.fiber) * scale),
        sodium_mg: Math.round(getNutrient(f, N.sodium) * scale),
      };
    });
  });
