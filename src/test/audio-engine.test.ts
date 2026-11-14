import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '@/lib/audio/engine';

vi.mock('@/lib/services/storage', () => ({ fetchAudioBytes: vi.fn(async () => new ArrayBuffer(8)) }));

class Param {
  value = 0;
  setTargetAtTime = vi.fn((v: number) => { this.value = v; });
  setValueAtTime = vi.fn((v: number) => { this.value = v; });
}
class AudioNodeMock {
  gain = new Param();
  pan = new Param();
  playbackRate = new Param();
  buffer: unknown;
  fftSize = 256;
  connect = vi.fn((destination: AudioNodeMock) => destination);
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}
class ContextMock {
  static current: ContextMock;
  currentTime = 10;
  state = 'running';
  destination = { maxChannelCount: 4, channelCount: 2, channelCountMode: '', channelInterpretation: '' };
  gains: AudioNodeMock[] = [];
  pans: AudioNodeMock[] = [];
  analysers: AudioNodeMock[] = [];
  sources: AudioNodeMock[] = [];
  constructor() { ContextMock.current = this; }
  resume = vi.fn(async () => { this.state = 'running'; });
  createGain() { const n = new AudioNodeMock(); this.gains.push(n); return n; }
  createStereoPanner() { const n = new AudioNodeMock(); this.pans.push(n); return n; }
  createAnalyser() { const n = new AudioNodeMock(); this.analysers.push(n); return n; }
  createChannelMerger() { return new AudioNodeMock(); }
  createChannelSplitter() { return new AudioNodeMock(); }
  createMediaStreamDestination() { return new AudioNodeMock(); }
  createBufferSource() { const n = new AudioNodeMock(); this.sources.push(n); return n; }
  decodeAudioData = vi.fn(async () => ({ duration: 20 }));
}

const stems = ['bass', 'piano'].map(id => ({ id, name: id, type: id, group: 'Band', color: 'cyan', path: id, volume: 1, pan: 0, muted: false }));
const song = { songId: 'song', bpm: 120, originalBpm: 120, timeSig: '4/4', stems };
let engine: AudioEngine;
beforeEach(() => {
  vi.stubGlobal('AudioContext', ContextMock);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  engine = new AudioEngine();
});
afterEach(() => { engine.stop(); vi.unstubAllGlobals(); });

describe('Motor de audio en vivo', () => {
  it('inicia todos los stems en el mismo instante y no muestra tiempo negativo', async () => {
    await engine.loadSong(song);
    await engine.play();
    const ctx = ContextMock.current;
    expect(ctx.sources).toHaveLength(2);
    for (const source of ctx.sources) expect(source.start).toHaveBeenCalledWith(10.06, 0);
    expect(engine.position).toBe(0);
    ctx.currentTime = 11.06;
    expect(engine.position).toBeCloseTo(1);
  });
  it('espera al dispositivo y cancela un inicio pendiente al detener', async () => {
    await engine.loadSong(song);
    const ctx = ContextMock.current;
    ctx.state = 'suspended';
    let release: (() => void) | undefined;
    const pending = new Promise<void>(resolve => { release = resolve; });
    ctx.resume.mockImplementation(() => pending);
    const playing = engine.play();
    expect(ctx.sources).toHaveLength(0);
    engine.stop();
    ctx.state = 'running';
    release?.();
    await playing;
    expect(ctx.sources).toHaveLength(0);
    expect(engine.getSnapshot().playing).toBe(false);
  });
  it('conecta volumen, paneo y medidor en serie y aplica mute y solo', async () => {
    await engine.loadSong(song);
    const ctx = ContextMock.current;
    expect(ctx.gains[3]?.connect).toHaveBeenCalledWith(ctx.pans[0]);
    expect(ctx.pans[0]?.connect).toHaveBeenCalledWith(ctx.analysers[0]);
    engine.setStem('bass', { volume: 0.5, pan: -0.75 });
    expect(ctx.gains[3]?.gain.value).toBe(0.5);
    expect(ctx.pans[0]?.pan.value).toBe(-0.75);
    engine.setStem('piano', { solo: true });
    expect(ctx.gains[3]?.gain.value).toBe(0);
    engine.setStem('piano', { muted: true });
    expect(ctx.gains[6]?.gain.value).toBe(0);
    engine.setMaster(0.65);
    expect(ctx.gains[0]?.gain.value).toBe(0.65);
  });
  it('desconecta paneo y medidores anteriores al cambiar canción', async () => {
    await engine.loadSong(song);
    const ctx = ContextMock.current;
    const pan = ctx.pans[0];
    const analyser = ctx.analysers[0];
    await engine.loadSong({ ...song, songId: 'other' });
    expect(pan?.disconnect).toHaveBeenCalledOnce();
    expect(analyser?.disconnect).toHaveBeenCalledOnce();
  });
});