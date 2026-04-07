const SELECT_FIELDS = [
  { key: "circle", label: "Circle", source: "circles" },
  { key: "city", label: "City", source: "cities" },
  { key: "cluster", label: "Cluster", source: "clusters" },
  { key: "society", label: "Society", source: "societies" },
  { key: "manager", label: "Manager", source: "managers" },
  { key: "role", label: "Role", source: "roles" },
  { key: "kpi", label: "KPI", source: "kpis" },
  { key: "period", label: "Period", source: "periods" },
];

export default function FilterBar({
  filters,
  options,
  fields = SELECT_FIELDS,
  onFilterChange,
  onResetFilters,
  loading,
}) {
  return (
    <div className="filter-grid">
      {fields.map((field) => (
        <label key={field.key} className="form-field">
          <span>{field.label}</span>
          <select
            className="control"
            value={filters[field.key] || ""}
            onChange={(event) => onFilterChange(field.key, event.target.value)}
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
          onChange={(event) => onFilterChange("startDate", event.target.value)}
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

      <div className="form-field" style={{ justifyContent: "flex-end" }}>
        <span>&nbsp;</span>
        <button
          type="button"
          className="button button--secondary"
          onClick={onResetFilters}
          disabled={loading}
          style={{
            width: "35px",
            height: "35px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "0",
            borderRadius: "12px",
          }}
          title="Reset Filters"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
