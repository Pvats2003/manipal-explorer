import { NavLink } from "react-router-dom";
import { Map, Sparkles, ListChecks, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/recommendations", label: "Explore", Icon: Map },
  { to: "/trip-planner", label: "Planner", Icon: Sparkles },
  { to: "/bucket-list", label: "Bucket", Icon: ListChecks },
  { to: "/leaderboard", label: "Leaders", Icon: Trophy },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-stretch border-t border-border bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <Icon className="h-[22px] w-[22px]" />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}