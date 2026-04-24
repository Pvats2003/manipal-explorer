import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background py-10">
      <div className="container px-4 text-center text-sm text-muted-foreground">
        <div className="font-display text-xl font-bold text-primary">Karavali — A Manipal Student Guide</div>
        <p className="mt-2">Made with ❤️ by MIT Manipal students · Udupi, Karnataka</p>
        <p className="mt-1 text-xs text-muted-foreground/80">© {new Date().getFullYear()} Karavali · @karavali</p>
        <p className="mt-3">
          <Link to="/coming-soon" className="text-primary hover:underline">Coming Soon 🚀</Link>
        </p>
      </div>
    </footer>
  );
}
