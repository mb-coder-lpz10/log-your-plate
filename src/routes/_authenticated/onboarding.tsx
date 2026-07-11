import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  ACTIVITY_LABELS,
  DIET_PREF_LABELS,
  GOAL_LABELS,
  calorieTarget,
  macroTargets,
  tdee,
  waterTargetMl,
  type ActivityLevel,
  type DietPref,
  type Goal,
  type Sex,
} from "@/lib/nutrition";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const TOTAL = 6;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sex, setSex] = useState<Sex>("female");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [training, setTraining] = useState(3);
  const [goal, setGoal] = useState<Goal>("maintain");
  const [rate, setRate] = useState(0.5);
  const [sleep, setSleep] = useState(8);
  const [sugarTarget, setSugarTarget] = useState(50);
  const [prefs, setPrefs] = useState<DietPref[]>([]);
  const [goalNote, setGoalNote] = useState("");
  const [busy, setBusy] = useState(false);

  const dailyTdee = Math.round(tdee(sex, weight, height, age, activity));
  const calories = calorieTarget(dailyTdee, goal, rate);
  const macros = macroTargets(calories, weight, goal);
  const water = waterTargetMl(weight, training);

  function togglePref(p: DietPref) {
    setPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function save() {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nicht angemeldet");
      const { error } = await supabase.from("profiles").update({
        age,
        sex,
        height_cm: height,
        weight_kg: weight,
        activity_level: activity,
        training_days_per_week: training,
        goal,
        target_rate_kg_per_week: rate,
        sleep_target_hours: sleep,
        sugar_target_g: sugarTarget,
        dietary_prefs: prefs,
        goal_note: goalNote || null,
        water_ml_target: water,
        calorie_target: calories,
        protein_g: macros.protein_g,
        carbs_g: macros.carbs_g,
        fat_g: macros.fat_g,
        onboarded: true,
      }).eq("user_id", u.user.id);
      if (error) throw error;

      await supabase.from("weight_entries").upsert({
        user_id: u.user.id,
        weight_kg: weight,
        logged_on: new Date().toISOString().slice(0, 10),
      }, { onConflict: "user_id,logged_on" });

      toast.success("Los geht's!");
      navigate({ to: "/home", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Konnte Profil nicht speichern");
    } finally {
      setBusy(false);
    }
  }

  const titles = [
    "Über dich",
    "Körperdaten",
    "Aktivität",
    "Dein Ziel",
    "Schlaf & Zucker",
    "Ernährung & Wunsch",
  ];

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <div className="mb-6">
        <div className="mb-3 flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: i < step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs uppercase tracking-widest text-primary">
          Schritt {step} von {TOTAL}
        </p>
        <h1 className="mt-1 text-4xl">{titles[step - 1]}</h1>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <Label>Geschlecht</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["female", "male"] as Sex[]).map((s) => (
                      <ChoiceBtn key={s} active={sex === s} onClick={() => setSex(s)}>
                        {s === "female" ? "Weiblich" : "Männlich"}
                      </ChoiceBtn>
                    ))}
                  </div>
                </div>
                <NumField label="Alter" value={age} setValue={setAge} suffix="Jahre" min={12} max={100} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <NumField label="Größe" value={height} setValue={setHeight} suffix="cm" min={100} max={230} />
                <NumField label="Gewicht" value={weight} setValue={setWeight} suffix="kg" min={30} max={300} step={0.1} />
                <div className="rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> BMI</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {(weight / (height / 100) ** 2).toFixed(1)}
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <Label>Alltagsaktivität</Label>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                      <ChoiceBtn key={k} active={activity === k} onClick={() => setActivity(k)}>
                        {ACTIVITY_LABELS[k]}
                      </ChoiceBtn>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Trainingstage pro Woche: <span className="font-semibold text-primary">{training}</span></Label>
                  <input
                    type="range"
                    min={0}
                    max={7}
                    value={training}
                    onChange={(e) => setTraining(parseInt(e.target.value))}
                    className="mt-3 w-full accent-[var(--color-primary)]"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <Label>Dein Ziel</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                      <ChoiceBtn key={g} active={goal === g} onClick={() => setGoal(g)}>
                        {GOAL_LABELS[g]}
                      </ChoiceBtn>
                    ))}
                  </div>
                </div>
                {goal !== "maintain" && (
                  <div>
                    <Label>Zielrate</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <Input
                        type="number" step="0.1" min="0.1" max="1.5"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value) || 0.5)}
                        className="rounded-xl"
                      />
                      <span className="text-sm text-muted-foreground">kg / Woche</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <Label>Ziel-Schlafdauer: <span className="font-semibold text-primary">{sleep} h</span></Label>
                  <input
                    type="range" min={5} max={10} step={0.5} value={sleep}
                    onChange={(e) => setSleep(parseFloat(e.target.value))}
                    className="mt-3 w-full accent-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <Label>Ziel-Zuckeraufnahme: <span className="font-semibold text-primary">{sugarTarget} g</span></Label>
                  <input
                    type="range" min={15} max={100} step={5} value={sugarTarget}
                    onChange={(e) => setSugarTarget(parseInt(e.target.value))}
                    className="mt-3 w-full accent-[var(--color-primary)]"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">WHO empfiehlt &lt; 25 g Zusatzzucker/Tag.</p>
                </div>
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Dein Wasserziel</p>
                  <p className="mt-1 text-2xl font-semibold">{(water / 1000).toFixed(1)} L</p>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <Label>Ernährungsvorlieben (optional)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(DIET_PREF_LABELS) as DietPref[]).map((p) => {
                      const active = prefs.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePref(p)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:bg-secondary"
                          }`}
                        >
                          {active && <Check className="mr-1 inline h-3 w-3" />}
                          {DIET_PREF_LABELS[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Was möchtest du erreichen? (optional)</Label>
                  <Input
                    value={goalNote}
                    onChange={(e) => setGoalNote(e.target.value)}
                    placeholder="z.B. fitter für den Sommer"
                    className="mt-2 rounded-xl"
                  />
                </div>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-2xl bg-gradient-to-br from-primary/15 to-secondary p-5"
                >
                  <p className="text-xs uppercase tracking-widest text-primary">Deine Tagesziele</p>
                  <p className="mt-1 text-4xl font-semibold">{calories} <span className="text-base font-normal text-muted-foreground">kcal</span></p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <MiniStat label="Protein" val={`${macros.protein_g}g`} tone="protein" />
                    <MiniStat label="Kohlenh." val={`${macros.carbs_g}g`} tone="carbs" />
                    <MiniStat label="Fett" val={`${macros.fat_g}g`} tone="fat" />
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="rounded-full">
              Zurück
            </Button>
          ) : <div />}
          {step < TOTAL ? (
            <Button onClick={() => setStep(step + 1)} className="rounded-full px-6">
              Weiter
            </Button>
          ) : (
            <Button onClick={save} disabled={busy} className="rounded-full px-6">
              {busy ? "Speichern…" : "Loslegen"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ChoiceBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function NumField({
  label, value, setValue, suffix, min, max, step = 1,
}: {
  label: string; value: number; setValue: (n: number) => void; suffix: string;
  min: number; max: number; step?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-1 rounded-xl border border-input bg-background px-3 py-2">
        <input
          type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent text-lg font-medium outline-none"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, val, tone }: { label: string; val: string; tone: "protein" | "carbs" | "fat" }) {
  return (
    <div className="rounded-xl bg-background/80 p-2 text-center">
      <div className="mx-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(--color-${tone})` }} />
      <p className="mt-1 text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{val}</p>
    </div>
  );
}
