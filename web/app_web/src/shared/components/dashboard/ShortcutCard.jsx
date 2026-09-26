function ShortcutCard({ icon, title, description, onClick, accent = "#304FFE", disabled = false }) {
  return (
    <button
      type="button"
      className="dash-shortcut"
      style={{ "--sc-accent": accent }}
      onClick={onClick}
      disabled={disabled}
    >
      <div>
        <div className="dash-shortcut-ico">{icon}</div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {disabled ? <span className="dash-badge soon">Bientôt</span> : null}
    </button>
  );
}

export default ShortcutCard;
