import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Flame, Plus, Trash2, Droplets, Moon, Trophy, TrendingUp, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { calculateStreak, levelFromXp } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABEL: Record<(typeof MEAL_ORDER)[number], string> = {
  breakfast: "Frühstück",
  lunch: "Mittag",
  dinner: "Abendessen",
  snack: "Snacks",
};
const MEAL_EMOJI: Record<(typeof MEAL_ORDER)[number], string> = {
  breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function HomePage() {
  const qc = useQueryClient();
  const date = today();
  const sinceDate = subDays(new Date(), 13).toISOString().slice(0, 10);

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
        .from("food_logs").select("*")
        .eq("user_id", u.user.id).eq("logged_on", date)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const waterQ = useQuery({
    queryKey: ["water_logs", date],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("water_logs").select("*")
        .eq("user_id", u.user.id).eq("logged_on", date);
      return data ?? [];
    },
  });

  const sleepQ = useQuery({
    queryKey: ["sleep_logs", date],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("sleep_logs").select("*")
        .eq("user_id", u.user.id).eq("logged_on", date).maybeSingle();
      return data;
    },
  });

  const weekLogsQ = useQuery({
    queryKey: ["food_logs_week", sinceDate],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("food_logs").select("logged_on, calories, servings")
        .eq("user_id", u.user.id)
        .gte("logged_on", sinceDate);
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
      toast.success("Entfernt");
    },
  });

  const addWaterMut = useMutation({
    mutationFn: async (ml: number) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nicht angemeldet");
      const { error } = await supabase.from("water_logs").insert({
        user_id: u.user.id, amount_ml: ml, logged_on: date,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water_logs", date] }),
  });

  const logs = logsQ.data ?? [];
  const totals = logs.reduce(
    (a, l) => {
      const m = Number(l.servings);
      a.cal += Number(l.calories) * m;
      a.p += Number(l.protein_g) * m;
      a.c += Number(l.carbs_g) * m;
      a.f += Number(l.fat_g) * m;
      a.sug += Number(l.sugar_g ?? 0) * m;
      a.fib += Number(l.fiber_g ?? 0) * m;
      a.sod += Number(l.sodium_mg ?? 0) * m;
      return a;
    },
    { cal: 0, p: 0, c: 0, f: 0, sug: 0, fib: 0, sod: 0 },
  );

  const profile = profileQ.data;
  const calTarget = profile?.calorie_target ?? 2000;
  const pTarget = profile?.protein_g ?? 120;
  const cTarget = profile?.carbs_g ?? 220;
  const fTarget = profile?.fat_g ?? 65;
  const waterTarget = profile?.water_ml_target ?? 2500;
  const sleepTarget = Number(profile?.sleep_target_hours ?? 8);
  const sugarTarget = profile?.sugar_target_g ?? 50;
  const fiberTarget = profile?.fiber_target_g ?? 30;

  const waterTotal = (waterQ.data ?? []).reduce((a, w) => a + Number(w.amount_ml), 0);
  const sleepH = sleepQ.data ? Number(sleepQ.data.hours) : 0;

  const remaining = Math.max(0, calTarget - totals.cal);
  const pct = Math.min(100, (totals.cal / calTarget) * 100);

  // Streak & XP
  const weekLogs = weekLogsQ.data ?? [];
  const dates = Array.from(new Set(weekLogs.map((l) => l.logged_on)));
  const streak = calculateStreak(dates);
  const xp = streak * 10 + weekLogs.length * 2;
  const lvl = levelFromXp(xp);

  // Weekly bar chart data
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i).toISOString().slice(0, 10);
    const cal = weekLogs
      .filter((l) => l.logged_on === d)
      .reduce((a, l) => a + Number(l.calories) * Number(l.servings), 0);
    return { d, cal };
  });
  const maxWeek = Math.max(calTarget, ...weekDays.map((w) => w.cal), 100);

  const byMeal = MEAL_ORDER.map((m) => ({
    meal: m,
    items: logs.filter((l) => l.meal === m),
  }));

  const firstName = profile?.display_name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {format(new Date(), "EEEE, d. MMM", { locale: de })}
          </p>
          <h1 className="mt-1 text-4xl">
            Hey{firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
            <Flame className="h-3.5 w-3.5" />
            <span className="text-sm font-semibold">{streak}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
            <Trophy className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">Lv {lvl.level}</span>
          </div>
        </div>
      </motion.header>

      {/* Level bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full bg-gradient-to-r from-primary/60 to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(lvl.into / lvl.needed) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Big calorie card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-card to-secondary/40 p-6 shadow-soft">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Kalorien
              </p>
              <p className="mt-1 text-4xl font-semibold">
                <AnimatedNumber value={Math.round(totals.cal)} />
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  / {calTarget}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <Flame className="mr-1 inline h-3.5 w-3.5 text-primary" />
                {Math.round(remaining)} kcal übrig
              </p>
            </div>
            <ProgressRing pct={pct} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <MacroBar label="Protein" val={totals.p} target={pTarget} tone="protein" />
            <MacroBar label="Kohlenh." val={totals.c} target={cTarget} tone="carbs" />
            <MacroBar label="Fett" val={totals.f} target={fTarget} tone="fat" />
          </div>
        </Card>
      </motion.div>

      {/* Water & Sleep row */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <WaterCard total={waterTotal} target={waterTarget} onAdd={(ml) => addWaterMut.mutate(ml)} />
        <SleepCard hours={sleepH} target={sleepTarget} quality={sleepQ.data?.quality} />
      </div>

      {/* Micros */}
      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Mikronährstoffe & Details</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MicroBar label="Zucker" val={totals.sug} target={sugarTarget} suffix="g" warn />
          <MicroBar label="Ballast." val={totals.fib} target={fiberTarget} suffix="g" />
          <MicroBar label="Natrium" val={totals.sod} target={2300} suffix="mg" warn />
        </div>
      </Card>

      {/* Weekly trend */}
      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Letzte 7 Tage</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Ø {Math.round(weekDays.reduce((a, w) => a + w.cal, 0) / 7)} kcal
          </p>
        </div>
        <div className="flex h-24 items-end gap-1.5">
          {weekDays.map((w, i) => {
            const h = (w.cal / maxWeek) * 100;
            const over = w.cal > calTarget * 1.1;
            return (
              <div key={w.d} className="group flex flex-1 flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(3, h)}%` }}
                  transition={{ delay: 0.05 * i, duration: 0.5, ease: "easeOut" }}
                  className={`w-full rounded-t-md ${
                    over ? "bg-destructive/60" : w.cal === 0 ? "bg-border" : "bg-primary/70"
                  }`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {format(parseISO(w.d), "EE", { locale: de })[0]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-2xl">Mahlzeiten</h2>
        <Link to="/log">
          <Button size="sm" className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> Hinzufügen
          </Button>
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {byMeal.map(({ meal, items }, idx) => {
          const cal = items.reduce((a, l) => a + Number(l.calories) * Number(l.servings), 0);
          return (
            <motion.div
              key={meal}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
            >
              <Card className="rounded-2xl border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{MEAL_EMOJI[meal]}</span>
                    <div>
                      <p className="text-sm font-semibold">{MEAL_LABEL[meal]}</p>
                      <p className="text-xs text-muted-foreground">
                        {items.length === 0 ? "Noch nichts geloggt" : `${Math.round(cal)} kcal`}
                      </p>
                    </div>
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
                            {Number(l.servings)}× {l.serving_label ?? "Portion"} ·{" "}
                            {Math.round(Number(l.calories) * Number(l.servings))} kcal
                          </p>
                        </div>
                        <button
                          onClick={() => delMut.mutate(l.id)}
                          className="ml-2 rounded-full p-2 text-muted-foreground hover:bg-background hover:text-destructive"
                          aria-label="Entfernen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const c = 97.4;
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-secondary)" strokeWidth="4" />
        <motion.circle
          cx="18" cy="18" r="15.5" fill="none"
          stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct * c) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold">
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function MacroBar({ label, val, target, tone }: { label: string; val: number; target: number; tone: "protein" | "carbs" | "fat" }) {
  const pct = Math.min(100, (val / target) * 100);
  return (
    <div className="rounded-2xl bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold">
        {Math.round(val)}
        <span className="text-xs font-normal text-muted-foreground">/{target}g</span>
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: `var(--color-${tone})` }}
        />
      </div>
    </div>
  );
}

function MicroBar({ label, val, target, suffix, warn }: { label: string; val: number; target: number; suffix: string; warn?: boolean }) {
  const pct = Math.min(100, (val / target) * 100);
  const over = warn && val > target;
  return (
    <div className="rounded-xl bg-secondary/50 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${over ? "text-destructive" : ""}`}>
        {Math.round(val)}<span className="text-[10px] font-normal text-muted-foreground">/{target}{suffix}</span>
      </p>
      <div className="mt-1.5 h-1 rounded-full bg-background">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary/70"}`}
        />
      </div>
    </div>
  );
}

function WaterCard({ total, target, onAdd }: { total: number; target: number; onAdd: (ml: number) => void }) {
  const pct = Math.min(100, (total / target) * 100);
  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/60 p-4">
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-primary">
          <Droplets className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wide">Wasser</p>
        </div>
        <p className="mt-2 text-2xl font-semibold">
          {(total / 1000).toFixed(1)}<span className="text-xs font-normal text-muted-foreground">/{(target / 1000).toFixed(1)}L</span>
        </p>
        <div className="mt-3 flex gap-1.5">
          <button
            onClick={() => onAdd(250)}
            className="flex-1 rounded-full bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >+250</button>
          <button
            onClick={() => onAdd(500)}
            className="flex-1 rounded-full bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >+500</button>
        </div>
      </div>
      <motion.div
        className="absolute inset-x-0 bottom-0 bg-primary/10"
        initial={{ height: 0 }}
        animate={{ height: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </Card>
  );
}

function SleepCard({ hours, target, quality }: { hours: number; target: number; quality?: number | null }) {
  const pct = Math.min(100, (hours / target) * 100);
  return (
    <Link to="/sleep">
      <Card className="h-full rounded-2xl border-border/60 p-4 transition hover:border-primary/40">
        <div className="flex items-center gap-2 text-primary">
          <Moon className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wide">Schlaf</p>
        </div>
        <p className="mt-2 text-2xl font-semibold">
          {hours > 0 ? hours.toFixed(1) : "—"}
          <span className="text-xs font-normal text-muted-foreground">/{target}h</span>
        </p>
        {quality ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Qualität: {"★".repeat(quality)}{"☆".repeat(5 - quality)}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Tippen zum Loggen</p>
        )}
        <div className="mt-3 h-1.5 rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </Card>
    </Link>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {value}
    </motion.span>
  );
}
