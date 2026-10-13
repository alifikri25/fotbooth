import { useId } from 'react';
import { Sparkles } from 'lucide-react';
import { photoEffects, type PhotoEffectId } from '../core/effects';
export function PhotoEffects({
  effect = 'none',
  intensity = 1,
  disabled = false,
  onChange,
}: {
  effect?: PhotoEffectId;
  intensity?: number;
  disabled?: boolean;
  onChange: (effect: PhotoEffectId, intensity: number) => void;
}) {
  const id = useId();
  return (
    <fieldset className="photo-effects" disabled={disabled}>
      <legend>
        <Sparkles size={15} /> Efek foto
      </legend>
      <div className="effect-options">
        {photoEffects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`effect-option ${p.id === effect ? 'active' : ''}`}
            aria-label={`Efek ${p.name}`}
            aria-pressed={p.id === effect}
            onClick={() => onChange(p.id, intensity === 0 ? 1 : intensity)}
          >
            <span
              className="effect-swatch"
              aria-hidden="true"
              style={{ background: `linear-gradient(135deg,${p.colors[0]},${p.colors[1]})` }}
            />
            {p.name}
          </button>
        ))}
      </div>
      <label className="range-label" htmlFor={id}>
        Intensitas efek <span>{Math.round(intensity * 100)}%</span>
      </label>
      <input
        id={id}
        type="range"
        min="0"
        max="1"
        step=".05"
        value={intensity}
        disabled={disabled || effect === 'none'}
        onChange={(e) => onChange(effect, Number(e.target.value))}
      />
      <p className="control-help">
        Efek bisa diganti kapan saja. Foto asli tetap tersimpan selama sesi.
      </p>
    </fieldset>
  );
}
