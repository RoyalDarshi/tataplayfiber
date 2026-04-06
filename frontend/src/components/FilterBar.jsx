const SELECT_FIELDS = [
  { key: "circle", label: "Circle", source: "circles" },
  { key: "city", label: "City", source: "cities" },
  { key: "cluster", label: "Cluster", source: "clusters" },
  { key: "society", label: "Society", source: "societies" },
  { key: "manager", label: "Manager", source: "managers" },
  { key: "role", label: "Role", source: "roles" },
  { key: "kpi", label: "KPI", source: "kpis" },
  { key: "period", label: "Period", source: "periods" }
];

export default function FilterBar({
  filters,
  options,
  fields = SELECT_FIELDS,
  onFilterChange,
  onResetFilters,
  loading
}) {
  return (
    <section className="panel filter-panel">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Controls</p>
          <h2 className="section-title">Interactive Filters</h2>
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={onResetFilters}
          disabled={loading}
        >
          Reset filters
        </button>
      </div>

      <div className="filter-grid">
        {fields.map((field) => (
          <label key={field.key} className="form-field">
            <span>{field.label}</span>
            <select
              className="control"
              value={filters[field.key] || ""}
              onChange={(event) =>
                onFilterChange(field.key, event.target.value)
              }
              disabled={loading}
            >
              {field.key !== "period" && <option value="All">All</option>}
              {(options?.[field.source] || []).map((option) => {
                const value = typeof option === "string" ? option : option.value;
                const label = typeof option === "string" ? option : option.label;

                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
        ))}

        <label className="form-field">
          <span>Start Date</span>
          <input
            type="date"
            className="control"
            value={filters.startDate}
            onChange={(event) =>
              onFilterChange("startDate", event.target.value)
            }
            disabled={loading}
          />
        </label>

        <label className="form-field">
          <span>End Date</span>
          <input
            type="date"
            className="control"
            value={filters.endDate}
            onChange={(event) => onFilterChange("endDate", event.target.value)}
            disabled={loading}
          />
        </label>
      </div>
    </section>
  );
}

