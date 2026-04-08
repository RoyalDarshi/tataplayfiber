import HierarchyHoverFilter from "./HierarchyHoverFilter.jsx";

const SELECT_FIELDS = [
  { key: "circle", label: "Circle", source: "circles" },
  { key: "city", label: "City", source: "cities" },
  { key: "cluster", label: "Cluster", source: "clusters" },
  { key: "society", label: "Society", source: "societies" },
  { key: "manager", label: "Manager", source: "managers" },
  { key: "role", label: "Role", source: "roles" },
  { key: "hierarchy", label: "Hierarchy", source: "managerHierarchy" },
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
  const showDateRangeControls = fields.some((field) => field.key === "period");

  return (
    <div className="filter-grid">
      {fields.map((field) => (
        <label key={field.key} className="form-field">
          <span>{field.label}</span>
          {field.key === "hierarchy" ? (
            <HierarchyHoverFilter
              value={filters.hierarchy || "All"}
              options={options?.managerHierarchy || []}
              disabled={loading}
              onChange={(nextValue) => onFilterChange("hierarchy", nextValue)}
            />
          ) : (
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
          )}
        </label>
      ))}

      {showDateRangeControls ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
