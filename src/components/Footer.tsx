import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border/40 bg-gradient-to-b from-background to-muted/30 py-16">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <Link to="/" className="inline-flex items-baseline gap-2 font-display text-2xl font-bold group">
            <span className="text-secondary text-xl transition-transform duration-500 group-hover:rotate-[360deg]" aria-hidden>〰</span>
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Karavali</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Manipal Student Guide — Discover the coastal beauty of Karnataka
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link to="/explore" className="text-muted-foreground hover:text-primary transition-colors duration-300">Explore</Link>
            <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors duration-300">Events</Link>
            <Link to="/trip-planner" className="text-muted-foreground hover:text-primary transition-colors duration-300">Planner</Link>
            <Link to="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors duration-300">Coming Soon</Link>
          </div>
          <div className="pt-6 border-t border-border/40 space-y-2">
            <p className="text-sm text-muted-foreground">Made with love by MIT Manipal students</p>
            <p className="text-xs text-muted-foreground/70">&copy; {new Date().getFullYear()} Karavali &middot; Udupi, Karnataka</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
