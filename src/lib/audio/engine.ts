/**
 * AudioEngine / PlaybackEngine — single Web Audio graph with a centralized
 * transport. All stems start on the same AudioContext timestamp so they stay
 * sample-locked. Includes ClickEngine, PadEngine and the Broadcast bus.
 *
 * Graph:
 *   stem source -> gain -> pan -> analyser -> master -> destination (house/musicians)
 *                               \-> streamSend -> streamBus (MediaStream for broadcast)
 *   click -> clickGain -> destination (never sent to broadcast)
 *   pad   -> padGain -> master + streamBus
 */
import { fetchAudioBytes } from "@/lib/services/storage";
import { beatsPerBar, noteFrequency } from "@/lib/music";

export type StemInput = {
  id: string;
  name: string;
  type: string;
  group: string;
  color: string;
  path: string | null;
  volume: number;
  pan: number;
  muted: boolean;
};

export type StemState = StemInput & {
  solo: boolean;
  streamOn: boolean;
  status: "idle" | "loading" | "ready" | "error" | "missing";
  error?: string;
  level: number;
};

export type PadPreset = "Cálido" | "Brillante" | "Oscuro";

export type EngineSnapshot = {
  songId: string | null;
  stems: StemState[];
  playing: boolean;
  position: number;
  duration: number;
  bpm: number;
  originalBpm: number;
  varispeed: boolean;
  timeSig: string;
  loop: { enabled: boolean; a: number; b: number };
  master: number;
  click: { enabled: boolean; volume: number; subdivision: 1 | 2 | 4; accent: boolean; metronome: boolean; beat: number };
  pad: { playing: boolean; note: string; volume: number; preset: PadPreset; fadeIn: number; fadeOut: number };
  audioReady: boolean;
};

