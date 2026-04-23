import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Camera, CalendarHeart, Compass, GraduationCap, Heart, History, ListChecks, LogOut, Moon, Settings, Sparkles, Sun, User, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

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
          <Link to="/trip-planner" className="hidden lg:inline-flex">
            <Button variant="ghost" size="sm"><Sparkles className="mr-1.5 h-4 w-4" /> Planner</Button>
          </Link>
          <Link to="/bucket-list" className="hidden lg:inline-flex">
            <Button variant="ghost" size="sm"><ListChecks className="mr-1.5 h-4 w-4" /> Bucket List</Button>
          </Link>
          <Link to="/trip-tracker" className="hidden lg:inline-flex">
            <Button variant="ghost" size="sm"><Wallet className="mr-1.5 h-4 w-4" /> Tracker</Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/trip-planner")} className="lg:hidden">
                  <Sparkles className="mr-2 h-4 w-4" /> Trip Planner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bucket-list")} className="lg:hidden">
                  <ListChecks className="mr-2 h-4 w-4" /> Bucket List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/trip-tracker")} className="lg:hidden">
                  <Wallet className="mr-2 h-4 w-4" /> Trip Tracker
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/events")} className="md:hidden">
                  <CalendarHeart className="mr-2 h-4 w-4" /> Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/fresher-guide")}>
                  <GraduationCap className="mr-2 h-4 w-4" /> Fresher Guide
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/photo-wall")}>
                  <Camera className="mr-2 h-4 w-4" /> Photo Wall
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/saved")}>
                  <Heart className="mr-2 h-4 w-4" /> Saved trips
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="mr-2 h-4 w-4" /> Search history
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" /> Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => navigate("/"))}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")} size="sm">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}