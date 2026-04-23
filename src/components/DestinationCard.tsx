import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock } from "lucide-react";
import type { Destination } from "@/lib/types";
import { getOpenStatus } from "@/lib/openingHours";
import { isNewPlace } from "@/lib/checkins";

interface Props {
  destination: Destination;
  rank?: number;
  className?: string;
  checkinCount?: number;
}

const FALLBACK_GRADIENT = "bg-gradient-hero";

export default function DestinationCard({ destination, rank, className, checkinCount }: Props) {
  const status = getOpenStatus(destination.opening_hours);
  const isNew = isNewPlace(destination.created_at);
  return (
    <Link to={`/destination/${destination.id}`} className={className}>
      <Card className="group h-full overflow-hidden border-border/50 bg-gradient-card shadow-card transition-smooth hover:shadow-glow hover:-translate-y-1">
        <div className={`relative h-48 ${FALLBACK_GRADIENT} overflow-hidden`}>
          {destination.image_url && (
            <img
              src={destination.image_url}
              alt={destination.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-sunset" />
          {rank && (
            <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 font-bold text-primary backdrop-blur">
              #{rank}
            </div>
          )}
          {isNew && !rank && (
            <div className="absolute left-4 top-4 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary-foreground shadow-md">
              NEW
            </div>
          )}
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {destination.rating}/10
          </div>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="text-2xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{destination.name}</h3>
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
            {typeof checkinCount === "number" && checkinCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                👣 {checkinCount} been here
              </span>
            )}
            {status && (
              <span className="ml-auto flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    status.state === "open"
                      ? "bg-green-500 animate-pulse"
                      : status.state === "closing-soon"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                <span className={status.state === "open" ? "font-semibold text-green-600 dark:text-green-400" : status.state === "closing-soon" ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                  {status.label}
                </span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {destination.moods.slice(0, 4).map((m, i) => (
              <span
                key={m}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${VIBE_CHIP[i % VIBE_CHIP.length]}`}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}

const VIBE_CHIP = [
  "bg-primary/15 text-primary",
  "bg-secondary/15 text-secondary",
  "bg-accent text-accent-foreground",
  "bg-muted text-muted-foreground",
];