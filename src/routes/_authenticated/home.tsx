import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Plus, Trash2, Sparkles, TrendingUp, Droplet, Minus } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useEffect, useMemo } from "react";

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
const MEAL_EMOJI: Record<(typeof MEAL_ORDER)[number], string> = {
  breakfast: "🌅",
  lunch: "🥗",
  dinner: "🍲",
  snack: "🍎",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 });
  const rounded = useTransform(spring, (v) =>
    decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
  );
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  return <motion.span>{rounded}</motion.span>;
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

  // Last 30 days of logs — for streak + trend sparkline
  const historyQ = useQuery({
    queryKey: ["food_logs_history_30"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const from = subDays(new Date(), 30).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("food_logs")
        .select("logged_on,calories,servings")
        .eq("user_id", u.user.id)
        .gte("logged_on", from);
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
      qc.invalidateQueries({ queryKey: ["food_logs_history_30"] });
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

  const { streak, last7 } = useMemo(() => {
    const rows = historyQ.data ?? [];
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const k = r.logged_on as string;
      byDay.set(k, (byDay.get(k) ?? 0) + Number(r.calories) * Number(r.servings));
    }
    // streak: consecutive days ending today with any logged calories
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = subDays(new Date(), i).toISOString().slice(0, 10);
      if ((byDay.get(d) ?? 0) > 0) s++;
      else break;
    }
    const l7 = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i).toISOString().slice(0, 10);
      return { day: d, cal: byDay.get(d) ?? 0 };
    });
    return { streak: s, last7: l7 };
  }, [historyQ.data]);

  const avg7 =
    last7.filter((d) => d.cal > 0).reduce((a, d) => a + d.cal, 0) /
    Math.max(1, last7.filter((d) => d.cal > 0).length);

  const byMeal = MEAL_ORDER.map((m) => ({
    meal: m,
    items: logs.filter((l) => l.meal === m),
  }));

  const R = 15.5;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="relative mx-auto max-w-md px-5 pt-8">
      {/* soft ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 20%, oklch(0.85 0.09 35 / .55), transparent 70%), radial-gradient(50% 50% at 80% 10%, oklch(0.88 0.07 80 / .45), transparent 70%)",
        }}
      />

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {format(new Date(), "EEEE, MMM d")}
        </p>
        <h1 className="mt-1 text-4xl">
          Hey{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
        </h1>
      </motion.header>

      {/* Streak strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5 }}
        className="mb-4 flex items-center gap-3"
      >
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
          <motion.span
            animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-lg"
          >
            🔥
          </motion.span>
          <span className="text-sm font-semibold">
            <AnimatedNumber value={streak} /> day{streak === 1 ? "" : "s"} streak
          </span>
        </div>
        {avg7 > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            avg <AnimatedNumber value={Math.round(avg7)} /> kcal
          </div>
        )}
      </motion.div>

      {/* Main ring card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="relative overflow-hidden rounded-3xl border-border/60 bg-card p-6 shadow-soft">
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--color-primary)" }}
          />
          <div className="relative flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Calories
              </p>
              <p className="mt-1 text-5xl font-semibold">
                <AnimatedNumber value={totals.cal} />
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  / {calTarget}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <Flame className="mr-1 inline h-3.5 w-3.5 text-primary" />
                <AnimatedNumber value={remaining} /> kcal remaining
              </p>
            </div>
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r={R} fill="none" stroke="var(--color-secondary)" strokeWidth="4" />
                <motion.circle
                  cx="18" cy="18" r={R} fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: CIRC - (pct / 100) * CIRC }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-sm font-semibold">
                <AnimatedNumber value={pct} />%
              </div>
            </div>
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <MacroBar label="Protein" val={totals.p} target={pTarget} tone="protein" delay={0.15} />
            <MacroBar label="Carbs" val={totals.c} target={cTarget} tone="carbs" delay={0.22} />
            <MacroBar label="Fat" val={totals.f} target={fTarget} tone="fat" delay={0.29} />
          </div>
        </Card>
      </motion.div>

      {/* 7-day sparkline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-4"
      >
        <Card className="rounded-3xl border-border/60 p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Last 7 days
              </p>
              <p className="text-sm font-medium">Daily intake</p>
            </div>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <Sparkline data={last7.map((d) => d.cal)} target={calTarget} />
        </Card>
      </motion.div>

      <WaterCard target={profile?.water_ml_target ?? 2500} />


      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-2xl">Meals</h2>
        <Link to="/log">
          <Button size="sm" className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> Add food
          </Button>
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {byMeal.map(({ meal, items }, idx) => {
          const cal = items.reduce((a, l) => a + Number(l.calories) * Number(l.servings), 0);
          return (
            <motion.div
              key={meal}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.06, duration: 0.45 }}
            >
              <Card className="overflow-hidden rounded-2xl border-border/60 p-4 transition-shadow hover:shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-lg">
                      {MEAL_EMOJI[meal]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{MEAL_LABEL[meal]}</p>
                      <p className="text-xs text-muted-foreground">
                        {items.length === 0
                          ? "Nothing logged yet"
                          : `${items.length} item${items.length > 1 ? "s" : ""} · ${Math.round(cal)} kcal`}
                      </p>
                    </div>
                  </div>
                  <Link to="/log" search={{ meal }}>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button size="icon" variant="ghost" className="rounded-full">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
                <AnimatePresence initial={false}>
                  {items.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {items.map((l) => (
                        <motion.li
                          key={l.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{l.food_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {Number(l.servings)}× {l.serving_label ?? "serving"} ·{" "}
                              {Math.round(Number(l.calories) * Number(l.servings))} kcal
                            </p>
                          </div>
                          <button
                            onClick={() => delMut.mutate(l.id)}
                            className="ml-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MacroBar({
  label, val, target, tone, delay = 0,
}: { label: string; val: number; target: number; tone: "protein" | "carbs" | "fat"; delay?: number }) {
  const pct = Math.min(100, (val / target) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="rounded-2xl bg-secondary/60 p-3"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold">
        <AnimatedNumber value={val} />
        <span className="text-xs font-normal text-muted-foreground">/{target}g</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: `var(--color-${tone})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  );
}

function Sparkline({ data, target }: { data: number[]; target: number }) {
  const W = 300;
  const H = 70;
  const max = Math.max(target * 1.1, ...data, 1);
  const step = W / (data.length - 1 || 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = H - (v / max) * H;
    return { x, y, v };
  });
  const path =
    points.length === 0
      ? ""
      : "M " +
        points
          .map((p, i) => {
            if (i === 0) return `${p.x},${p.y}`;
            const prev = points[i - 1];
            const cx = (prev.x + p.x) / 2;
            return `C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
          })
          .join(" ");
  const area = `${path} L ${W},${H} L 0,${H} Z`;
  const targetY = H - (target / max) * H;
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return format(d, "EEEEE");
  });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1="0" x2={W} y1={targetY} y2={targetY}
          stroke="var(--color-muted-foreground)"
          strokeDasharray="3 4"
          strokeOpacity="0.35"
        />
        <motion.path
          d={area}
          fill="url(#spark-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3.5 : 2}
            fill={i === points.length - 1 ? "var(--color-primary)" : "var(--color-card)"}
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.05 }}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {labels.map((l, i) => (
          <span key={i} className={i === labels.length - 1 ? "text-primary font-semibold" : ""}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function WaterCard({ target }: { target: number }) {
  const qc = useQueryClient();
  const date = today();
  const waterQ = useQuery({
    queryKey: ["water_logs", date],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("water_logs")
        .select("id,amount_ml,created_at")
        .eq("user_id", u.user.id)
        .eq("logged_on", date)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const total = (waterQ.data ?? []).reduce((a, w) => a + Number(w.amount_ml), 0);
  const pct = Math.min(100, (total / target) * 100);
  const glasses = Math.floor(total / 250);
  const targetGlasses = Math.max(1, Math.round(target / 250));

  const addMut = useMutation({
    mutationFn: async (ml: number) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (ml < 0) {
        // remove most recent entry
        const last = (waterQ.data ?? []).slice(-1)[0];
        if (!last) return;
        const { error } = await supabase.from("water_logs").delete().eq("id", last.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("water_logs").insert({
        user_id: u.user.id,
        amount_ml: ml,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water_logs", date] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.5 }}
      className="mt-4"
    >
      <Card className="relative overflow-hidden rounded-3xl border-border/60 p-5 shadow-soft">
        <div
          aria-hidden
          className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full opacity-30 blur-2xl"
          style={{ background: "oklch(0.75 0.10 220)" }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Hydration
            </p>
            <p className="mt-1 text-2xl font-semibold">
              <AnimatedNumber value={total} />
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {target} ml
              </span>
            </p>
          </div>
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-11 w-11 place-items-center rounded-2xl"
            style={{ background: "oklch(0.94 0.04 220)" }}
          >
            <Droplet className="h-5 w-5" style={{ color: "oklch(0.55 0.12 220)" }} />
          </motion.div>
        </div>

        {/* glasses row */}
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {Array.from({ length: targetGlasses }, (_, i) => {
            const filled = i < glasses;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="relative h-8 w-5 overflow-hidden rounded-b-md rounded-t-sm border border-border/60"
              >
                <motion.div
                  className="absolute inset-x-0 bottom-0"
                  initial={{ height: 0 }}
                  animate={{ height: filled ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: "oklch(0.72 0.11 220)" }}
                />
              </motion.div>
            );
          })}
        </div>

        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "oklch(0.65 0.13 220)" }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="relative mt-4 flex items-center gap-2">
          {[200, 250, 500].map((ml) => (
            <motion.button
              key={ml}
              whileTap={{ scale: 0.94 }}
              onClick={() => addMut.mutate(ml)}
              disabled={addMut.isPending}
              className="flex-1 rounded-full border border-primary/25 bg-primary/10 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15"
            >
              +{ml} ml
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => addMut.mutate(-1)}
            disabled={addMut.isPending || (waterQ.data ?? []).length === 0}
            className="rounded-full border border-border bg-background p-2 text-muted-foreground transition hover:bg-secondary disabled:opacity-40"
            aria-label="Undo last"
          >
            <Minus className="h-4 w-4" />
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
}

