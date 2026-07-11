import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { searchFoods, type FdcFood } from "@/lib/foods.functions";
import { SEED_FOODS } from "@/lib/foods";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, Zap, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const searchSchema = z.object({
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
});

export const Route = createFileRoute("/_authenticated/log")({
  validateSearch: (s) => searchSchema.parse(s),
  component: LogPage,
});

type FoodItem = {
  name: string;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  fdc_id?: string;
};

function LogPage() {
  const { meal: initialMeal } = Route.useSearch();
  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">(
    initialMeal ?? "breakfast",
  );
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FdcFood[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await searchFoods({ data: { query: q } });
      setResults(res);
    } catch {
      toast.error("Search failed, showing local matches");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  const seedMatches = q
    ? SEED_FOODS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
    : SEED_FOODS.slice(0, 10);

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <button
          onClick={() => history.back()}
          className="rounded-full p-2 hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl">Log food</h1>
      </header>

      <div className="mb-4">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Meal</Label>
        <Select value={meal} onValueChange={(v) => setMeal(v as typeof meal)}>
          <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary/70">
          <TabsTrigger value="search" className="rounded-full">
            <Search className="mr-1.5 h-4 w-4" />Search
          </TabsTrigger>
          <TabsTrigger value="quick" className="rounded-full">
            <Zap className="mr-1.5 h-4 w-4" />Quick add
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <form onSubmit={runSearch} className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search foods (e.g. chicken breast)"
              className="rounded-xl"
            />
            <Button type="submit" disabled={searching} className="rounded-full">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            {results !== null && results.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">USDA results</p>
                {results.map((f) => (
                  <FoodRow
                    key={f.fdcId}
                    item={{ ...f, fdc_id: f.fdcId }}
                    subtitle={f.brand}
                    onClick={() => setSelected({ ...f, fdc_id: f.fdcId })}
                  />
                ))}
              </>
            )}
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
              Common foods
            </p>
            {seedMatches.map((f) => (
              <FoodRow key={f.name} item={f} onClick={() => setSelected(f)} />
            ))}
            {seedMatches.length === 0 && results?.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No results. Try Quick add below.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="mt-4">
          <QuickAdd meal={meal} />
        </TabsContent>
      </Tabs>

      {selected && (
        <ServingDialog food={selected} meal={meal} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function FoodRow({
  item, subtitle, onClick,
}: { item: FoodItem; subtitle?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card p-3 text-left transition hover:border-primary/40 hover:bg-secondary/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle ? `${subtitle} · ` : ""}{item.serving_label} · {Math.round(item.calories)} kcal
        </p>
      </div>
      <div className="ml-2 text-xs text-muted-foreground">
        P{Math.round(item.protein_g)} · C{Math.round(item.carbs_g)} · F{Math.round(item.fat_g)}
      </div>
    </button>
  );
}

function ServingDialog({
  food, meal, onClose,
}: {
  food: FoodItem;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  onClose: () => void;
}) {
  const [servings, setServings] = useState(1);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("food_logs").insert({
        user_id: u.user.id,
        meal,
        food_name: food.name,
        servings,
        serving_label: food.serving_label,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        sugar_g: food.sugar_g ?? 0,
        fiber_g: food.fiber_g ?? 0,
        sodium_mg: food.sodium_mg ?? 0,
        fdc_id: food.fdc_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food_logs"] });
      toast.success(`Added to ${meal}`);
      navigate({ to: "/home" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to log"),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h3 className="text-xl font-semibold">{food.name}</h3>
        <p className="text-xs text-muted-foreground">{food.serving_label}</p>

        <div className="mt-5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Servings
          </Label>
          <div className="mt-2 flex items-center gap-3">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => setServings((s) => Math.max(0.25, Math.round((s - 0.5) * 4) / 4))}
            >−</Button>
            <Input
              type="number"
              step="0.25"
              min="0.25"
              value={servings}
              onChange={(e) => setServings(Math.max(0.25, parseFloat(e.target.value) || 1))}
              className="rounded-xl text-center text-lg font-semibold"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => setServings((s) => Math.round((s + 0.5) * 4) / 4)}
            >+</Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-secondary/60 p-4 text-center text-sm">
          <Stat label="kcal" val={Math.round(food.calories * servings)} />
          <Stat label="P" val={Math.round(food.protein_g * servings)} />
          <Stat label="C" val={Math.round(food.carbs_g * servings)} />
          <Stat label="F" val={Math.round(food.fat_g * servings)} />
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
          >
            {mut.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, val }: { label: string; val: number }) {
  return (
    <div>
      <p className="text-lg font-semibold">{val}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAdd({ meal }: { meal: "breakfast" | "lunch" | "dinner" | "snack" }) {
  const [name, setName] = useState("Quick entry");
  const [cal, setCal] = useState(0);
  const [p, setP] = useState(0);
  const [c, setC] = useState(0);
  const [f, setF] = useState(0);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("food_logs").insert({
        user_id: u.user.id,
        meal,
        food_name: name || "Quick entry",
        servings: 1,
        serving_label: "1 serving",
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food_logs"] });
      toast.success(`Added to ${meal}`);
      navigate({ to: "/home" });
    },
  });

  return (
    <Card className="rounded-2xl border-border/60 p-5">
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <NumInput label="kcal" v={cal} set={setCal} />
          <NumInput label="Protein" v={p} set={setP} />
          <NumInput label="Carbs" v={c} set={setC} />
          <NumInput label="Fat" v={f} set={setF} />
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="mt-2 w-full rounded-full">
          Add to {meal}
        </Button>
      </div>
    </Card>
  );
}

function NumInput({ label, v, set }: { label: string; v: number; set: (n: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min="0"
        value={v}
        onChange={(e) => set(parseFloat(e.target.value) || 0)}
        className="mt-1 rounded-xl"
      />
    </div>
  );
}
