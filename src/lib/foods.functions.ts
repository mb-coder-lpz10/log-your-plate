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

// ---------- Barcode lookup (OpenFoodFacts) ----------
const BarcodeInput = z.object({ code: z.string().trim().regex(/^\d{6,14}$/) });

export const lookupBarcode = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => BarcodeInput.parse(i))
  .handler(async ({ data }): Promise<FdcFood | null> => {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${data.code}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity`,
    );
    if (!res.ok) return null;
    const json: any = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const n = p.nutriments ?? {};
    const servingG = Number(p.serving_quantity ?? 0);
    const scale = servingG > 0 ? servingG / 100 : 1;
    const label = servingG > 0 ? `${p.serving_size ?? `${servingG} g`}` : "100 g";
    const r1 = (v: number) => Math.round(v * 10) / 10;
    const num = (k: string) => Number(n[k] ?? 0);
    return {
      fdcId: data.code,
      name: p.product_name || "Unbekanntes Produkt",
      brand: p.brands || undefined,
      serving_label: label,
      calories: Math.round((num("energy-kcal_100g") || num("energy-kcal") || 0) * scale),
      protein_g: r1(num("proteins_100g") * scale),
      carbs_g: r1(num("carbohydrates_100g") * scale),
      fat_g: r1(num("fat_100g") * scale),
      sugar_g: r1(num("sugars_100g") * scale),
      fiber_g: r1(num("fiber_100g") * scale),
      sodium_mg: Math.round(num("sodium_100g") * 1000 * scale),
    };
  });

// ---------- AI meal recognition from photo ----------
const RecognizeInput = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
});

export type RecognizedMeal = {
  name: string;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
  confidence: "low" | "medium" | "high";
  items: string[];
};

export const recognizeMeal = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => RecognizeInput.parse(i))
  .handler(async ({ data }): Promise<RecognizedMeal> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein Ernährungs-Assistent. Analysiere Essensfotos und schätze eine sinnvolle Portion. Antworte ausschließlich als striktes JSON mit den Feldern: name, items (string[]), serving_label, calories, protein_g, carbs_g, fat_g, sugar_g, fiber_g, sodium_mg, confidence ('low'|'medium'|'high'). Nutze Deutsch für name/serving_label/items. Sei realistisch — keine Nullen, wenn Essen erkennbar ist.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Was ist auf diesem Foto? Schätze die Nährwerte für die abgebildete Portion." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI Gateway ${res.status}: ${text}`);
    }
    const json: any = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    const conf = ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "medium";
    return {
      name: String(parsed.name ?? "Mahlzeit"),
      serving_label: String(parsed.serving_label ?? "1 Portion"),
      calories: Math.round(num(parsed.calories)),
      protein_g: Math.round(num(parsed.protein_g) * 10) / 10,
      carbs_g: Math.round(num(parsed.carbs_g) * 10) / 10,
      fat_g: Math.round(num(parsed.fat_g) * 10) / 10,
      sugar_g: Math.round(num(parsed.sugar_g) * 10) / 10,
      fiber_g: Math.round(num(parsed.fiber_g) * 10) / 10,
      sodium_mg: Math.round(num(parsed.sodium_mg)),
      confidence: conf as "low" | "medium" | "high",
      items: Array.isArray(parsed.items) ? parsed.items.map(String) : [],
    };
  });
