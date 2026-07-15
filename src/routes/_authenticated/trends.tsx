import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Flame, Droplet, Scale, Footprints } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { subDays, format } from "date-fns";
import { de } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/trends")({
  component: TrendsPage,
});

type DayKey = string; // yyyy-mm-dd

function lastNDays(n: number): DayKey[] {
  const out: DayKey[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  return out;
}

function fmtDay(d: string) {
  return format(new Date(d), "EEE", { locale: de });
}

function TrendsPage() {
  const days30 = lastNDays(30);
  const days7 = lastNDays(7);
  const since30 = days30[0];

  const uid = useQuery({
    queryKey: ["uid"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
    staleTime: Infinity,
  });

  const foods = useQuery({
    queryKey: ["trends", "food", since30],
    enabled: !!uid.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("logged_on, servings, calories, protein_g, carbs_g, fat_g")
        .gte("logged_on", since30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const weights = useQuery({
    queryKey: ["trends", "weight"],
    enabled: !!uid.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_entries")
        .select("logged_on, weight_kg")
        .order("logged_on", { ascending: true })
        .limit(365);
      if (error) throw error;
      return data ?? [];
    },
  });

  const water = useQuery({
    queryKey: ["trends", "water", since30],
    enabled: !!uid.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("logged_on, amount_ml")
        .gte("logged_on", since30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const activity = useQuery({
    queryKey: ["trends", "activity", since30],
    enabled: !!uid.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("logged_on, steps, active_kcal")
        .gte("logged_on", since30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const profile = useQuery({
    queryKey: ["profile", "targets"],
    enabled: !!uid.data,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("calorie_target, protein_g, carbs_g, fat_g, water_ml_target, steps_target")
        .eq("user_id", uid.data!)
        .maybeSingle();
      return data;
    },
  });

  // Aggregations
  const calByDay = new Map<string, { kcal: number; p: number; c: number; f: number }>();
  days30.forEach((d) => calByDay.set(d, { kcal: 0, p: 0, c: 0, f: 0 }));
  (foods.data ?? []).forEach((r) => {
    const b = calByDay.get(r.logged_on);
    if (!b) return;
    const s = Number(r.servings);
    b.kcal += Number(r.calories) * s;
    b.p += Number(r.protein_g) * s;
    b.c += Number(r.carbs_g) * s;
    b.f += Number(r.fat_g) * s;
  });

  const waterByDay = new Map<string, number>();
  days30.forEach((d) => waterByDay.set(d, 0));
  (water.data ?? []).forEach((r) => {
    waterByDay.set(r.logged_on, (waterByDay.get(r.logged_on) ?? 0) + Number(r.amount_ml));
  });

  const stepsByDay = new Map<string, number>();
  days30.forEach((d) => stepsByDay.set(d, 0));
  (activity.data ?? []).forEach((r) => {
    stepsByDay.set(r.logged_on, (stepsByDay.get(r.logged_on) ?? 0) + Number(r.steps));
  });

  const caloriesData7 = days7.map((d) => ({
    day: fmtDay(d),
    kcal: Math.round(calByDay.get(d)?.kcal ?? 0),
    target: profile.data?.calorie_target ?? 0,
  }));

  const macrosData7 = days7.map((d) => {
    const b = calByDay.get(d)!;
    return {
      day: fmtDay(d),
      Protein: Math.round(b.p),
      Carbs: Math.round(b.c),
      Fat: Math.round(b.f),
    };
  });

  const waterData7 = days7.map((d) => ({
    day: fmtDay(d),
    ml: waterByDay.get(d) ?? 0,
    target: profile.data?.water_ml_target ?? 2500,
  }));

  const stepsData7 = days7.map((d) => ({
    day: fmtDay(d),
    steps: stepsByDay.get(d) ?? 0,
    target: profile.data?.steps_target ?? 8000,
  }));

  const weightData = (weights.data ?? []).map((w) => ({
    date: format(new Date(w.logged_on), "dd.MM"),
    kg: Number(w.weight_kg),
  }));

  // Weekly stats
  const kcals7 = caloriesData7.map((d) => d.kcal).filter((k) => k > 0);
  const avgKcal = kcals7.length ? Math.round(kcals7.reduce((a, b) => a + b, 0) / kcals7.length) : 0;
  const totalSteps7 = stepsData7.reduce((a, b) => a + b.steps, 0);
  const weightDelta = weightData.length >= 2
    ? +(weightData[weightData.length - 1].kg - weightData[0].kg).toFixed(1)
    : 0;

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <header className="mb-6 flex items-center gap-2">
        <Link
          to="/home"
          className="rounded-full p-2 hover:bg-secondary"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl">Trends</h1>
          <p className="text-xs text-muted-foreground">Letzte 7 & 30 Tage</p>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatTile
          icon={<Flame className="h-4 w-4" />}
          label="Ø kcal / Tag"
          value={avgKcal.toLocaleString("de-DE")}
        />
        <StatTile
          icon={<Footprints className="h-4 w-4" />}
          label="Schritte 7T"
          value={(totalSteps7 / 1000).toFixed(1) + "k"}
        />
        <StatTile
          icon={<Scale className="h-4 w-4" />}
          label="Gewicht Δ"
          value={weightDelta > 0 ? `+${weightDelta} kg` : `${weightDelta} kg`}
        />
      </div>

      <ChartCard icon={<Flame className="h-4 w-4" />} title="Kalorien — 7 Tage">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={caloriesData7} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="kcalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="kcal"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#kcalGrad)"
            />
            {profile.data?.calorie_target ? (
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                dot={false}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard icon={<TrendingUp className="h-4 w-4" />} title="Makros — 7 Tage (g)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={macrosData7} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="Protein" stackId="m" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Carbs" stackId="m" fill="hsl(var(--chart-2, 200 90% 60%))" />
            <Bar dataKey="Fat" stackId="m" fill="hsl(var(--chart-3, 40 90% 60%))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <Legend
          items={[
            { label: "Protein", color: "hsl(var(--primary))" },
            { label: "Carbs", color: "hsl(var(--chart-2, 200 90% 60%))" },
            { label: "Fat", color: "hsl(var(--chart-3, 40 90% 60%))" },
          ]}
        />
      </ChartCard>

      <ChartCard icon={<Scale className="h-4 w-4" />} title="Gewicht">
        {weightData.length === 0 ? (
          <EmptyMsg text="Noch keine Wiegungen. Erfasse dein Gewicht auf der Gewicht-Seite." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={<Droplet className="h-4 w-4" />} title="Wasser — 7 Tage (ml)">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={waterData7} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="ml" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard icon={<Footprints className="h-4 w-4" />} title="Schritte — 7 Tage">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stepsData7} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="steps" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

function ChartCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4 rounded-2xl border-border/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </Card>
  );
}

function StatTile({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/60 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}
