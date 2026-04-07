import { useEffect, useState } from "react";
import {
  fetchDashboardData,
  fetchDashboards,
  fetchFilters,
} from "./api/client.js";
import FilterBar from "./components/FilterBar.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import SummaryStats from "./components/SummaryStats.jsx";
import DashboardContent from "./pages/DashboardContent.jsx";
import { formatDateRange, formatNumber } from "./utils/formatters.js";

const CASCADING_FILTER_FIELDS = [
  ["circle", "circles"],
  ["city", "cities"],
  ["cluster", "clusters"],
  ["society", "societies"],
  ["manager", "managers"],
  ["role", "roles"],
  ["hierarchy", "managerHierarchy"],
  ["kpi", "kpis"],
];

const INITIAL_FILTERS = {
  circle: "All",
  city: "All",
  cluster: "All",
  society: "All",
  manager: "All",
  role: "All",
  hierarchy: "All",
  asi: "All",
  csm: "All",
  asm: "All",
  kpi: "All",
  period: "last-30-days",
  startDate: "",
  endDate: "",
};

const PERFORMANCE_FILTER_FIELDS = [
  { key: "circle", label: "Circle", source: "circles" },
  { key: "city", label: "City", source: "cities" },
  { key: "cluster", label: "Cluster", source: "clusters" },
  { key: "society", label: "Society", source: "societies" },
  { key: "manager", label: "Manager", source: "managers" },
  { key: "hierarchy", label: "Hierarchy", source: "managerHierarchy" },
  { key: "kpi", label: "KPI", source: "kpis" },
  { key: "period", label: "Period", source: "periods" },
];

const COMPARE_FILTER_FIELDS = [
  { key: "circle", label: "Circle", source: "circles" },
  { key: "city", label: "City", source: "cities" },
  { key: "cluster", label: "Cluster", source: "clusters" },
  { key: "society", label: "Society", source: "societies" },
  { key: "role", label: "Role", source: "roles" },
  { key: "hierarchy", label: "Hierarchy", source: "managerHierarchy" },
  { key: "kpi", label: "KPI", source: "kpis" },
  { key: "period", label: "Period", source: "periods" },
];

const ATTENDANCE_FILTER_FIELDS = [
  { key: "circle", label: "State", source: "circles" },
  { key: "city", label: "City", source: "cities" },
  { key: "cluster", label: "ASM", source: "clusters" },
  { key: "society", label: "CSM", source: "societies" },
  { key: "manager", label: "Manager", source: "managers" },
  { key: "role", label: "Role", source: "roles" },
  { key: "kpi", label: "Status", source: "kpis" },
  { key: "period", label: "Period", source: "periods" },
];

function countActiveFilters(filters) {
  return Object.entries(filters).reduce((total, [key, value]) => {
    if (key === "period") {
      return value && value !== "last-30-days" ? total + 1 : total;
    }

    return value && value !== "All" && value !== "" ? total + 1 : total;
  }, 0);
}

function normalizeFilters(currentFilters, options) {
  let nextFilters = currentFilters;
  let hasChanges = false;

  CASCADING_FILTER_FIELDS.forEach(([filterKey, sourceKey]) => {
    const currentValue = nextFilters[filterKey];
    const sourceValues = (options?.[sourceKey] || []).map((item) =>
      typeof item === "string" ? item : item?.value,
    );
    if (
      currentValue !== "All" &&
      !sourceValues.includes(currentValue)
    ) {
      if (!hasChanges) {
        nextFilters = { ...nextFilters };
      }

      nextFilters[filterKey] = "All";
      hasChanges = true;
    }
  });

  return hasChanges ? nextFilters : currentFilters;
}

