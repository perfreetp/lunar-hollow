import { describe, expect, it } from 'vitest';
import {
  describeLightCharacter,
  parseLightCharacter,
  sampleLightCharacter,
} from '../src/core/light-character.ts';

function totalOn(character: ReturnType<typeof parseLightCharacter>): number {
  return character.phases.filter((p) => p.on).reduce((s, p) => s + p.durationS, 0);
}

describe('light characteristics', () => {
  it('parses Fl(2) W 10s into two flashes and an off period', () => {
    const c = parseLightCharacter('Fl(2) W 10s');
    expect(c.family).toBe('Fl');
    expect(c.groupCount).toBe(2);
    expect(c.periodS).toBe(10);
    expect(c.colors).toEqual(['W']);
    const onPhases = c.phases.filter((p) => p.on);
    expect(onPhases).toHaveLength(2);
    const sum = c.phases.reduce((s, p) => s + p.durationS, 0);
    expect(sum).toBeCloseTo(10, 4);
    expect(totalOn(c)).toBeLessThan(10);
    expect(c.phases[c.phases.length - 1].on).toBe(false);
  });

  it('parses quick groups within their period', () => {
    const c = parseLightCharacter('VQ(3) G 5s');
    expect(c.family).toBe('VQ');
    expect(c.colors).toEqual(['G']);
    expect(c.phases.filter((p) => p.on)).toHaveLength(3);
    const sum = c.phases.reduce((s, p) => s + p.durationS, 0);
    expect(sum).toBeCloseTo(5, 4);
  });

  it('parses long flash and occlusion', () => {
    const lfl = parseLightCharacter('LFl 8s');
    expect(lfl.family).toBe('LFl');
    expect(lfl.phases[0].on).toBe(true);
    expect(lfl.phases[0].durationS).toBeGreaterThanOrEqual(2);
    const oc = parseLightCharacter('Oc R 8s');
    expect(oc.phases[0].on).toBe(true);
    expect(oc.phases[1].on).toBe(false);
    expect(oc.colors).toEqual(['R']);
  });

  it('parses isophase and fixed', () => {
    const iso = parseLightCharacter('Iso W 4s');
    expect(iso.phases).toHaveLength(2);
    expect(iso.phases[0].durationS).toBeCloseTo(2, 6);
    const f = parseLightCharacter('F R');
    expect(f.periodS).toBeGreaterThan(0);
    expect(f.phases).toHaveLength(1);
    expect(f.phases[0].on).toBe(true);
  });

  it('parses morse characters', () => {
    const mo = parseLightCharacter('Mo(A) W 15s');
    expect(mo.family).toBe('Mo');
    expect(mo.morseLetter).toBe('A');
    const sum = mo.phases.reduce((s, p) => s + p.durationS, 0);
    expect(sum).toBeCloseTo(15, 4);
  });

  it('samples intensity with ramps and repetition', () => {
    const c = parseLightCharacter('Fl W 5s');
    const atZero = sampleLightCharacter(c, 0);
    expect(atZero.intensity).toBe(0);
    const elapsed = sampleLightCharacter(c, c.phases[0].durationS / 2);
    expect(elapsed.intensity).toBeGreaterThan(0.9);
    const sameAsFirst = sampleLightCharacter(c, c.periodS);
    expect(sameAsFirst.intensity).toBeCloseTo(atZero.intensity, 6);
    const offPhase = sampleLightCharacter(c, c.periodS - 0.1);
    expect(offPhase.on).toBe(false);
    expect(offPhase.intensity).toBe(0);
  });

  it('describes characteristics in Chinese', () => {
    expect(describeLightCharacter(parseLightCharacter('Fl(2) W 10s'))).toBe('闪光(2) 白 10s');
    expect(describeLightCharacter(parseLightCharacter('Mo(A) W 15s'))).toBe('摩尔斯(A) 白 15s');
  });

  it('rejects unparseable notation', () => {
    expect(() => parseLightCharacter('bogus')).toThrow();
  });
});
