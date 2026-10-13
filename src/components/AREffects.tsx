import { arEffects } from '../core/ar/effects';
import type { AREffectId } from '../core/ar/types';
export function AREffects({
  effect,
  disabled,
  state,
  onChange,
  onRetry,
}: {
  effect: AREffectId;
  disabled: boolean;
  state: { phase: string; message: string };
  onChange: (effect: AREffectId) => void;
  onRetry: () => void;
}) {
  return (
    <fieldset className="ar-effects" disabled={disabled}>
      <legend>
        AR playground <span>16 efek</span>
      </legend>
      <p className="control-help">
        Aksesori mengikuti wajah. Smile Confetti aktif saat senyum; Comic Boom juga saat mulut
        terbuka.
      </p>
      {(['Wajah', 'Reaksi', 'Latar'] as const).map((group) => (
        <div className="ar-group" key={group}>
          <span className="ar-group-label">{group}</span>
          <div className="ar-options">
            {arEffects
              .filter((item) => item.group === group)
              .map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={effect === item.id ? 'ar-choice active' : 'ar-choice'}
                  aria-label={`AR ${item.name}`}
                  aria-pressed={effect === item.id}
                  onClick={() => onChange(item.id)}
                >
                  <span className="ar-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
      <p className={`ar-status ${state.phase}`} data-testid="ar-status" role="status">
        {state.message}
      </p>
      {state.phase === 'error' && (
        <button className="small-button" type="button" onClick={onRetry}>
          Coba AR lagi
        </button>
      )}
      <p className="control-help">
        Proses di perangkatmu. Efek ikut tersimpan dan bisa dimatikan lagi saat edit. Pelacakan
        hingga 2 wajah.
      </p>
    </fieldset>
  );
}
