import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GUIDE } from "@/lib/fresherGuide";
import { GraduationCap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function FresherGuide() {
  const [active, setActive] = useState<string>("all");
  const [q, setQ] = useState("");

  const cats = active === "all" ? GUIDE : GUIDE.filter(c => c.id === active);
  const filter = (txt: string) => !q || txt.toLowerCase().includes(q.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-6 space-y-2">
          <Badge variant="outline" className="gap-1"><GraduationCap className="h-3 w-3" /> Fresher Survival Guide</Badge>
          <h1 className="font-display text-3xl font-bold md:text-4xl">New to Manipal? Karavali has you covered. 🌴</h1>
          <p className="text-muted-foreground">Your first week, first month, and four years — mapped out by seniors who've been there.</p>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tips… (e.g. bus, ATM, sunset)" className="pl-9" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button size="sm" variant={active === "all" ? "default" : "outline"} onClick={() => setActive("all")} className={active === "all" ? "bg-gradient-hero shadow-glow" : ""}>All</Button>
          {GUIDE.map(c => (
            <Button key={c.id} size="sm" variant={active === c.id ? "default" : "outline"} onClick={() => setActive(c.id)} className={active === c.id ? "bg-gradient-hero shadow-glow" : ""}>
              <span className="mr-1.5">{c.icon}</span> {c.label}
            </Button>
          ))}
        </div>

        <div className="space-y-8">
          {cats.map(cat => {
            const tips = cat.tips.filter(t => filter(t.title) || filter(t.body));
            if (tips.length === 0) return null;
            return (
              <section key={cat.id}>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                  <span className="text-2xl">{cat.icon}</span> {cat.label}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {tips.map(t => (
                    <Card key={t.id} className="border-border/50 bg-gradient-card p-4 shadow-card hover-lift">
                      <div className="mb-1.5 flex items-start gap-2">
                        <div className="text-2xl leading-none">{t.emoji}</div>
                        <div className="font-bold">{t.title}</div>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.body}</p>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
          {q && cats.every(c => c.tips.filter(t => filter(t.title) || filter(t.body)).length === 0) && (
            <p className="py-12 text-center text-muted-foreground">No tips matched "{q}". Try another keyword.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}