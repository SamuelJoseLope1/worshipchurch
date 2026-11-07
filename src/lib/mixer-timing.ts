/** BPM follows the engine's notated beat convention (including eighth-note meters). */
export function musicalPosition(seconds: number, bpm: number, signature: string) {
  const beats = Math.max(1, Number(signature.split('/')[0]) || 4);
  const elapsed = Math.max(0, seconds) * Math.max(1, bpm) / 60;
  const whole = Math.floor(elapsed + 1e-7);
  return { bar: Math.floor(whole / beats) + 1, beat: whole % beats + 1, tick: Math.floor((elapsed - Math.floor(elapsed)) * 960), beats };
}

export function barTime(bar: number, bpm: number, signature: string) {
  return (Math.max(1, bar) - 1) * musicalPosition(0, bpm, signature).beats * 60 / Math.max(1, bpm);
}

export function canManageService(role: string | null) {
  return role === 'owner' || role === 'admin';
}

export function assertCloudOwner(email: unknown) {
  if (typeof email !== 'string' || email.toLowerCase() !== 'samueljoselopegames@gmail.com') throw new Error('Acceso no permitido');
}