export default function App() {
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState("");
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoadingMeta(true);
        const dashboardResponse = await fetchDashboards();

        if (cancelled) {
          return;
        }

        setDashboards(dashboardResponse.dashboards || []);
        setActiveDashboard(
          dashboardResponse.dashboards?.[0]?.id || "sales-overview",
        );
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingMeta(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeDashboard) {
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoadingData(true);
        setError("");
        const [payload, nextFilterOptions] = await Promise.all([
          fetchDashboardData(activeDashboard, filters),
          fetchFilters(activeDashboard, filters),
        ]);

        if (!cancelled) {
          setDashboardData(payload);
          setFilterOptions(nextFilterOptions);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [
    activeDashboard,
    filters.circle,
    filters.city,
    filters.cluster,
    filters.society,
    filters.manager,
    filters.role,
    filters.asi,
    filters.csm,
    filters.asm,
    filters.kpi,
    filters.period,
    filters.startDate,
    filters.endDate,
  ]);

  useEffect(() => {
    if (!filterOptions) {
      return;
    }

    setFilters((current) => normalizeFilters(current, filterOptions));
  }, [filterOptions]);

  useEffect(() => {
    if (activeDashboard !== "compare-dashboard") {
      return;
    }

    setFilters((current) => ({
      ...current,
      ...(current.manager === "All" ? {} : { manager: "All" }),
      ...(current.asi === "All" ? {} : { asi: "All" }),
      ...(current.csm === "All" ? {} : { csm: "All" }),
      ...(current.asm === "All" ? {} : { asm: "All" })
    }));
  }, [activeDashboard]);

  function handleFilterChange(field, value) {
    setFilters((current) => {
      if (field === "period") {
        return {
          ...current,
          period: value,
          ...(value === "custom" ? {} : { startDate: "", endDate: "" }),
        };
      }

      if (field === "startDate" || field === "endDate") {
        return {
          ...current,
          [field]: value,
          period: "custom",
        };
      }

      const nextFilters = {
        ...current,
        [field]: value,
      };

      if (field === "hierarchy") {
        if (value === "All") {
          nextFilters.asi = "All";
          nextFilters.csm = "All";
          nextFilters.asm = "All";
        } else {
          const [level, name] = value.split("|");
          if (level === "asi") {
            nextFilters.asi = name;
            nextFilters.csm = "All";
            nextFilters.asm = "All";
          } else if (level === "csm") {
            nextFilters.csm = name;
            nextFilters.asm = "All";
          } else if (level === "asm") {
            nextFilters.asm = name;
          }
        }
      }

      return nextFilters;
    });
  }

  function handleResetFilters() {
    setFilters({
      ...INITIAL_FILTERS,
      period: filterOptions?.periods?.[1]?.value || "last-30-days",
    });
  }

  if (loadingMeta && !dashboards.length) {
    return (
      <div className="app-loading">
        <div className="panel loading-panel">
          Building the dashboard workspace...
        </div>
      </div>
    );
  }

  const activeMeta =
    dashboardData?.meta ||
    dashboards.find((dashboard) => dashboard.id === activeDashboard) ||
    dashboards[0];
  const themeStyle = {
    "--accent": activeMeta?.accent || "#5fe0b0",
    "--accent-soft": activeMeta?.accentSoft || "rgba(95, 224, 176, 0.22)",
    "--surface-glow": activeMeta?.glow || "rgba(95, 224, 176, 0.28)",
  };
  const activeFilterCount = countActiveFilters(filters);
  const filterFields =
    activeDashboard === "manager-pulse"
      ? ATTENDANCE_FILTER_FIELDS
      : activeDashboard === "compare-dashboard"
        ? COMPARE_FILTER_FIELDS
        : PERFORMANCE_FILTER_FIELDS;
  const showSharedSummary = activeDashboard === "sales-overview";

  return (
    <div className="app-shell" style={themeStyle}>
      <Sidebar
        dashboards={dashboards}
        activeDashboard={activeDashboard}
        onSelectDashboard={setActiveDashboard}
      />

      <main className="content">
        <section
          className="panel filter-panel"
          style={{ padding: "14px 20px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "35px 1fr 35px",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <div />
            <h2
              className="hero-title"
              style={{ margin: 0, textAlign: "center", fontSize: "2.5rem" }}
            >
              {activeMeta?.title || "Fiber Dashboard"}
            </h2>
            <button
              type="button"
              className="button button--secondary"
              onClick={handleResetFilters}
              disabled={loadingData}
              style={{
                width: "35px",
                height: "35px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "0",
                borderRadius: "12px",
                justifySelf: "end",
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
          <FilterBar
            filters={filters}
            options={filterOptions}
            fields={filterFields}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            loading={loadingData}
          />
        </section>

        {error ? (
          <section className="panel error-panel">{error}</section>
        ) : dashboardData ? (
          <>
            {/* {showSharedSummary && (
              <SummaryStats summary={dashboardData.summary} maxCards={4} />
            )} */}
            <DashboardContent
              dashboardId={activeDashboard}
              data={dashboardData}
              accent={activeMeta?.accent || "#5fe0b0"}
              filters={filters}
              filterOptions={filterOptions}
            />
          </>
        ) : (
          <section className="panel loading-panel">
            Loading dashboard data...
          </section>
        )}
      </main>
    </div>
  );
}
