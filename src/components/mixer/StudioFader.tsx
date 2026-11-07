import * as SliderPrimitive from '@radix-ui/react-slider';

export function StudioFader({ value, onChange, label, className = '' }: { value: number; onChange: (value: number) => void; label: string; className?: string }) {
  return <div className={`studio-fader relative h-28 w-12 ${className}`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between font-mono text-[8px] text-muted-foreground"><span>0</span><span>−6</span><span>−12</span><span>−24</span><span>−∞</span></div>
    <SliderPrimitive.Root orientation="vertical" min={0} max={1} step={0.01} value={[value]} onValueChange={values => { const next = values[0]; if (next !== undefined) onChange(next); }} aria-label={label} className="absolute inset-y-0 right-1 flex w-6 touch-none select-none justify-center">
      <SliderPrimitive.Track className="relative w-1 grow rounded-sm bg-background"><SliderPrimitive.Range className="absolute w-full bg-cyan/30" /></SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="studio-fader-cap block h-6 w-6 rounded-sm border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan" />
    </SliderPrimitive.Root>
  </div>;
}