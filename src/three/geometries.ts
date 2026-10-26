import { BoxGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry, type BufferGeometry } from 'three';

/** Unit-sized low-poly primitives, shared by every mesh and scaled per instance. */
export const GEOMETRY = {
  box: new BoxGeometry(1, 1, 1),
  cone: new ConeGeometry(0.5, 1, 5),
  ico: new IcosahedronGeometry(0.5, 0),
  cyl: new CylinderGeometry(0.5, 0.5, 1, 6),
  /** Low-poly half-sphere, base at y = 0, height 0.5 at scale 1. */
  dome: new SphereGeometry(0.5, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2),
} satisfies Record<string, BufferGeometry>;

export type GeometryKind = keyof typeof GEOMETRY;
