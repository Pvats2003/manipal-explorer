import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Camera, CalendarHeart, CheckCircle2, GraduationCap, Heart, History, ListChecks, LogOut, Menu, Moon, Plus, Settings, Sparkles, Sun, User, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoginModal from "./LoginModal";
import NotificationsBell from "./NotificationsBell";

const NAV_LINKS = [
  { to: "/explore", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/trip-planner", label: "Planner" },
  { to: "/profile", label: "My Profile" },
];

export default function Navbar() {
  const { user, isAdmin, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const emoji = profile?.profile_emoji || "🌴";
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Explorer";

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="container flex h-16 items-center justify-between px-4 lg:h-18">
        <Link to="/" className="group flex items-baseline gap-2 font-display text-2xl font-bold leading-none transition-transform duration-300 hover:scale-[1.02]">
          <span className="text-secondary text-xl transition-transform duration-500 group-hover:rotate-[360deg]" aria-hidden>〰</span>
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Karavali</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/70 transition-all duration-300 hover:text-primary hover:bg-secondary/20 after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-0 after:bg-primary after:rounded-full after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-1/2"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {user && (
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success border border-success/20 transition-all duration-300 hover:bg-success/15">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
              </span>
              Synced
            </span>
          )}

          <NotificationsBell />

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="group relative overflow-hidden">
            <Moon className={`h-5 w-5 absolute transition-all duration-500 ${theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
            <Sun className={`h-5 w-5 transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"}`} />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-secondary/60 bg-card text-xl shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md hover:scale-105 active:scale-95"
                >
                  {emoji}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <div className="min-w-0">
                    <div className="truncate font-display font-semibold">{displayName}</div>
                    {profile?.batch_year && <div className="text-xs text-muted-foreground">Batch {profile.batch_year}</div>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/saved")}><Heart className="mr-2 h-4 w-4" /> My saved places</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bucket-list")}><ListChecks className="mr-2 h-4 w-4" /> Bucket list</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}><History className="mr-2 h-4 w-4" /> Search history</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/submit")}><Plus className="mr-2 h-4 w-4" /> Submit a place</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/events")}><CalendarHeart className="mr-2 h-4 w-4" /> Events</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/fresher-guide")}><GraduationCap className="mr-2 h-4 w-4" /> Fresher guide</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/photo-wall")}><Camera className="mr-2 h-4 w-4" /> Photo wall</DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}><Settings className="mr-2 h-4 w-4" /> Admin panel</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => navigate("/"))}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setLoginOpen(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Login
            </Button>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile editorial overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-primary text-primary-foreground page-fade-in lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-display text-2xl font-bold">
              <span className="text-secondary text-xl mr-1.5" aria-hidden>〰</span>Karavali
            </span>
            <button onClick={closeMobile} aria-label="Close menu" className="rounded-full p-2 hover:bg-white/10">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-6 pt-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={closeMobile}
                className="block border-b border-white/10 py-4 font-display text-3xl font-semibold tracking-tight hover:text-secondary"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={closeMobile} className="block border-b border-white/10 py-4 font-display text-3xl font-semibold tracking-tight hover:text-secondary">
                Admin
              </Link>
            )}
          </nav>
          <div className="px-6 pb-10 text-sm text-primary-foreground/70">
            <p className="font-display text-lg italic text-secondary">Coastal Karnataka, student-discovered.</p>
            <p className="mt-1">@karavali</p>
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
