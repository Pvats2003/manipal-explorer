import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock } from "lucide-react";
import type { Destination } from "@/lib/types";

interface Props {
  destination: Destination;
  rank?: number;
  className?: string;
}

const FALLBACK_GRADIENT = "bg-gradient-hero";

export default function DestinationCard({ destination, rank, className }: Props) {
  return (
    <Link to={`/destination/${destination.id}`} className={className}>
      <Card className="group overflow-hidden border-border/50 bg-gradient-card shadow-card transition-smooth hover:shadow-glow hover:-translate-y-1">
        <div className={`relative h-48 ${FALLBACK_GRADIENT} overflow-hidden`}>
          {destination.image_url && (
            <img
              src={destination.image_url}
              alt={destination.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-sunset" />
          {rank && (
            <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 font-bold text-primary backdrop-blur">
              #{rank}
            </div>
          )}
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {destination.rating}/10
          </div>
          <div className="absolute bottom-3 left-4 right-4 text-primary-foreground">
            <h3 className="text-2xl font-bold drop-shadow-lg">{destination.name}</h3>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <p className="line-clamp-2 text-sm text-muted-foreground">{destination.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {destination.distance_km} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {destination.duration_type === "day" ? "Day trip" : "Multi-day"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {destination.moods.slice(0, 3).map((m) => (
              <Badge key={m} variant="secondary" className="text-xs capitalize">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}