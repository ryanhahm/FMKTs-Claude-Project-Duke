import { Matrix4, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { Builder } from './builder';
import { halfWidth } from './landmarks/eiffel';

const decompose = (m: Matrix4) => {
  const p = new Vector3(), q = new Quaternion(), s = new Vector3();
  m.decompose(p, q, s);
  return { p, q, s };
};

describe('Builder', () => {
  it('batches parts by geometry and color', () => {
    const b = new Builder().box('#fff', [0, 0, 0], [1, 1, 1]).box('#fff', [1, 0, 0], [1, 1, 1]).box('#000', [0, 0, 0], [1, 1, 1]);
    expect(b.parts.get('box|#fff|0')).toHaveLength(2);
    expect(b.parts.get('box|#000|0')).toHaveLength(1);
  });
  it('applies the push/pop transform stack', () => {
    const b = new Builder().push([10, 0, 0], Math.PI / 2).box('#fff', [0, 0, 1], [1, 1, 1]).pop().box('#fff', [0, 0, 1], [1, 1, 1]);
    const [inside, outside] = b.parts.get('box|#fff|0')!.map((m) => decompose(m).p);
    expect(inside!.x).toBeCloseTo(11); // local +z rotated 90° about y → +x
    expect(inside!.z).toBeCloseTo(0);
    expect(outside!.toArray()).toEqual([0, 0, 1]);
  });
  it('beam spans the two endpoints', () => {
    const b = new Builder().beam('#fff', [0, 0, 0], [3, 4, 0], 0.2);
    const { p, s } = decompose(b.parts.get('box|#fff|0')![0]!);
    expect(p.toArray().map((v) => +v.toFixed(6))).toEqual([1.5, 2, 0]);
    expect(s.y).toBeCloseTo(5);
  });
});

describe('Eiffel profile', () => {
  it('tapers monotonically', () => {
    for (let y = 0; y < 11.5; y += 0.5) expect(halfWidth(y + 0.5)).toBeLessThan(halfWidth(y));
  });
});
