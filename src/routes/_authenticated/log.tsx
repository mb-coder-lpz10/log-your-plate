import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  searchFoods,
  lookupBarcode,
  recognizeMeal,
  type FdcFood,
} from "@/lib/foods.functions";
import { SEED_FOODS } from "@/lib/foods";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, Zap, Loader2, ScanBarcode, Camera, Sparkles, Star, Clock, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
});

export const Route = createFileRoute("/_authenticated/log")({
  validateSearch: (s) => searchSchema.parse(s),
  component: LogPage,
});

type FoodItem = {
  name: string;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  fdc_id?: string;
};

function LogPage() {
  const { meal: initialMeal } = Route.useSearch();
  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">(
    initialMeal ?? "breakfast",
  );
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FdcFood[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await searchFoods({ data: { query: q } });
      setResults(res);
    } catch {
      toast.error("Search failed, showing local matches");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  const seedMatches = q
    ? SEED_FOODS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
    : SEED_FOODS.slice(0, 10);

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <button
          onClick={() => history.back()}
          className="rounded-full p-2 hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl">Log food</h1>
      </header>

      <div className="mb-4">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Meal</Label>
        <Select value={meal} onValueChange={(v) => setMeal(v as typeof meal)}>
          <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-4 rounded-full bg-secondary/70">
          <TabsTrigger value="search" className="rounded-full">
            <Search className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="barcode" className="rounded-full">
            <ScanBarcode className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="photo" className="rounded-full">
            <Camera className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="quick" className="rounded-full">
            <Zap className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <form onSubmit={runSearch} className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Lebensmittel suchen (z.B. Hähnchenbrust)"
              className="rounded-xl"
            />
            <Button type="submit" disabled={searching} className="rounded-full">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            {results !== null && results.length > 0 && (
              <>
                <SectionLabel icon={<Search className="h-3 w-3" />}>USDA Ergebnisse</SectionLabel>
                {results.map((f) => (
                  <FoodRow
                    key={f.fdcId}
                    item={{ ...f, fdc_id: f.fdcId }}
                    subtitle={f.brand}
                    onClick={() => setSelected({ ...f, fdc_id: f.fdcId })}
                    onQuickAdd={() => quickLog({ ...f, fdc_id: f.fdcId }, meal)}
                  />
                ))}
              </>
            )}

            {!q && <FavoritesAndRecents meal={meal} onPick={setSelected} />}

            {q && (
              <>
                <SectionLabel>Beliebte Lebensmittel</SectionLabel>
                {seedMatches.map((f) => (
                  <FoodRow
                    key={f.name}
                    item={f}
                    onClick={() => setSelected(f)}
                    onQuickAdd={() => quickLog(f, meal)}
                  />
                ))}
                {seedMatches.length === 0 && results?.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Keine Treffer. Nutze Quick-Add.
                  </p>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="barcode" className="mt-4">
          <BarcodeTab onFound={(f) => setSelected(f)} />
        </TabsContent>

        <TabsContent value="photo" className="mt-4">
          <PhotoTab onRecognized={(f) => setSelected(f)} />
        </TabsContent>

        <TabsContent value="quick" className="mt-4">
          <QuickAdd meal={meal} />
        </TabsContent>
      </Tabs>

      {selected && (
        <ServingDialog food={selected} meal={meal} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ---------- Barcode ----------
function BarcodeTab({ onFound }: { onFound: (f: FoodItem) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  useEffect(() => {
    if (!scanning || !supported) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        // @ts-expect-error - BarcodeDetector is a browser API
        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              setScanning(false);
              await handleCode(codes[0].rawValue);
              return;
            }
          } catch { /* ignore per-frame errors */ }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        toast.error("Kamera nicht verfügbar");
        setScanning(false);
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, supported]);

  async function handleCode(code: string) {
    setLoading(true);
    try {
      const food = await lookupBarcode({ data: { code } });
      if (!food) { toast.error(`Kein Produkt für ${code}`); return; }
      toast.success(`Gefunden: ${food.name}`);
      onFound({ ...food, fdc_id: food.fdcId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Nachschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {supported ? (
        scanning ? (
          <Card className="overflow-hidden rounded-2xl border-border/60 p-0">
            <video ref={videoRef} className="aspect-square w-full bg-black object-cover" muted playsInline />
            <div className="flex items-center justify-between p-3">
              <p className="text-xs text-muted-foreground">Barcode ins Bild halten…</p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setScanning(false)}>
                Stop
              </Button>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setScanning(true)} className="w-full rounded-full">
            <ScanBarcode className="mr-2 h-4 w-4" /> Kamera starten
          </Button>
        )
      ) : (
        <p className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          Live-Scan wird von diesem Browser nicht unterstützt. Nutze Chrome auf Android oder gib den Code manuell ein.
        </p>
      )}

      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Manuell eingeben</Label>
        <form
          className="mt-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) handleCode(manual.trim());
          }}
        >
          <Input
            inputMode="numeric"
            value={manual}
            onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
            placeholder="EAN / UPC (z.B. 4008400220222)"
            className="rounded-xl"
          />
          <Button type="submit" disabled={loading || !manual} className="rounded-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ---------- Photo ----------
function PhotoTab({ onRecognized }: { onRecognized: (f: FoodItem) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function fileToCompressedDataUrl(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1024;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPreview(dataUrl);
      const meal = await recognizeMeal({ data: { imageDataUrl: dataUrl } });
      toast.success(`Erkannt: ${meal.name}`);
      onRecognized({
        name: meal.name,
        serving_label: meal.serving_label,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        sugar_g: meal.sugar_g,
        fiber_g: meal.fiber_g,
        sodium_mg: meal.sodium_mg,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erkennung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {preview ? (
        <Card className="overflow-hidden rounded-2xl border-border/60 p-0">
          <img src={preview} alt="Mahlzeit" className="aspect-square w-full object-cover" />
        </Card>
      ) : (
        <Card className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          <div>
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary" />
            Foto aufnehmen — die KI schätzt Portion & Nährwerte
          </div>
        </Card>
      )}
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full rounded-full"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysiere…</>
        ) : (
          <><Camera className="mr-2 h-4 w-4" /> {preview ? "Neues Foto" : "Foto aufnehmen"}</>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Werte sind Schätzungen — überprüfe & passe die Portion an.
      </p>
    </div>
  );
}

function FoodRow({
  item, subtitle, onClick, onQuickAdd,
}: { item: FoodItem; subtitle?: string; onClick: () => void; onQuickAdd?: () => void }) {
  return (
    <div className="flex items-stretch gap-2">
      <button
        onClick={onClick}
        className="flex flex-1 items-center justify-between rounded-2xl border border-border/60 bg-card p-3 text-left transition hover:border-primary/40 hover:bg-secondary/40"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {subtitle ? `${subtitle} · ` : ""}{item.serving_label} · {Math.round(item.calories)} kcal
          </p>
        </div>
        <div className="ml-2 text-xs text-muted-foreground">
          P{Math.round(item.protein_g)} · C{Math.round(item.carbs_g)} · F{Math.round(item.fat_g)}
        </div>
      </button>
      {onQuickAdd && (
        <button
          onClick={onQuickAdd}
          aria-label="Sofort loggen"
          className="flex w-11 items-center justify-center rounded-2xl border border-border/60 bg-card text-primary transition hover:border-primary/40 hover:bg-primary/10"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
      {icon}{children}
    </p>
  );
}

async function quickLog(
  food: FoodItem,
  meal: "breakfast" | "lunch" | "dinner" | "snack",
) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) { toast.error("Nicht angemeldet"); return; }
  const { error } = await supabase.from("food_logs").insert({
    user_id: u.user.id,
    meal,
    food_name: food.name,
    servings: 1,
    serving_label: food.serving_label,
    calories: food.calories,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
    sugar_g: food.sugar_g ?? 0,
    fiber_g: food.fiber_g ?? 0,
    sodium_mg: food.sodium_mg ?? 0,
    fdc_id: food.fdc_id ?? null,
  });
  if (error) { toast.error(error.message); return; }
  toast.success(`${food.name} → ${meal}`);
}

function FavoritesAndRecents({
  meal, onPick,
}: { meal: "breakfast" | "lunch" | "dinner" | "snack"; onPick: (f: FoodItem) => void }) {
  const qc = useQueryClient();

  const favs = useQuery({
    queryKey: ["food_favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_favorites")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const recents = useQuery({
    queryKey: ["food_logs", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("food_name, serving_label, calories, protein_g, carbs_g, fat_g, sugar_g, fiber_g, sodium_mg, fdc_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const seen = new Set<string>();
      const out: FoodItem[] = [];
      for (const r of data ?? []) {
        const key = `${r.food_name}::${r.serving_label ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          name: r.food_name,
          serving_label: r.serving_label ?? "1 serving",
          calories: Number(r.calories),
          protein_g: Number(r.protein_g),
          carbs_g: Number(r.carbs_g),
          fat_g: Number(r.fat_g),
          sugar_g: Number(r.sugar_g ?? 0),
          fiber_g: Number(r.fiber_g ?? 0),
          sodium_mg: Number(r.sodium_mg ?? 0),
          fdc_id: r.fdc_id ?? undefined,
        });
        if (out.length >= 8) break;
      }
      return out;
    },
  });

  const handleQuick = async (f: FoodItem) => {
    await quickLog(f, meal);
    qc.invalidateQueries({ queryKey: ["food_logs"] });
  };

  const favItems: FoodItem[] = (favs.data ?? []).map((f) => ({
    name: f.food_name,
    serving_label: f.serving_label ?? "1 serving",
    calories: Number(f.calories),
    protein_g: Number(f.protein_g),
    carbs_g: Number(f.carbs_g),
    fat_g: Number(f.fat_g),
    sugar_g: Number(f.sugar_g),
    fiber_g: Number(f.fiber_g),
    sodium_mg: Number(f.sodium_mg),
    fdc_id: f.fdc_id ?? undefined,
  }));

  return (
    <>
      {favItems.length > 0 && (
        <>
          <SectionLabel icon={<Star className="h-3 w-3 fill-primary text-primary" />}>Favoriten</SectionLabel>
          {favItems.map((f) => (
            <FoodRow key={`fav-${f.name}`} item={f} onClick={() => onPick(f)} onQuickAdd={() => handleQuick(f)} />
          ))}
        </>
      )}

      {(recents.data ?? []).length > 0 && (
        <>
          <SectionLabel icon={<Clock className="h-3 w-3" />}>Zuletzt geloggt</SectionLabel>
          {(recents.data ?? []).map((f) => (
            <FoodRow key={`r-${f.name}-${f.serving_label}`} item={f} onClick={() => onPick(f)} onQuickAdd={() => handleQuick(f)} />
          ))}
        </>
      )}

      {favItems.length === 0 && (recents.data ?? []).length === 0 && !favs.isLoading && !recents.isLoading && (
        <>
          <SectionLabel>Beliebte Lebensmittel</SectionLabel>
          {SEED_FOODS.slice(0, 10).map((f) => (
            <FoodRow key={f.name} item={f} onClick={() => onPick(f)} onQuickAdd={() => handleQuick(f)} />
          ))}
        </>
      )}
    </>
  );
}

function ServingDialog({
  food, meal, onClose,
}: {
  food: FoodItem;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  onClose: () => void;
}) {
  const [servings, setServings] = useState(1);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const favQuery = useQuery({
    queryKey: ["food_favorites", "check", food.name, food.serving_label],
    queryFn: async () => {
      const { data } = await supabase
        .from("food_favorites")
        .select("id")
        .eq("food_name", food.name)
        .eq("serving_label", food.serving_label)
        .maybeSingle();
      return data?.id ?? null;
    },
  });
  const isFav = !!favQuery.data;

  const toggleFav = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (isFav && favQuery.data) {
        const { error } = await supabase.from("food_favorites").delete().eq("id", favQuery.data);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("food_favorites").insert({
        user_id: u.user.id,
        food_name: food.name,
        serving_label: food.serving_label,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        sugar_g: food.sugar_g ?? 0,
        fiber_g: food.fiber_g ?? 0,
        sodium_mg: food.sodium_mg ?? 0,
        fdc_id: food.fdc_id ?? null,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: (added) => {
      qc.invalidateQueries({ queryKey: ["food_favorites"] });
      favQuery.refetch();
      toast.success(added ? "Zu Favoriten hinzugefügt" : "Aus Favoriten entfernt");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Fehler"),
  });

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("food_logs").insert({
        user_id: u.user.id,
        meal,
        food_name: food.name,
        servings,
        serving_label: food.serving_label,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        sugar_g: food.sugar_g ?? 0,
        fiber_g: food.fiber_g ?? 0,
        sodium_mg: food.sodium_mg ?? 0,
        fdc_id: food.fdc_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food_logs"] });
      toast.success(`Added to ${meal}`);
      navigate({ to: "/home" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to log"),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-semibold">{food.name}</h3>
            <p className="text-xs text-muted-foreground">{food.serving_label}</p>
          </div>
          <button
            onClick={() => toggleFav.mutate()}
            disabled={toggleFav.isPending}
            aria-label={isFav ? "Aus Favoriten entfernen" : "Zu Favoriten"}
            className={cn(
              "rounded-full p-2 transition",
              isFav ? "text-primary" : "text-muted-foreground hover:text-primary",
            )}
          >
            <Star className={cn("h-5 w-5", isFav && "fill-primary")} />
          </button>
        </div>

        <div className="mt-5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Servings
          </Label>
          <div className="mt-2 flex items-center gap-3">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => setServings((s) => Math.max(0.25, Math.round((s - 0.5) * 4) / 4))}
            >−</Button>
            <Input
              type="number"
              step="0.25"
              min="0.25"
              value={servings}
              onChange={(e) => setServings(Math.max(0.25, parseFloat(e.target.value) || 1))}
              className="rounded-xl text-center text-lg font-semibold"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => setServings((s) => Math.round((s + 0.5) * 4) / 4)}
            >+</Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-secondary/60 p-4 text-center text-sm">
          <Stat label="kcal" val={Math.round(food.calories * servings)} />
          <Stat label="P" val={Math.round(food.protein_g * servings)} />
          <Stat label="C" val={Math.round(food.carbs_g * servings)} />
          <Stat label="F" val={Math.round(food.fat_g * servings)} />
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
          >
            {mut.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, val }: { label: string; val: number }) {
  return (
    <div>
      <p className="text-lg font-semibold">{val}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAdd({ meal }: { meal: "breakfast" | "lunch" | "dinner" | "snack" }) {
  const [name, setName] = useState("Quick entry");
  const [cal, setCal] = useState(0);
  const [p, setP] = useState(0);
  const [c, setC] = useState(0);
  const [f, setF] = useState(0);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("food_logs").insert({
        user_id: u.user.id,
        meal,
        food_name: name || "Quick entry",
        servings: 1,
        serving_label: "1 serving",
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food_logs"] });
      toast.success(`Added to ${meal}`);
      navigate({ to: "/home" });
    },
  });

  return (
    <Card className="rounded-2xl border-border/60 p-5">
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <NumInput label="kcal" v={cal} set={setCal} />
          <NumInput label="Protein" v={p} set={setP} />
          <NumInput label="Carbs" v={c} set={setC} />
          <NumInput label="Fat" v={f} set={setF} />
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="mt-2 w-full rounded-full">
          Add to {meal}
        </Button>
      </div>
    </Card>
  );
}

function NumInput({ label, v, set }: { label: string; v: number; set: (n: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min="0"
        value={v}
        onChange={(e) => set(parseFloat(e.target.value) || 0)}
        className="mt-1 rounded-xl"
      />
    </div>
  );
}
