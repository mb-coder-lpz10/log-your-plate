import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  calorieTarget,
  macroTargets,
  tdee,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/nutrition";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sex, setSex] = useState<Sex>("female");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [rate, setRate] = useState(0.5);
  const [busy, setBusy] = useState(false);

  const dailyTdee = Math.round(tdee(sex, weight, height, age, activity));
  const calories = calorieTarget(dailyTdee, goal, rate);
  const macros = macroTargets(calories, weight, goal);

  async function save() {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update({
        age,
        sex,
        height_cm: height,
        weight_kg: weight,
        activity_level: activity,
        goal,
        target_rate_kg_per_week: rate,
        calorie_target: calories,
        protein_g: macros.protein_g,
        carbs_g: macros.carbs_g,
        fat_g: macros.fat_g,
        onboarded: true,
      }).eq("user_id", u.user.id);
      if (error) throw error;

      // Seed initial weight entry
      await supabase.from("weight_entries").upsert({
        user_id: u.user.id,
        weight_kg: weight,
        logged_on: new Date().toISOString().slice(0, 10),
      }, { onConflict: "user_id,logged_on" });

      toast.success("You're all set!");
      navigate({ to: "/home", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-primary">
          Step {step} of 3
        </p>
        <h1 className="mt-1 text-4xl">
          {step === 1 && "About you"}
          {step === 2 && "Your lifestyle"}
          {step === 3 && "Your targets"}
        </h1>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-soft">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label>Sex</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["female", "male"] as Sex[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition ${
                      sex === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Age" value={age} setValue={setAge} suffix="yr" min={12} max={100} />
              <NumField label="Height" value={height} setValue={setHeight} suffix="cm" min={100} max={230} />
              <NumField label="Weight" value={weight} setValue={setWeight} suffix="kg" min={30} max={300} step={0.1} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label>Activity level</Label>
              <Select value={activity} onValueChange={(v) => setActivity(v as ActivityLevel)}>
                <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                    <SelectItem key={k} value={k}>{ACTIVITY_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Goal</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      goal === g
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {GOAL_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
            {goal !== "maintain" && (
              <div>
                <Label>Target rate</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1.5"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0.5)}
                    className="rounded-xl"
                  />
                  <span className="text-sm text-muted-foreground">kg / week</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on Mifflin–St Jeor. You can adjust these anytime in settings.
            </p>
            <div className="rounded-2xl bg-secondary p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Daily calories
              </p>
              <p className="mt-1 text-5xl font-semibold">{calories}</p>
              <p className="text-sm text-muted-foreground">kcal per day</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <MacroBox label="Protein" val={macros.protein_g} tone="protein" />
              <MacroBox label="Carbs" val={macros.carbs_g} tone="carbs" />
              <MacroBox label="Fat" val={macros.fat_g} tone="fat" />
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="rounded-full">
              Back
            </Button>
          ) : <div />}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="rounded-full px-6">
              Continue
            </Button>
          ) : (
            <Button onClick={save} disabled={busy} className="rounded-full px-6">
              {busy ? "Saving…" : "Start tracking"}
            </Button>
          )}
        </div>
      </Card>
    </div>
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
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent text-lg font-medium outline-none"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function MacroBox({ label, val, tone }: { label: string; val: number; tone: "protein" | "carbs" | "fat" }) {
  return (
    <div className="rounded-2xl bg-secondary/60 py-4">
      <div className="mx-auto h-2 w-2 rounded-full" style={{ backgroundColor: `var(--color-${tone})` }} />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{val}<span className="ml-0.5 text-xs font-normal text-muted-foreground">g</span></p>
    </div>
  );
}
