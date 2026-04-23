export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
      <div className="container px-4">
        Manipal Wanderlust v1.0 — Made with ❤️ for MIT students · {new Date().getFullYear()}
      </div>
    </footer>
  );
}
