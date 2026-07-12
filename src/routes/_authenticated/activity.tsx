import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Footprints, Flame, Timer, Upload, Info, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { parseActivityCsv } from "@/lib/activity-import";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function ActivityPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const since = subDays(new Date(), 29).toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: todayISO(), steps: "", kcal: "", minutes: "", note: "",
  });

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles")
        .select("steps_target").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const logsQ = useQuery({
    queryKey: ["activity_logs", since],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("activity_logs")
        .select("*").eq("user_id", u.user.id)
        .gte("logged_on", since).order("logged_on", { ascending: false });
      return data ?? [];
    },
  });

  const upsertMut = useMutation({
    mutationFn: async (rows: Array<{
      logged_on: string; steps: number; active_kcal: number;
      exercise_min: number; distance_m: number; source: string; note?: string;
    }>) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nicht angemeldet");
      const payload = rows.map((r) => ({ ...r, user_id: u.user!.id }));
      const { error } = await supabase.from("activity_logs")
        .upsert(payload as never, { onConflict: "user_id,logged_on" });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["activity_logs", since] });
      qc.invalidateQueries({ queryKey: ["activity_today"] });
      toast.success(`${count} Eintrag${count === 1 ? "" : "e"} gespeichert`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activity_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity_logs", since] });
      qc.invalidateQueries({ queryKey: ["activity_today"] });
    },
  });

  const target = profileQ.data?.steps_target ?? 8000;
  const logs = logsQ.data ?? [];
  const today = logs.find((l) => l.logged_on === todayISO());
  const last7 = logs.filter((l) => l.logged_on >= subDays(new Date(), 6).toISOString().slice(0, 10));
  const avgSteps = last7.length ? Math.round(last7.reduce((a, l) => a + l.steps, 0) / 7) : 0;
  const totalKcal = last7.reduce((a, l) => a + Number(l.active_kcal), 0);

  // 14-day chart
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i).toISOString().slice(0, 10);
    const row = logs.find((l) => l.logged_on === d);
    return { d, steps: row?.steps ?? 0 };
  });
  const maxSteps = Math.max(target, ...days.map((x) => x.steps), 1);

  async function onFile(f: File) {
    const text = await f.text();
    const rows = parseActivityCsv(text);
    if (!rows.length) {
      toast.error("Keine Zeilen erkannt. Erwartet: Datum + Schritte/Kalorien/Minuten Spalten.");
      return;
    }
    upsertMut.mutate(rows);
  }

  function submitManual() {
    const steps = Number(form.steps) || 0;
    const kcal = Number(form.kcal) || 0;
    const mins = Number(form.minutes) || 0;
    if (!steps && !kcal && !mins) {
      toast.error("Bitte mindestens einen Wert eingeben");
      return;
    }
    upsertMut.mutate([{
      logged_on: form.date, steps, active_kcal: kcal,
      exercise_min: mins, distance_m: 0, source: "manual",
      note: form.note || undefined,
    }]);
    setForm({ ...form, steps: "", kcal: "", minutes: "", note: "" });
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/home"><Button size="icon" variant="ghost"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Bewegung</p>
          <h1 className="text-3xl">Aktivität</h1>
        </div>
      </div>

      {/* Today ring */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-card to-secondary/40 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Heute</p>
              <p className="mt-1 text-4xl font-semibold">
                {today?.steps.toLocaleString("de-DE") ?? "0"}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  / {target.toLocaleString("de-DE")}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Schritte</p>
            </div>
            <StepRing pct={Math.min(100, ((today?.steps ?? 0) / target) * 100)} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat icon={<Flame className="h-4 w-4" />} label="Aktive kcal" val={Math.round(Number(today?.active_kcal ?? 0))} />
            <Stat icon={<Timer className="h-4 w-4" />} label="Aktivmin." val={today?.exercise_min ?? 0} />
            <Stat icon={<Footprints className="h-4 w-4" />} label="Ø 7 Tage" val={avgSteps.toLocaleString("de-DE")} />
          </div>
        </Card>
      </motion.div>

      {/* Chart */}
      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Letzte 14 Tage</p>
          <p className="text-xs text-muted-foreground">Σ {Math.round(totalKcal)} kcal (7T)</p>
        </div>
        <div className="flex h-24 items-end gap-1">
          {days.map((x, i) => {
            const h = (x.steps / maxSteps) * 100;
            const hit = x.steps >= target;
            return (
              <div key={x.d} className="flex flex-1 flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(3, h)}%` }}
                  transition={{ delay: 0.03 * i, duration: 0.45 }}
                  className={`w-full rounded-t-md ${
                    x.steps === 0 ? "bg-border" : hit ? "bg-primary" : "bg-primary/50"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Manual entry */}
      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <p className="mb-3 text-sm font-semibold">Manuell eintragen</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="d" className="text-xs">Datum</Label>
            <Input id="d" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="s" className="text-xs">Schritte</Label>
            <Input id="s" inputMode="numeric" placeholder="8500"
              value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="k" className="text-xs">Aktive kcal</Label>
            <Input id="k" inputMode="numeric" placeholder="320"
              value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="m" className="text-xs">Aktivmin.</Label>
            <Input id="m" inputMode="numeric" placeholder="45"
              value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
          </div>
        </div>
        <Input className="mt-3" placeholder="Notiz (optional)"
          value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <Button className="mt-3 w-full rounded-full" onClick={submitManual}
          disabled={upsertMut.isPending}>Speichern</Button>
      </Card>

      {/* CSV import */}
      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <div className="mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">CSV-Import</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Google Fit („Daily Aggregations.csv" aus Google Takeout) oder
          Samsung Health („step_daily_trend.csv"). Bestehende Tage werden überschrieben.
        </p>
        <input
          ref={fileRef} type="file" accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
        />
        <Button variant="secondary" className="mt-3 w-full rounded-full"
          onClick={() => fileRef.current?.click()}>
          CSV auswählen
        </Button>
        <div className="mt-3 flex gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Google Fit: <b>takeout.google.com</b> → Fit → Daily Aggregations.
            Samsung Health: In-App-Export → Ordner „samsunghealth_…" → step_daily_trend.
          </span>
        </div>
      </Card>

      {/* Recent list */}
      {logs.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-xl">Verlauf</h2>
          <div className="space-y-2">
            {logs.slice(0, 14).map((l) => (
              <Card key={l.id} className="flex items-center justify-between rounded-2xl border-border/60 p-3">
                <div>
                  <p className="text-sm font-semibold">
                    {format(parseISO(l.logged_on), "EEE, d. MMM", { locale: de })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {l.steps.toLocaleString("de-DE")} Schritte · {Math.round(Number(l.active_kcal))} kcal · {l.exercise_min} min
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase">
                      {l.source}
                    </span>
                  </p>
                </div>
                <button onClick={() => delMut.mutate(l.id)}
                  className="rounded-full p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, val }: { icon: React.ReactNode; label: string; val: number | string }) {
  return (
    <div className="rounded-2xl bg-background/70 p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold">{val}</p>
    </div>
  );
}

function StepRing({ pct }: { pct: number }) {
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
