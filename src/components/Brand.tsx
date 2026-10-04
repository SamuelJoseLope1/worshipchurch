import logo from "@/assets/logo.png";

/** Logo slot — replace src/assets/logo.png with the final brand mark. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber/10 ring-1 ring-amber/30">
        <img src={logo} alt="Logo" width={28} height={28} className="size-7 object-contain" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">WORSHIP CHURCH</div>
          <div className="font-mono text-[10px] text-muted-foreground">multitrack player</div>
        </div>
      )}
    </div>
  );
}
