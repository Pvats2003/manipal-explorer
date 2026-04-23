import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Camera, CalendarHeart, CheckCircle2, GraduationCap, Heart, History, ListChecks, LogOut, Menu, Moon, Plus, Settings, Sparkles, Sun, User, Wallet, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoginModal from "./LoginModal";

const NAV_LINKS = [
  { to: "/recommendations", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/submit", label: "Submit" },
  { to: "/trip-planner", label: "Planner" },
  { to: "/bucket-list", label: "Bucket List" },
  { to: "/trip-tracker", label: "Tracker" },
  { to: "/fresher-guide", label: "Fresher Guide" },
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
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-1.5 font-display text-2xl font-bold leading-none">
          <span className="text-secondary text-xl" aria-hidden>〰</span>
          <span className="text-primary">Karavali</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.slice(0, 5).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-smooth hover:text-primary hover:bg-secondary/30"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {user && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
              <CheckCircle2 className="h-3 w-3" /> Sync enabled
            </span>
          )}

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-secondary bg-card text-xl transition-smooth hover:border-primary"
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
                <DropdownMenuItem onClick={() => navigate("/saved")}><User className="mr-2 h-4 w-4" /> My profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/saved")}><Heart className="mr-2 h-4 w-4" /> My saved places</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/trip-tracker")}><Wallet className="mr-2 h-4 w-4" /> My trips</DropdownMenuItem>
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
