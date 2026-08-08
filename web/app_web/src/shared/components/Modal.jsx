import { useEffect } from "react";

function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dash-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`dash-modal${wide ? " dash-modal-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="dash-modal-head">
          <h2 className="dash-modal-title">{title}</h2>
          <button type="button" className="dash-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>
        <div className="dash-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
