import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { tokens } from './design/tokens';
import { loadMeta } from './data/load';
import type { Meta } from './data/types';

// M0 placeholder: a blank, styled canvas proving the stack, fonts and data snapshot load.
export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    loadMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 40 }}
        style={{ background: `linear-gradient(to bottom, ${tokens.cream}, ${tokens.sunGold})` }}
      >
        <fog attach="fog" args={[tokens.cream, 10, 30]} />
        <hemisphereLight args={[tokens.cream, tokens.terracotta, 0.6]} />
        <directionalLight position={[5, 8, 4]} intensity={1.6} color={tokens.sunGold} castShadow />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
        <p className="caption">How far does your money really go?</p>
      </div>
      <div className="absolute top-5 left-6 hud-label text-ink" style={{ textShadow: "none" }}>Coin Atlas</div>
      <footer className="absolute right-4 bottom-3 font-sans text-xs font-medium text-ink/80">
        Data last updated {meta ? new Date(meta.generatedAt).toLocaleDateString() : '—'}
      </footer>
    </div>
  );
}
