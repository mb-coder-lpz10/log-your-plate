import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Moon, Star } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { de } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/sleep")({
  component: SleepPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function SleepPage() {
  const qc = useQueryClient();
  const [hours, setHours] = useState(8);
  const [quality, setQuality] = useState(4);
  const [note, setNote] = useState("");

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("sleep_target_hours").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const listQ = useQuery({
    queryKey: ["sleep_logs_all"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const since = subDays(new Date(), 29).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("sleep_logs").select("*")
        .eq("user_id", u.user.id)
        .gte("logged_on", since)
        .order("logged_on", { ascending: true });
      return data ?? [];
    },
  });

  const todayEntry = (listQ.data ?? []).find((s) => s.logged_on === today());

  useEffect(() => {
    if (todayEntry) {
      setHours(Number(todayEntry.hours));
      setQuality(todayEntry.quality ?? 4);
      setNote(todayEntry.note ?? "");
    }
  }, [todayEntry]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nicht angemeldet");
      const { error } = await supabase.from("sleep_logs").upsert({
        user_id: u.user.id,
        logged_on: today(),
        hours,
        quality,
        note: note || null,
      }, { onConflict: "user_id,logged_on" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sleep_logs"] });
      qc.invalidateQueries({ queryKey: ["sleep_logs_all"] });
      toast.success("Schlaf gespeichert");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Fehler"),
  });

  const entries = listQ.data ?? [];
  const target = Number(profileQ.data?.sleep_target_hours ?? 8);
  const avg = entries.length
    ? entries.reduce((a, e) => a + Number(e.hours), 0) / entries.length
    : 0;
  const avgQ = entries.filter((e) => e.quality).length
    ? entries.reduce((a, e) => a + (e.quality ?? 0), 0) / entries.filter((e) => e.quality).length
    : 0;

  // last 14 days
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i).toISOString().slice(0, 10);
    const e = entries.find((x) => x.logged_on === d);
    return { d, hours: e ? Number(e.hours) : 0 };
  });
  const max = Math.max(target + 1, ...days.map((x) => x.hours));

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <div className="flex items-center gap-2">
        <Moon className="h-5 w-5 text-primary" />
        <h1 className="text-4xl">Schlaf</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ziel: {target} h — track deine Nachtruhe und Qualität.
      </p>

      <Card className="mt-5 rounded-3xl border-border/60 p-6 shadow-soft">
        <Label>Wie lange hast du geschlafen?</Label>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-5xl font-semibold">{hours.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">Stunden</span>
        </div>
        <input
          type="range" min={0} max={12} step={0.25}
          value={hours}
          onChange={(e) => setHours(parseFloat(e.target.value))}
          className="mt-3 w-full accent-[var(--color-primary)]"
        />

        <div className="mt-6">
          <Label>Qualität</Label>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuality(n)}
                className="p-1"
                aria-label={`${n} Sterne`}
              >
                <Star
                  className={`h-8 w-8 transition ${n <= quality ? "fill-primary text-primary" : "text-border"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Label>Notiz (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z.B. Bin oft aufgewacht"
            className="mt-2 rounded-xl"
            rows={2}
          />
        </div>

        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="mt-5 w-full rounded-full"
        >
          {saveMut.isPending ? "Speichern…" : todayEntry ? "Aktualisieren" : "Speichern"}
        </Button>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card className="rounded-2xl border-border/60 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Ø Schlaf 30T</p>
          <p className="mt-1 text-2xl font-semibold">{avg.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">h</span></p>
        </Card>
        <Card className="rounded-2xl border-border/60 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Ø Qualität</p>
          <p className="mt-1 text-2xl font-semibold">{avgQ ? avgQ.toFixed(1) : "—"}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
        </Card>
      </div>

      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <p className="text-sm font-semibold">Letzte 14 Tage</p>
        <div className="mt-4 flex h-32 items-end gap-1">
          {days.map((x, i) => {
            const h = (x.hours / max) * 100;
            const good = x.hours >= target;
            return (
              <div key={x.d} className="flex flex-1 flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(2, h)}%` }}
                  transition={{ delay: 0.03 * i, duration: 0.5 }}
                  className={`w-full rounded-t-md ${
                    x.hours === 0 ? "bg-border" : good ? "bg-primary/80" : "bg-primary/40"
                  }`}
                />
                <span className="text-[9px] text-muted-foreground">
                  {format(parseISO(x.d), "d")}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 h-px bg-border" />
        <p className="mt-3 text-xs text-muted-foreground">
          Zielline bei {target}h. Volle Balken = Ziel erreicht.
        </p>
      </Card>
    </div>
  );
}
