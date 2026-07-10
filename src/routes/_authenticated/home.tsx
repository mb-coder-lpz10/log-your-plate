import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABEL: Record<(typeof MEAL_ORDER)[number], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function HomePage() {
  const qc = useQueryClient();
  const date = today();

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const logsQ = useQuery({
    queryKey: ["food_logs", date],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", u.user.id)
        .eq("logged_on", date)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food_logs", date] });
      toast.success("Removed");
    },
  });

  const logs = logsQ.data ?? [];
  const totals = logs.reduce(
    (a, l) => {
      const m = Number(l.servings);
      a.cal += Number(l.calories) * m;
      a.p += Number(l.protein_g) * m;
      a.c += Number(l.carbs_g) * m;
      a.f += Number(l.fat_g) * m;
      return a;
    },
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  const profile = profileQ.data;
  const calTarget = profile?.calorie_target ?? 2000;
  const pTarget = profile?.protein_g ?? 120;
  const cTarget = profile?.carbs_g ?? 220;
  const fTarget = profile?.fat_g ?? 65;

  const remaining = Math.max(0, calTarget - totals.cal);
  const pct = Math.min(100, (totals.cal / calTarget) * 100);

  const byMeal = MEAL_ORDER.map((m) => ({
    meal: m,
    items: logs.filter((l) => l.meal === m),
  }));

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {format(new Date(), "EEEE, MMM d")}
        </p>
        <h1 className="mt-1 text-4xl">
          Hey{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
        </h1>
      </header>

      <Card className="rounded-3xl border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Calories
            </p>
            <p className="mt-1 text-4xl font-semibold">
              {Math.round(totals.cal)}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / {calTarget}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <Flame className="mr-1 inline h-3.5 w-3.5 text-primary" />
              {Math.round(remaining)} kcal remaining
            </p>
          </div>
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-secondary)" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="var(--color-primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(pct * 97.4) / 100} 97.4`}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-sm font-semibold">
              {Math.round(pct)}%
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <MacroBar label="Protein" val={totals.p} target={pTarget} tone="protein" />
          <MacroBar label="Carbs" val={totals.c} target={cTarget} tone="carbs" />
          <MacroBar label="Fat" val={totals.f} target={fTarget} tone="fat" />
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-2xl">Meals</h2>
        <Link to="/log">
          <Button size="sm" className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> Add food
          </Button>
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {byMeal.map(({ meal, items }) => {
          const cal = items.reduce((a, l) => a + Number(l.calories) * Number(l.servings), 0);
          return (
            <Card key={meal} className="rounded-2xl border-border/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{MEAL_LABEL[meal]}</p>
                  <p className="text-xs text-muted-foreground">
                    {items.length === 0 ? "Nothing logged yet" : `${Math.round(cal)} kcal`}
                  </p>
                </div>
                <Link to="/log" search={{ meal }}>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {items.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {items.map((l) => (
                    <li key={l.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.food_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(l.servings)}× {l.serving_label ?? "serving"} ·{" "}
                          {Math.round(Number(l.calories) * Number(l.servings))} kcal
                        </p>
                      </div>
                      <button
                        onClick={() => delMut.mutate(l.id)}
                        className="ml-2 rounded-full p-2 text-muted-foreground hover:bg-background hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MacroBar({ label, val, target, tone }: { label: string; val: number; target: number; tone: "protein" | "carbs" | "fat" }) {
  const pct = Math.min(100, (val / target) * 100);
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold">
        {Math.round(val)}
        <span className="text-xs font-normal text-muted-foreground">/{target}g</span>
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-background">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `var(--color-${tone})` }}
        />
      </div>
    </div>
  );
}
