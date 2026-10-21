import { useCountUp } from '../hooks/useCountUp';

type Props = { top: string; value: number; bottom: string; format: (v: number) => string };

/** Reference-video HUD: small caps label, giant serif number, small caps label. */
export function HudNumber({ top, value, bottom, format }: Props) {
  const shown = useCountUp(value);
  return (
    <div className="text-white">
      <div className="hud-label">{top}</div>
      <div className="hud-number" aria-label={`${top} ${format(value)} ${bottom}`}>
        {format(shown)}
      </div>
      <div className="hud-label">{bottom}</div>
    </div>
  );
}
