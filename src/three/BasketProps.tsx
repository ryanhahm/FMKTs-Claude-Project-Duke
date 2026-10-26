import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { BASKET } from '../finance/basket';
import { Batched } from './Batched';
import type { V3 } from './builder';
import { buildBasketProp } from './props/basketProps';

/** The six basket items pop up in an arc in front of the traveler when Tab B is open. */
export function BasketProps({ visible, anchor, animate }: { visible: boolean; anchor: V3; animate: boolean }) {
  const builders = useMemo(() => BASKET.map((i) => buildBasketProp(i.id)), []);
  const groups = useRef<(Group | null)[]>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current = visible ? t.current + dt : Math.max(0, t.current - dt * 3);
    groups.current.forEach((g, i) => {
      if (!g) return;
      const local = animate ? Math.min(1, Math.max(0, (t.current - i * 0.09) / 0.45)) : visible ? 1 : 0;
      // Overshooting "pop": ease-out-back.
      const c = 1.70158;
      const s = local <= 0 ? 0 : 1 + (c + 1) * (local - 1) ** 3 + c * (local - 1) ** 2;
      g.scale.setScalar(Math.max(0.0001, s * 2.1));
      g.visible = s > 0.001;
    });
  });
  return (
    <group position={anchor}>
      {builders.map((b, i) => {
        const angle = ((i - 2.5) / 5) * 1.25;
        return (
          <group
            key={BASKET[i]!.id}
            ref={(g) => {
              groups.current[i] = g;
            }}
            position={[Math.sin(angle) * 5.2, 0, -Math.cos(angle) * 5.2 + 5.2]}
            rotation={[0, -angle, 0]}
          >
            <Batched builder={b} />
          </group>
        );
      })}
    </group>
  );
}
