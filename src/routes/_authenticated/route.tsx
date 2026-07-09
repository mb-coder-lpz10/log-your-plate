import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, PlusCircle, TrendingUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedShell,
});

function AuthedShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  // Gate onboarding: redirect to /onboarding until profile is completed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (cancelled) return;
      const onboarded = profile?.onboarded === true;
      const path = location.pathname;
      if (!onboarded && path !== "/onboarding") {
        navigate({ to: "/onboarding", replace: true });
      } else if (onboarded && path === "/onboarding") {
        navigate({ to: "/home", replace: true });
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  const showNav = checked && location.pathname !== "/onboarding";

  return (
    <div className="min-h-screen bg-background pb-24">
      <Outlet />
      {showNav ? <BottomNav /> : null}
    </div>
  );
}

const TABS = [
  { to: "/home", label: "Today", icon: Home },
  { to: "/log", label: "Log", icon: PlusCircle },
  { to: "/weight", label: "Weight", icon: TrendingUp },
  { to: "/settings", label: "Me", icon: Settings },
] as const;

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className="group relative flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-x-3 inset-y-1 -z-10 rounded-2xl bg-primary/10"
                  />
                )}
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <tab.icon
                    className={cn("h-5 w-5", isActive && "text-primary")}
                  />
                </motion.div>
                <span className={cn("font-medium", isActive && "text-primary")}>
                  {tab.label}
                </span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
