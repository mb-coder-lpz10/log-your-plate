// Combined food search: USDA FoodData Central + Open Food Facts.
// USDA uses DEMO_KEY unless USDA_API_KEY is set. OFF has no key.
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
  source: "USDA" | "OFF";
};

export const searchFoods = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => SearchInput.parse(i))
  .handler(async ({ data }): Promise<FdcFood[]> => {
    // Splitter drops sibling module-scope decls — keep helpers local.
    const N_ENERGY = "208";
    const N_PROTEIN = "203";
    const N_CARBS = "205";
    const N_FAT = "204";
    const getNutrient = (food: any, num: string): number => {
      const n = (food.foodNutrients ?? []).find(
        (x: any) => String(x.nutrientNumber ?? x.number ?? "") === num,
      );
      return Number(n?.value ?? 0);
    };

    const key = process.env.USDA_API_KEY || "DEMO_KEY";
    const usdaUrl = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    usdaUrl.searchParams.set("api_key", key);
    usdaUrl.searchParams.set("query", data.query);
    usdaUrl.searchParams.set("pageSize", "15");
    usdaUrl.searchParams.set("dataType", "Foundation,SR Legacy,Branded");

    const offUrl = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    offUrl.searchParams.set("search_terms", data.query);
    offUrl.searchParams.set("search_simple", "1");
    offUrl.searchParams.set("action", "process");
    offUrl.searchParams.set("json", "1");
    offUrl.searchParams.set("page_size", "15");
    offUrl.searchParams.set(
      "fields",
      "code,product_name,brands,serving_size,serving_quantity,nutriments",
    );

    const [usdaRes, offRes] = await Promise.allSettled([
      fetch(usdaUrl.toString()).then((r) => (r.ok ? r.json() : null)),
      fetch(offUrl.toString(), {
        headers: { "User-Agent": "NutriLog/1.0 (lovable.app)" },
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    const out: FdcFood[] = [];

    if (usdaRes.status === "fulfilled" && usdaRes.value) {
      const foods = (usdaRes.value.foods ?? []) as any[];
      for (const f of foods) {
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

        out.push({
          fdcId: `usda:${f.fdcId}`,
          name: f.description ?? "Unknown",
          brand: f.brandOwner ?? f.brandName ?? undefined,
          serving_label: label,
          calories: Math.round(cal100 * scale),
          protein_g: Math.round(p100 * scale * 10) / 10,
          carbs_g: Math.round(c100 * scale * 10) / 10,
          fat_g: Math.round(fa100 * scale * 10) / 10,
          source: "USDA",
        });
      }
    }

    if (offRes.status === "fulfilled" && offRes.value) {
      const products = (offRes.value.products ?? []) as any[];
      for (const p of products) {
        const n = p.nutriments ?? {};
        // OFF energy in kcal per 100g
        const kcal100 = Number(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0);
        if (!kcal100) continue;
        const prot100 = Number(n.proteins_100g ?? 0);
        const carbs100 = Number(n.carbohydrates_100g ?? 0);
        const fat100 = Number(n.fat_100g ?? 0);

        const sq = Number(p.serving_quantity ?? 0);
        const scale = sq > 0 ? sq / 100 : 1;
        const label =
          p.serving_size ? String(p.serving_size) : sq > 0 ? `${sq} g` : "100 g";
        const name = String(p.product_name ?? "").trim();
        if (!name) continue;

        out.push({
          fdcId: `off:${p.code}`,
          name,
          brand: p.brands ? String(p.brands).split(",")[0].trim() : undefined,
          serving_label: label,
          calories: Math.round(kcal100 * scale),
          protein_g: Math.round(prot100 * scale * 10) / 10,
          carbs_g: Math.round(carbs100 * scale * 10) / 10,
          fat_g: Math.round(fat100 * scale * 10) / 10,
          source: "OFF",
        });
      }
    }

    // Rank: name-prefix match first, then USDA before OFF, cap 30
    const q = data.query.toLowerCase();
    out.sort((a, b) => {
      const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      if (a.source !== b.source) return a.source === "USDA" ? -1 : 1;
      return 0;
    });
    return out.slice(0, 30);
  });
