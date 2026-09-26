function StatCard({ label, value, hint, accent = "#304FFE" }) {
  return (
    <article className="dash-stat" style={{ "--stat-accent": accent }}>
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-value">{value}</div>
      {hint ? <div className="dash-stat-hint">{hint}</div> : null}
    </article>
  );
}

export default StatCard;
