import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/weight")({
  component: WeightPage,
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function WeightPage() {
  const qc = useQueryClient();
  const [weight, setWeight] = useState<string>("");

  const q = useQuery({
    queryKey: ["weight_entries"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", u.user.id)
        .order("logged_on", { ascending: true })
        .limit(180);
      return data ?? [];
    },
  });

  const mut = useMutation({
    mutationFn: async (kg: number) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("weight_entries")
        .upsert(
          { user_id: u.user.id, weight_kg: kg, logged_on: today() },
          { onConflict: "user_id,logged_on" },
        );
      if (error) throw error;
      // Also sync latest weight to profile
      await supabase.from("profiles").update({ weight_kg: kg }).eq("user_id", u.user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight_entries"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setWeight("");
      toast.success("Weight logged");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const entries = q.data ?? [];
  const latest = entries[entries.length - 1];
  const first = entries[0];
  const delta = latest && first ? Number(latest.weight_kg) - Number(first.weight_kg) : 0;

  // 7-day moving average
  const chartData = entries.map((e, i) => {
    const slice = entries.slice(Math.max(0, i - 6), i + 1);
    const avg = slice.reduce((a, x) => a + Number(x.weight_kg), 0) / slice.length;
    return {
      date: e.logged_on,
      weight: Number(e.weight_kg),
      avg: Math.round(avg * 10) / 10,
    };
  });

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-4xl">Weight</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track it daily — the moving average smooths day-to-day noise.
      </p>

      <Card className="mt-5 rounded-3xl border-border/60 p-6 shadow-soft">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Latest</p>
            <p className="mt-1 text-4xl font-semibold">
              {latest ? Number(latest.weight_kg).toFixed(1) : "—"}
              <span className="ml-1 text-base font-normal text-muted-foreground">kg</span>
            </p>
          </div>
          {latest && first && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Change</p>
              <p className={`mt-1 text-lg font-semibold ${delta > 0 ? "text-destructive" : "text-primary"}`}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
              </p>
            </div>
          )}
        </div>

        {chartData.length > 1 && (
          <div className="mt-5 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(parseISO(d), "MMM d")}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={(d) => format(parseISO(String(d)), "MMM d")}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Line
                  type="monotone" dataKey="weight" stroke="var(--color-muted-foreground)"
                  dot={{ r: 2 }} strokeWidth={1.5} strokeDasharray="3 3"
                />
                <Line
                  type="monotone" dataKey="avg" stroke="var(--color-primary)"
                  strokeWidth={2.5} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <Label>Log today's weight</Label>
        <div className="mt-2 flex gap-2">
          <Input
            type="number"
            step="0.1"
            placeholder="kg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-xl"
          />
          <Button
            disabled={!weight || mut.isPending}
            onClick={() => mut.mutate(parseFloat(weight))}
            className="rounded-full"
          >
            Save
          </Button>
        </div>
      </Card>

      <h2 className="mt-6 text-xl">History</h2>
      <div className="mt-2 space-y-1.5">
        {[...entries].reverse().slice(0, 30).map((e) => (
          <div key={e.id} className="flex justify-between rounded-xl bg-secondary/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">{format(parseISO(e.logged_on), "EEE, MMM d")}</span>
            <span className="font-medium">{Number(e.weight_kg).toFixed(1)} kg</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="rounded-xl bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
            No entries yet.
          </p>
        )}
      </div>
    </div>
  );
}
