import { StudioFader } from "./StudioFader";
import { Button } from "@/components/ui/button";
import * as SliderPrimitive from "@radix-ui/react-slider";

export const toDb = (v: number) => (v <= 0.001 ? "−∞" : (20 * Math.log10(v)).toFixed(1));
const panLabel = (p: number) => (Math.abs(p) < 0.03 ? "C" : `${p < 0 ? "L" : "R"}${Math.round(Math.abs(p) * 100)}`);

type Props = {
  name: string; volume: number; pan?: number; level?: number; muted?: boolean; solo?: boolean; accent?: string;
  onVolume: (v: number) => void; onPan?: (p: number) => void; onMute?: () => void; onSolo?: () => void;
  footer?: React.ReactNode; master?: boolean;
};

export function ChannelStrip({ name, volume, pan, level = 0, muted, solo, accent = "bg-cyan", onVolume, onPan, onMute, onSolo, footer, master }: Props) {
  const lv = Math.min(100, level * 100);
  return (
    <div className={`flex w-[108px] shrink-0 flex-col items-center gap-3 border-r border-border bg-card px-3 py-3 sm:w-[116px] ${master ? "sticky right-0 z-10 border-l bg-panel2" : ""}`}>
      {onMute && (
        <div className="flex gap-1">
          <Button variant="ghost" aria-label={`Solo ${name}`} onClick={onSolo} className={`h-6 w-6 rounded-full p-0 text-[10px] font-bold ${solo ? "bg-amber text-background" : "bg-secondary text-muted-foreground"}`}>S</Button>
          <Button variant="ghost" aria-label={`Silenciar ${name}`} onClick={onMute} className={`h-6 w-6 rounded-full p-0 text-[10px] font-bold ${muted ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground"}`}>M</Button>
        </div>
      )}
      {onPan && pan !== undefined && (
        <div className="w-full">
          <SliderPrimitive.Root min={-1} max={1} step={0.01} value={[pan]} aria-label={`Paneo ${name}`} onValueChange={values => { const next = values[0]; if (next !== undefined) onPan(next); }} onDoubleClick={() => onPan(0)} className="relative flex h-5 w-full touch-none items-center">
            <SliderPrimitive.Track className="relative h-1 w-full rounded-sm bg-background" />
            <SliderPrimitive.Thumb className="studio-pan-cap block h-3 w-5 rounded-sm border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan" />
          </SliderPrimitive.Root>
          <div className="text-center font-mono text-[9px] text-muted-foreground">{panLabel(pan)}</div>
        </div>
      )}
      {master && <div aria-hidden="true" className="h-[65px]" />}
      <div className="flex items-stretch gap-1">
        <div className="relative h-[280px] w-1 sm:h-[320px] overflow-hidden rounded bg-background">
          <div className={`absolute bottom-0 w-full ${lv > 90 ? "bg-destructive" : lv > 70 ? "bg-amber" : accent}`} style={{ height: `${lv}%` }} />
        </div>
        <StudioFader value={volume} onChange={onVolume} label={`Volumen ${name}`} />
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">{toDb(volume)} dB</div>
      <div className={`h-8 w-full overflow-hidden break-words text-center text-xs font-semibold ${master ? "font-bold text-primary" : ""}`} title={name}>{name}</div>
      {footer}
    </div>
  );
}
