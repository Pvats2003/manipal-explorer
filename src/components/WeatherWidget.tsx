import { useEffect, useState } from "react";
import { fetchWeather, getWeatherInsight, weatherEmoji, type WeatherSnapshot, type WeatherInsight } from "@/lib/weather";

interface Props { onInsight?: (i: WeatherInsight | null) => void }

export default function WeatherWidget({ onInsight }: Props) {
  const [w, setW] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeather().then((snap) => {
      if (cancelled) return;
      setW(snap);
      onInsight?.(getWeatherInsight(snap));
    }).catch(() => onInsight?.(null));
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!w) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm backdrop-blur">
      <span className="text-base">{weatherEmoji(w.condition, w.isDay)}</span>
      <span className="font-bold">{w.tempC}°C</span>
      <span className="text-xs text-muted-foreground">Manipal right now</span>
    </div>
  );
}
