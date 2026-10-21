import { BoxGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, type BufferGeometry } from 'three';

/** Unit-sized low-poly primitives, shared by every mesh and scaled per instance. */
export const GEOMETRY = {
  box: new BoxGeometry(1, 1, 1),
  cone: new ConeGeometry(0.5, 1, 5),
  ico: new IcosahedronGeometry(0.5, 0),
  cyl: new CylinderGeometry(0.5, 0.5, 1, 6),
} satisfies Record<string, BufferGeometry>;

export type GeometryKind = keyof typeof GEOMETRY;
