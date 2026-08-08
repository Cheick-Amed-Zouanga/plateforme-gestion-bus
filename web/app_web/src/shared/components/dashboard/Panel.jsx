function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`dash-panel ${className}`.trim()}>
      {(title || action) && (
        <div className="dash-panel-head">
          <div>
            {title ? <h2 className="dash-panel-title">{title}</h2> : null}
            {subtitle ? <p className="dash-panel-sub">{subtitle}</p> : null}
          </div>
          {action || null}
        </div>
      )}
      {children}
    </section>
  );
}

export default Panel;
