function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="dash-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="dash-actions">{actions}</div> : null}
    </header>
  );
}

export default PageHeader;
