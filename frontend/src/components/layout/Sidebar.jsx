export default function Sidebar({
  dashboards,
  activeDashboard,
  onSelectDashboard
}) {
  return (
    <aside className="sidebar panel">
      <div className="brand-block">
        <h1 className="brand-title">Tata Play Fiber</h1>
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
            <span className="nav-title">{dashboard.title}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
