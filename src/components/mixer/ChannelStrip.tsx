import { StudioFader } from "./StudioFader";

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
    <div className={`flex w-[84px] shrink-0 flex-col items-center gap-1.5 border-r border-border px-2 py-2 ${master ? "bg-secondary/40" : ""}`}>
      {onMute && (
        <div className="flex gap-1">
          <button aria-label={`Solo ${name}`} onClick={onSolo} className={`h-6 w-6 rounded-full text-[10px] font-bold ${solo ? "bg-amber text-background" : "bg-secondary text-muted-foreground"}`}>S</button>
          <button aria-label={`Silenciar ${name}`} onClick={onMute} className={`h-6 w-6 rounded-full text-[10px] font-bold ${muted ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground"}`}>M</button>
        </div>
      )}
      {onPan && pan !== undefined && (
        <div className="w-full">
          <input type="range" min={-1} max={1} step={0.01} value={pan} aria-label={`Paneo ${name}`}
            onChange={(ev) => onPan(Number(ev.target.value))} onDoubleClick={() => onPan(0)}
            className="h-1 w-full cursor-ew-resize accent-[var(--color-cyan)]" />
          <div className="text-center font-mono text-[9px] text-muted-foreground">{panLabel(pan)}</div>
        </div>
      )}
      <div className="flex items-stretch gap-1">
        <div className="relative h-28 w-1 overflow-hidden rounded bg-background">
          <div className={`absolute bottom-0 w-full ${lv > 90 ? "bg-destructive" : lv > 70 ? "bg-amber" : accent}`} style={{ height: `${lv}%` }} />
        </div>
        <StudioFader value={volume} onChange={onVolume} label={`Volumen ${name}`} />
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">{toDb(volume)} dB</div>
      <div className={`w-full truncate text-center text-xs ${master ? "font-bold text-primary" : ""}`} title={name}>{name}</div>
      {footer}
    </div>
  );
}
