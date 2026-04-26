import { NavLink } from "react-router-dom";
import { Home, Map, CalendarHeart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/explore", label: "Explore", Icon: Map },
  { to: "/events", label: "Events", Icon: CalendarHeart },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-stretch border-t border-border bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
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