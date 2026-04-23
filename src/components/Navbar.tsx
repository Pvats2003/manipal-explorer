import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Camera, CalendarHeart, CheckCircle2, Compass, GraduationCap, Heart, History, ListChecks, LogOut, Moon, Plus, Settings, Sparkles, Sun, User, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const { user, isAdmin, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  const emoji = profile?.profile_emoji || "🌴";
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Explorer";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">Manipal Hidden Spots</span>
          <span className="sm:hidden">MHS</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/events" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm"><CalendarHeart className="mr-1.5 h-4 w-4" /> Events</Button>
          </Link>
          <Link to="/submit" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm"><Plus className="mr-1.5 h-4 w-4" /> Submit</Button>
          </Link>
          <Link to="/trip-planner" className="hidden lg:inline-flex">
            <Button variant="ghost" size="sm"><Sparkles className="mr-1.5 h-4 w-4" /> Planner</Button>
          </Link>
          <Link to="/bucket-list" className="hidden lg:inline-flex">
            <Button variant="ghost" size="sm"><ListChecks className="mr-1.5 h-4 w-4" /> Bucket List</Button>
          </Link>
          <Link to="/trip-tracker" className="hidden lg:inline-flex">
            <Button variant="ghost" size="sm"><Wallet className="mr-1.5 h-4 w-4" /> Tracker</Button>
          </Link>

          {user && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-card text-xl transition-smooth hover:border-primary hover:scale-105"
                >
                  {emoji}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{displayName}</div>
                    {profile?.batch_year && <div className="text-xs text-muted-foreground">Batch {profile.batch_year}</div>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/saved")}>
                  <User className="mr-2 h-4 w-4" /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/saved")}>
                  <Heart className="mr-2 h-4 w-4" /> My saved places
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/trip-tracker")}>
                  <Wallet className="mr-2 h-4 w-4" /> My trips
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bucket-list")}>
                  <ListChecks className="mr-2 h-4 w-4" /> Bucket list
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="mr-2 h-4 w-4" /> Search history
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/events")} className="md:hidden">
                  <CalendarHeart className="mr-2 h-4 w-4" /> Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/fresher-guide")}>
                  <GraduationCap className="mr-2 h-4 w-4" /> Fresher guide
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/photo-wall")}>
                  <Camera className="mr-2 h-4 w-4" /> Photo wall
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" /> Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => navigate("/"))}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setLoginOpen(true)} size="sm" className="bg-gradient-hero shadow-glow">
              Login
            </Button>
          )}
        </div>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
