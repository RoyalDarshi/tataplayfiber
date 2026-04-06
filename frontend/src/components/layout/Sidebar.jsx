export default function Sidebar({
  dashboards,
  activeDashboard,
  onSelectDashboard
}) {
  return (
    <aside className="sidebar panel">
      <div className="brand-block">
        <p className="brand-kicker">Tata Play Fiber</p>
        <h1 className="brand-title">Dashboard Studio</h1>
        <p className="brand-copy">
          Modern React dashboards with responsive KPI cards, charts, filters,
          and reusable layouts for multiple business views.
        </p>
      </div>

      <nav className="sidebar-nav">
        {dashboards.map((dashboard) => (
          <button
            key={dashboard.id}
            type="button"
            className={`nav-button ${
              activeDashboard === dashboard.id ? "is-active" : ""
            }`}
            onClick={() => onSelectDashboard(dashboard.id)}
          >
            <span className="nav-label">{dashboard.shortLabel}</span>
            <span className="nav-title">{dashboard.title}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-note">Responsive by design</p>
        <p className="sidebar-copy">
          Desktop gets a full command-center layout. Tablet and mobile stack
          into a touch-friendly flow without losing charts or filters.
        </p>
      </div>
    </aside>
  );
}