type Node = { gain: GainNode; pan: StereoPannerNode; analyser: AnalyserNode; send: GainNode; buffer?: AudioBuffer; src?: AudioBufferSourceNode | undefined };

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private clickGain!: GainNode;
  private padGain!: GainNode;
  private streamDest!: MediaStreamAudioDestinationNode;
  private nodes = new Map<string, Node>();
  private startedAt = 0; // ctx time when playback started
  private offset = 0; // song position at startedAt
  private raf = 0;
  private clickTimer: ReturnType<typeof setInterval> | null = null;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private padNodes: { oscs: OscillatorNode[]; filter: BiquadFilterNode; env: GainNode } | null = null;
  private listeners = new Set<() => void>();
  private loadToken = 0;
  onTick?: (pos: number) => void;

  snap: EngineSnapshot = {
    songId: null,
    stems: [],
    playing: false,
    position: 0,
    duration: 0,
    bpm: 120,
    originalBpm: 120,
    varispeed: false,
    timeSig: "4/4",
    loop: { enabled: false, a: 0, b: 0 },
    master: 0.9,
    click: { enabled: true, volume: 0.6, subdivision: 1, accent: true, metronome: false, beat: 0 },
    pad: { playing: false, note: "C", volume: 0.5, preset: "Cálido", fadeIn: 3, fadeOut: 4 },
    audioReady: false,
  };

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.snap;
  private set(patch: Partial<EngineSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** Must be called from a user gesture the first time (browser autoplay policy). */
  ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      this.ctx = ctx;
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.snap.master;
      this.masterGain.connect(ctx.destination);
      this.clickGain = ctx.createGain();
      this.clickGain.gain.value = this.snap.click.volume;
      this.clickGain.connect(ctx.destination);
      this.padGain = ctx.createGain();
      this.padGain.gain.value = this.snap.pad.volume;
      this.streamDest = ctx.createMediaStreamDestination();
      this.padGain.connect(this.masterGain);
      this.padGain.connect(this.streamDest);
      this.set({ audioReady: true });
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Broadcast audio bus (no click / cues by default). */
  getStreamAudio(): MediaStream {
    this.ensure();
    return this.streamDest.stream;
  }

  get position() {
    if (!this.snap.playing || !this.ctx) return this.offset;
    return this.offset + (this.ctx.currentTime - this.startedAt) * this.rate;
  }
  private get rate() {
    return this.snap.varispeed ? this.snap.bpm / (this.snap.originalBpm || this.snap.bpm) : 1;
  }

  async loadSong(opts: { songId: string; bpm: number; originalBpm: number; timeSig: string; stems: StemInput[]; duration?: number | null }) {
    const ctx = this.ensure();
    this.stop();
    this.nodes.forEach((n) => { n.gain.disconnect(); n.send.disconnect(); });
    this.nodes.clear();
    const token = ++this.loadToken;
    const stems: StemState[] = opts.stems.map((s) => ({
      ...s,
      solo: false,
      streamOn: !(s.group === "Click" || s.group === "Cues"),
      status: s.path ? "loading" : "missing",
      level: 0,
    }));
    for (const s of stems) {
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const send = ctx.createGain();
      gain.connect(pan).connect(analyser);
      analyser.connect(this.masterGain);
      analyser.connect(send).connect(this.streamDest);
      this.nodes.set(s.id, { gain, pan, analyser, send });
    }
    this.set({
      songId: opts.songId,
      stems,
      bpm: opts.bpm,
      originalBpm: opts.originalBpm,
      timeSig: opts.timeSig,
      position: 0,
      duration: opts.duration ?? 0,
      loop: { enabled: false, a: 0, b: 0 },
    });
    this.offset = 0;
    this.applyMix();
    await Promise.all(
      stems.map(async (s) => {
        if (!s.path) return;
        try {
          const bytes = await fetchAudioBytes(s.path);
          const buf = await ctx.decodeAudioData(bytes);
          if (token !== this.loadToken) return;
          const n = this.nodes.get(s.id);
          if (n) n.buffer = buf;
          this.patchStem(s.id, { status: "ready" });
          if (buf.duration > this.snap.duration) this.set({ duration: buf.duration });
        } catch (e) {
          if (token !== this.loadToken) return;
          const msg = e instanceof Error && e.message === "Sin conexión" ? "Sin conexión" :
            e instanceof DOMException ? "Formato no compatible" : "No se pudo cargar el archivo";
          this.patchStem(s.id, { status: "error", error: msg });
        }
      }),
    );
  }

  private patchStem(id: string, patch: Partial<StemState>) {
    this.set({ stems: this.snap.stems.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  }

  private applyMix() {
    if (!this.ctx) return;
    const anySolo = this.snap.stems.some((s) => s.solo);
    const t = this.ctx.currentTime;
    for (const s of this.snap.stems) {
      const n = this.nodes.get(s.id);
      if (!n) continue;
      const audible = !s.muted && (!anySolo || s.solo);
      n.gain.gain.setTargetAtTime(audible ? s.volume : 0, t, 0.015);
      n.pan.pan.setTargetAtTime(s.pan, t, 0.015);
      n.send.gain.setTargetAtTime(s.streamOn ? 1 : 0, t, 0.015);
    }
  }

  setStem(id: string, patch: Partial<Pick<StemState, "volume" | "pan" | "muted" | "solo" | "streamOn">>) {
    this.patchStem(id, patch);
    this.applyMix();
  }

  setMaster(v: number) {
    this.set({ master: v });
    if (this.ctx) this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.015);
  }

  play() {
    const ctx = this.ensure();
    if (this.snap.playing) return;
    const when = ctx.currentTime + 0.06;
    const rate = this.rate;
    for (const s of this.snap.stems) {
      const n = this.nodes.get(s.id);
      if (!n?.buffer || this.offset >= n.buffer.duration) continue;
      const src = ctx.createBufferSource();
      src.buffer = n.buffer;
      src.playbackRate.value = rate;
      src.connect(n.gain);
      src.start(when, this.offset);
      n.src = src;
    }
    this.startedAt = when;
    this.set({ playing: true });
    this.resetClickPhase(when);
    this.startClock();
  }

  pause() {
    if (!this.snap.playing) return;
    this.offset = this.position;
    this.killSources();
    this.set({ playing: false, position: this.offset });
    this.stopClockIfIdle();
  }

  stop() {
    this.killSources();
    this.offset = 0;
    if (this.snap.playing || this.snap.position) this.set({ playing: false, position: 0 });
    this.stopClockIfIdle();
  }

  seek(t: number) {
    const was = this.snap.playing;
    if (was) this.killSources();
    this.offset = Math.max(0, Math.min(t, this.snap.duration || t));
    this.set({ playing: false, position: this.offset });
    if (was) this.play();
  }

  private killSources() {
    this.nodes.forEach((n) => {
      try { n.src?.stop(); } catch { /* already stopped */ }
      n.src?.disconnect();
      n.src = undefined;
    });
  }

  setLoop(loop: Partial<EngineSnapshot["loop"]>) {
    this.set({ loop: { ...this.snap.loop, ...loop } });
  }

  setBpm(bpm: number) {
    const clamped = Math.max(30, Math.min(300, Math.round(bpm * 10) / 10));
    const pos = this.position;
    this.offset = pos;
    if (this.ctx) this.startedAt = this.ctx.currentTime;
    this.set({ bpm: clamped });
    this.nodes.forEach((n) => n.src?.playbackRate.setValueAtTime(this.rate, this.ctx!.currentTime));
    if (this.snap.playing && this.ctx) this.resetClickPhase(this.ctx.currentTime);
  }

  setVarispeed(on: boolean) {
    const pos = this.position;
    this.offset = pos;
    if (this.ctx) this.startedAt = this.ctx.currentTime;
    this.set({ varispeed: on });
    this.nodes.forEach((n) => n.src?.playbackRate.setValueAtTime(this.rate, this.ctx!.currentTime));
  }

  setTimeSig(sig: string) { this.set({ timeSig: sig }); }

  /* ------------------------------ clock ------------------------------ */
  private startClock() {
    cancelAnimationFrame(this.raf);
    const loop = () => {
      const pos = this.position;
      const { loop: lp, duration } = this.snap;
      if (this.snap.playing && lp.enabled && lp.b > lp.a && pos >= lp.b) {
        this.seek(lp.a);
      } else if (this.snap.playing && duration && pos >= duration) {
        this.stop();
        return;
      }
      const stems = this.snap.stems.map((s) => ({ ...s, level: this.meter(s.id) }));
      this.set({ position: pos, stems });
      this.onTick?.(pos);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.ensureClickTimer();
  }

  private meter(id: string) {
    const n = this.nodes.get(id);
    if (!n || !this.snap.playing) return 0;
    const arr = new Uint8Array(n.analyser.fftSize);
    n.analyser.getByteTimeDomainData(arr);
    let peak = 0;
    for (const v of arr) peak = Math.max(peak, Math.abs(v - 128) / 128);
    return peak;
  }

  private stopClockIfIdle() {
    cancelAnimationFrame(this.raf);
    if (!this.snap.click.metronome && this.clickTimer) {
      clearInterval(this.clickTimer);
      this.clickTimer = null;
    }
  }

  /* --------------------------- ClickEngine --------------------------- */
  setClick(patch: Partial<EngineSnapshot["click"]>) {
    const click = { ...this.snap.click, ...patch };
    this.set({ click });
    if (this.ctx) this.clickGain.gain.setTargetAtTime(click.volume, this.ctx.currentTime, 0.015);
    if (patch.metronome !== undefined) {
      const ctx = this.ensure();
      if (patch.metronome) { this.resetClickPhase(ctx.currentTime + 0.05); this.ensureClickTimer(); }
      else this.stopClockIfIdle();
    }
  }

  private resetClickPhase(at: number) {
    const beatDur = 60 / this.snap.bpm;
    const songBeats = this.position / beatDur;
    const frac = songBeats - Math.floor(songBeats);
    this.beatIndex = Math.ceil(songBeats - 1e-6);
    this.nextBeatTime = at + (frac ? (1 - frac) * beatDur : 0);
  }

  private ensureClickTimer() {
    if (this.clickTimer) return;
    this.clickTimer = setInterval(() => this.scheduleClicks(), 25);
  }

  private scheduleClicks() {
    const ctx = this.ctx;
    if (!ctx) return;
    const active = (this.snap.playing && this.snap.click.enabled) || this.snap.click.metronome;
    const beatDur = 60 / this.snap.bpm;
    while (this.nextBeatTime < ctx.currentTime + 0.12) {
      if (active) {
        const bpb = beatsPerBar(this.snap.timeSig);
        const inBar = this.beatIndex % bpb;
        const compound = this.snap.timeSig.endsWith("/8") && bpb % 3 === 0;
        const accent = !this.snap.click.accent ? 0 : (inBar === 0 ? 2 : compound && inBar % 3 === 0 ? 1 : 0);
        this.tick(this.nextBeatTime, accent);
        const sub = this.snap.click.subdivision;
        for (let i = 1; i < sub; i++) this.tick(this.nextBeatTime + (beatDur * i) / sub, -1);
        if (Math.abs(this.nextBeatTime - ctx.currentTime) < 0.15) {
          const beat = inBar;
          setTimeout(() => this.set({ click: { ...this.snap.click, beat } }), Math.max(0, (this.nextBeatTime - ctx.currentTime) * 1000));
        }
      }
      this.nextBeatTime += beatDur;
      this.beatIndex++;
    }
  }

  private tick(time: number, accent: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.value = accent === 2 ? 1800 : accent === 1 ? 1400 : accent === -1 ? 900 : 1100;
    const peak = accent === -1 ? 0.35 : 1;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(peak, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(env).connect(this.clickGain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  /* ---------------------------- PadEngine ---------------------------- */
  padPlay(note?: string) {
    const ctx = this.ensure();
    const n = note ?? this.snap.pad.note;
    if (this.padNodes) this.padRelease(0.8);
    const { preset, fadeIn } = this.snap.pad;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = preset === "Brillante" ? 3200 : preset === "Oscuro" ? 650 : 1300;
    filter.Q.value = 0.7;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.18, ctx.currentTime + Math.max(0.05, fadeIn));
    const f = noteFrequency(n, 3);
    const voices: [number, OscillatorType, number][] = [
      [f, "sawtooth", -7], [f, "sawtooth", 7], [f * 1.5, "sawtooth", 3],
      [f * 2, preset === "Oscuro" ? "sine" : "triangle", -4], [f / 2, "sine", 0],
    ];
    const oscs = voices.map(([freq, type, detune]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(filter);
      o.start();
      return o;
    });
    filter.connect(env).connect(this.padGain);
    this.padNodes = { oscs, filter, env };
    this.set({ pad: { ...this.snap.pad, note: n, playing: true } });
  }

  padStop() {
    this.padRelease(this.snap.pad.fadeOut);
    this.set({ pad: { ...this.snap.pad, playing: false } });
  }

  private padRelease(seconds: number) {
    const p = this.padNodes;
    const ctx = this.ctx;
    if (!p || !ctx) return;
    this.padNodes = null;
    const t = ctx.currentTime;
    p.env.gain.cancelScheduledValues(t);
    p.env.gain.setValueAtTime(p.env.gain.value, t);
    p.env.gain.linearRampToValueAtTime(0, t + Math.max(0.05, seconds));
    p.oscs.forEach((o) => o.stop(t + seconds + 0.1));
  }

  setPad(patch: Partial<EngineSnapshot["pad"]>) {
    const pad = { ...this.snap.pad, ...patch };
    this.set({ pad });
    if (this.ctx && patch.volume !== undefined) this.padGain.gain.setTargetAtTime(pad.volume, this.ctx.currentTime, 0.05);
    if (patch.note && this.snap.pad.playing) this.padPlay(patch.note);
  }
}

export const engine = new AudioEngine();
