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
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[68px] items-stretch border-t border-border/40 bg-background/90 backdrop-blur-xl md:hidden"
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
              "group relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-300",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground/80",
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn(
                "absolute -top-px left-1/2 h-0.5 w-0 rounded-full bg-primary transition-all duration-300 -translate-x-1/2",
                isActive && "w-8"
              )} />
              <span className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                isActive ? "bg-primary/10 scale-105" : "group-active:scale-90"
              )}>
                <Icon className={cn(
                  "h-[22px] w-[22px] transition-transform duration-300",
                  isActive && "scale-110"
                )} />
              </span>
              <span className={cn(
                "text-[10px] font-semibold leading-none transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
