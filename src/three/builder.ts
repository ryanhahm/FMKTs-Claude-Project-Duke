import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import type { GeometryKind } from './geometries';

export type V3 = [number, number, number];

const UP = new Vector3(0, 1, 0);

/**
 * Collects static low-poly parts into batches keyed by (geometry, color, glow).
 * Each batch renders as ONE InstancedMesh, so a whole diorama costs ~20 draw calls.
 * push()/pop() give a transform stack so props can be authored in local space.
 */
export class Builder {
  readonly parts = new Map<string, Matrix4[]>();
  private stack: Matrix4[] = [new Matrix4()];

  private get top(): Matrix4 {
    return this.stack[this.stack.length - 1]!;
  }

  push(position: V3, rotationY = 0, scale = 1): this {
    const local = new Matrix4().compose(new Vector3(...position), new Quaternion().setFromAxisAngle(UP, rotationY), new Vector3(scale, scale, scale));
    this.stack.push(this.top.clone().multiply(local));
    return this;
  }

  pop(): this {
    if (this.stack.length > 1) this.stack.pop();
    return this;
  }

  add(kind: GeometryKind, color: string, position: V3, size: V3, rotation?: V3 | Quaternion, glow = 0): this {
    const q = rotation instanceof Quaternion ? rotation : new Quaternion().setFromEuler(new Euler(...(rotation ?? [0, 0, 0])));
    const m = new Matrix4().compose(new Vector3(...position), q, new Vector3(...size));
    const key = `${kind}|${color}|${glow}`;
    let list = this.parts.get(key);
    if (!list) this.parts.set(key, (list = []));
    list.push(this.top.clone().multiply(m));
    return this;
  }

  box(color: string, position: V3, size: V3, rotation?: V3, glow = 0): this {
    return this.add('box', color, position, size, rotation, glow);
  }

  /** A square-section box stretched between two points (struts, legs, braces). */
  beam(color: string, a: V3, b: V3, thickness: number): this {
    const va = new Vector3(...a);
    const vb = new Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    const mid = va.add(vb).multiplyScalar(0.5);
    const q = new Quaternion().setFromUnitVectors(UP, dir.normalize());
    return this.add('box', color, [mid.x, mid.y, mid.z], [thickness, len, thickness], q);
  }
}
