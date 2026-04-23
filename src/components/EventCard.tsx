import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ExternalLink, CalendarPlus, Share2 } from "lucide-react";
import { categoryMeta, downloadIcs, type CommunityEvent } from "@/lib/events";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  event: CommunityEvent;
  rsvpCount?: number;
  isGoing?: boolean;
  onToggleRsvp?: () => void;
  onClick?: () => void;
}

export default function EventCard({ event, rsvpCount = 0, isGoing, onToggleRsvp, onClick }: Props) {
  const cat = categoryMeta(event.category);
  const start = new Date(event.starts_at);

  const onShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events?id=${event.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {/* user cancelled */}
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-gradient-card shadow-card transition-smooth hover-lift"
      onClick={onClick}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-hero text-6xl">
            {cat.emoji}
          </div>
        )}
        <Badge className="absolute left-3 top-3 gap-1 bg-background/90 text-foreground backdrop-blur">
          <span>{cat.emoji}</span> {cat.label}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-bold">{event.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">
              {format(start, "EEE, d MMM · h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-secondary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {event.organizer && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="line-clamp-1">By {event.organizer}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onToggleRsvp && (
            <Button
              size="sm"
              variant={isGoing ? "default" : "outline"}
              className={isGoing ? "bg-gradient-hero shadow-glow" : ""}
              onClick={(e) => { e.stopPropagation(); onToggleRsvp(); }}
            >
              {isGoing ? "✓ Going" : "I'm going"} {rsvpCount > 0 && <span className="ml-1 opacity-80">· {rsvpCount}</span>}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadIcs(event); }}>
            <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
          <Button size="sm" variant="ghost" onClick={onShare}>
            <Share2 className="mr-1 h-3.5 w-3.5" /> Share
          </Button>
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Details <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
