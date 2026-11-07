import { describe, it, expect } from 'vitest';
import { musicalPosition, barTime, canManageService, assertCloudOwner } from '@/lib/mixer-timing';

describe('Compases alineados con audio', () => {
  it('sitúa el compás 2 en el segundo 2 a 120 BPM, 4/4', () => { expect(barTime(2, 120, '4/4')).toBe(2); expect(musicalPosition(2, 120, '4/4')).toMatchObject({ bar: 2, beat: 1 }); });
  it('sigue los seis tiempos del motor en 6/8', () => { expect(barTime(2, 120, '6/8')).toBe(3); expect(musicalPosition(2.5, 120, '6/8')).toMatchObject({ bar: 1, beat: 6 }); });
  it('solo permite fechas de organización a admin y owner', () => { expect(canManageService('admin')).toBe(true); expect(canManageService('owner')).toBe(true); for (const role of ['director', 'musician', 'viewer', null]) expect(canManageService(role)).toBe(false); });
  it('solo permite gestionar la nube a Samuel con identidad validada', () => { expect(() => assertCloudOwner('samueljoselopegames@gmail.com')).not.toThrow(); expect(() => assertCloudOwner('otro@example.com')).toThrow(); expect(() => assertCloudOwner(undefined)).toThrow(); });
});