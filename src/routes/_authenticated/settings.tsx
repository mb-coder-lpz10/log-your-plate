import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const [cal, setCal] = useState(2000);
  const [p, setP] = useState(120);
  const [c, setC] = useState(220);
  const [f, setF] = useState(65);

  useEffect(() => {
    if (profileQ.data) {
      setCal(profileQ.data.calorie_target ?? 2000);
      setP(profileQ.data.protein_g ?? 120);
      setC(profileQ.data.carbs_g ?? 220);
      setF(profileQ.data.fat_g ?? 65);
    }
  }, [profileQ.data]);

  async function save() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({
      calorie_target: cal, protein_g: p, carbs_g: c, fat_g: f,
    }).eq("user_id", u.user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Targets updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const profile = profileQ.data;

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-4xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Adjust your daily targets or sign out.
      </p>

      <Card className="mt-5 rounded-2xl border-border/60 p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
        <p className="mt-1 text-sm font-medium">{profile?.display_name ?? "—"}</p>
      </Card>

      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <h2 className="text-lg font-semibold">Daily targets</h2>
        <div className="mt-3 space-y-3">
          <Row label="Calories (kcal)" v={cal} set={setCal} />
          <Row label="Protein (g)" v={p} set={setP} />
          <Row label="Carbs (g)" v={c} set={setC} />
          <Row label="Fat (g)" v={f} set={setF} />
        </div>
        <Button onClick={save} className="mt-4 w-full rounded-full">Save targets</Button>
      </Card>

      <Card className="mt-4 rounded-2xl border-border/60 p-5">
        <button
          onClick={() => navigate({ to: "/onboarding" })}
          className="w-full text-left text-sm font-medium text-primary hover:underline"
        >
          Re-run onboarding
        </button>
      </Card>

      <Button
        onClick={signOut}
        variant="outline"
        className="mt-4 w-full rounded-full"
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

function Row({ label, v, set }: { label: string; v: number; set: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        min="0"
        value={v}
        onChange={(e) => set(parseInt(e.target.value) || 0)}
        className="w-28 rounded-xl text-right"
      />
    </div>
  );
}
