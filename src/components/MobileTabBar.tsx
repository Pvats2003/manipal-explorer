import { NavLink } from "react-router-dom";
import { Home, Compass, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/explore", label: "Explore", Icon: Compass },
  { to: "/trips", label: "Trips", Icon: Bookmark },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[64px] items-stretch border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {TABS.map(({ to, label, Icon, end }) => (
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
