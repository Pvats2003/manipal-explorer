import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Wallet } from "lucide-react";
import { format } from "date-fns";
import type { Experience } from "@/lib/experiences";

interface Props {
  experience: Experience;
  attendeeCount: number;
  onClick: () => void;
}

export default function ExperienceCard({ experience, attendeeCount, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden bg-card shadow-card transition-smooth hover-lift"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {experience.image_url ? (
          <img src={experience.image_url} alt={experience.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-hero text-5xl">✨</div>
        )}
        <Badge className="absolute right-3 top-3 bg-background/90 text-foreground backdrop-blur">
          ₹{experience.budget_estimate}
        </Badge>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-display text-lg font-bold">{experience.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{experience.description}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" />{format(new Date(experience.starts_at), "EEE, d MMM")}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-secondary" />{experience.location}</span>
          <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" />₹{experience.budget_estimate} pp</span>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{attendeeCount} going</span>
        </div>
      </div>
    </Card>
  );
}