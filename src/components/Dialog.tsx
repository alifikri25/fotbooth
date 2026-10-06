import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({
  label,
  children,
  onClose,
  returnFocus,
}: {
  label: string;
  children: ReactNode;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!,
      previous = returnFocus ?? (document.activeElement as HTMLElement);
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-content">
        <button className="icon-button dialog-close" aria-label="Tutup dialog" onClick={onClose}>
          <X size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
