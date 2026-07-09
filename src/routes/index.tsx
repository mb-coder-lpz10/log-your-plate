import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Flame, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">NutriLog</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" className="rounded-full">Sign in</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:pt-16">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Your warm nutrition companion
            </p>
            <h1 className="mt-3 text-5xl leading-[1.05] sm:text-6xl">
              Eat with intention.
              <br />
              <span className="italic text-primary">Track with ease.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              NutriLog is a calm, modern food journal. Log a meal in two taps, watch your
              macros, and build the habit — no more spreadsheets, no more guilt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="rounded-full px-6">
                  Start tracking free
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-full px-6">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-secondary p-8 shadow-soft">
              <div className="rounded-2xl bg-card p-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Today
                    </p>
                    <p className="mt-1 text-4xl font-semibold">1,620<span className="text-lg font-normal text-muted-foreground"> / 2,100 kcal</span></p>
                  </div>
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                  <Macro name="Protein" val="112 g" tone="protein" />
                  <Macro name="Carbs" val="180 g" tone="carbs" />
                  <Macro name="Fat" val="52 g" tone="fat" />
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Weight trend</p>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <svg viewBox="0 0 200 60" className="mt-3 w-full">
                  <polyline
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points="0,45 30,42 60,38 90,35 120,32 150,28 180,25 200,22"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Macro({ name, val, tone }: { name: string; val: string; tone: "protein" | "carbs" | "fat" }) {
  return (
    <div className="rounded-xl bg-secondary/60 py-3">
      <div className={`mx-auto h-2 w-2 rounded-full`} style={{ backgroundColor: `var(--color-${tone})` }} />
      <p className="mt-2 text-xs text-muted-foreground">{name}</p>
      <p className="text-sm font-semibold">{val}</p>
    </div>
  );
}
