import { describe, expect, it } from 'vitest';
import { CHART } from '../src/model/chart-data.ts';
import { parseLightCharacter, sampleLightCharacter } from '../src/core/light-character.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The halo, the lit-route illumination and the inspector's timing strip must
 * all evaluate a lamp's phase on the *same* clock, otherwise the UI claims a
 * lamp is lit while the chart paints it dark. That invariant is enforced by
 * code structure rather than by types, so pin it here.
 */
const SRC = join(import.meta.dirname, '..', 'src');

describe('light phase clock consistency', () => {
  it('every per-light sample in the renderer goes through phaseTimeFor', () => {
    const source = readFileSync(join(SRC, 'render', 'glow-renderer.ts'), 'utf8');
    const callSites = [...source.matchAll(/sampleLightCharacter\(([^;]*?)\)/gs)].map((m) => m[0]);
    expect(callSites.length).toBeGreaterThan(0);
    for (const site of callSites) {
      expect(site).toMatch(/phaseTimeFor\(|^\s*sampleLightCharacter\(\s*this\.characters\[this\.aids\.indexOf/);
    }
  });

  it('the controller reads phase through the renderer clock', () => {
    const source = readFileSync(join(SRC, 'app', 'controller.ts'), 'utf8');
    expect(source).toContain('this.renderer.phaseTimeFor(id)');
    // No independent wall-clock phase reads may remain.
    expect(source).not.toMatch(/performance\.now\(\)\s*\/\s*1000/);
  });

  it('the inspector asks the app for timing rather than sampling itself', () => {
    const source = readFileSync(join(SRC, 'ui', 'components', 'inspector.ts'), 'utf8');
    expect(source).toContain('this.api.timingSample(');
    expect(source).not.toMatch(/performance\.now\(\)\s*-\s*this\.epoch/);
  });

  it('phaseTimeFor offsets each light so the chart does not pulse in unison', () => {
    const source = readFileSync(join(SRC, 'render', 'glow-renderer.ts'), 'utf8');
    expect(source).toMatch(/Math\.max\(0, index\)\s*\*\s*0\.37/);
  });

  it('the clock honours the motion freeze', () => {
    const source = readFileSync(join(SRC, 'render', 'glow-renderer.ts'), 'utf8');
    const clock = /private clock\(\): number \{([\s\S]*?)\n  \}/.exec(source);
    expect(clock).not.toBeNull();
    expect(clock![1]).toContain("'frozen'");
    expect(clock![1]).toContain('frozenAt');
  });
});

describe('characteristic sampling remains periodic under the offset', () => {
  it('offsetting a fast and a slow light keeps both periodic', () => {
    const fast = parseLightCharacter('VQ(3) G 5s');
    const slow = parseLightCharacter('Mo(A) W 15s');
    for (const ch of [fast, slow]) {
      const a = sampleLightCharacter(ch, 1.234);
      const b = sampleLightCharacter(ch, 1.234 + ch.periodS);
      expect(b.intensity).toBeCloseTo(a.intensity, 6);
      expect(b.phaseIndex).toBe(a.phaseIndex);
    }
    // A fixed light never blinks, whatever its offset.
    const fixed = parseLightCharacter('F R');
    for (const t of [0, 1.7, 12.9, 240]) {
      expect(sampleLightCharacter(fixed, t).intensity).toBe(1);
    }
  });

  it('covers every aid in the chart with a parseable characteristic', () => {
    for (const aid of CHART.aids) {
      const ch = parseLightCharacter(aid.characteristic);
      expect(ch.periodS).toBeGreaterThan(0);
      expect(ch.phases.length).toBeGreaterThan(0);
      const total = ch.phases.reduce((s, p) => s + p.durationS, 0);
      expect(total).toBeCloseTo(ch.periodS, 4);
      expect(ch.phases.some((p) => p.on)).toBe(true);
    }
  });
});
