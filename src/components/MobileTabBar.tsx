import { NavLink, useNavigate } from "react-router-dom";
import { Home, Map, Plus, CalendarHeart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/explore", label: "Explore", Icon: Map },
  { to: "/events", label: "Events", Icon: CalendarHeart },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function MobileTabBar() {
  const navigate = useNavigate();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[64px] items-stretch border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {TABS.slice(0, 2).map(({ to, label, Icon, end }) => (
        <Tab key={to} to={to} label={label} Icon={Icon} end={end} />
      ))}

      {/* Center Add */}
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={() => navigate("/submit")}
          aria-label="Add a place"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground shadow-glow transition-smooth active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      {TABS.slice(2).map(({ to, label, Icon, end }) => (
        <Tab key={to} to={to} label={label} Icon={Icon} end={end} />
      ))}
    </nav>
  );
}

function Tab({ to, label, Icon, end }: { to: string; label: string; Icon: any; end?: boolean }) {
  return (
    <NavLink
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
  );
}
