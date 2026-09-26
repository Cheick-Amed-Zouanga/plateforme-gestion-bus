function ActionButton({ children, onClick, variant = "neutral", type = "button", disabled = false }) {
  return (
    <button
      type={type}
      className={`dash-btn dash-btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default ActionButton;
