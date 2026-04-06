import { useEffect, useState } from "react";
import {
  fetchDashboardData,
  fetchDashboards,
  fetchFilters
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
  ["kpi", "kpis"]
];

const INITIAL_FILTERS = {
  circle: "All",
  city: "All",
  cluster: "All",
  society: "All",
  manager: "All",
  role: "All",
  kpi: "All",
  period: "last-30-days",
  startDate: "",
  endDate: ""
};

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
    if (
      currentValue !== "All" &&
      !(options?.[sourceKey] || []).includes(currentValue)
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
          dashboardResponse.dashboards?.[0]?.id || "sales-overview"
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
          fetchFilters(filters)
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
    filters.kpi,
    filters.period,
    filters.startDate,
    filters.endDate
  ]);

  useEffect(() => {
    if (!filterOptions) {
      return;
    }

    setFilters((current) => normalizeFilters(current, filterOptions));
  }, [filterOptions]);

  function handleFilterChange(field, value) {
    setFilters((current) => {
      if (field === "period") {
        return {
          ...current,
          period: value,
          ...(value === "custom" ? {} : { startDate: "", endDate: "" })
        };
      }

      if (field === "startDate" || field === "endDate") {
        return {
          ...current,
          [field]: value,
          period: "custom"
        };
      }

      return {
        ...current,
        [field]: value
      };
    });
  }

  function handleResetFilters() {
    setFilters({
      ...INITIAL_FILTERS,
      period: filterOptions?.periods?.[1]?.value || "last-30-days"
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
    "--surface-glow": activeMeta?.glow || "rgba(95, 224, 176, 0.28)"
  };
  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="app-shell" style={themeStyle}>
      <Sidebar
        dashboards={dashboards}
        activeDashboard={activeDashboard}
        onSelectDashboard={setActiveDashboard}
      />

      <main className="content">
        <section className="hero-panel panel">
          <div>
            <p className="section-kicker">Multi Dashboard Suite</p>
            <h2 className="hero-title">
              {activeMeta?.title || "Fiber Dashboard"}
            </h2>
            <p className="hero-copy">
              {activeMeta?.description ||
                "Modern, responsive KPI and charting dashboard for fiber performance."}
            </p>

            <div className="chip-row">
              <span className="chip">
                {formatDateRange(
                  dashboardData?.meta?.dateRange?.startDate,
                  dashboardData?.meta?.dateRange?.endDate
                )}
              </span>
              <span className="chip">
                {formatNumber(dashboardData?.meta?.totalRecords)} rows
              </span>
              <span className="chip">{activeFilterCount} active filters</span>
              {loadingData && <span className="chip chip--live">Refreshing</span>}
            </div>
          </div>

          <aside className="highlight-card">
            <span className="highlight-kicker">
              {dashboardData?.highlight?.eyebrow || "Highlight"}
            </span>
            <strong className="highlight-title">
              {dashboardData?.highlight?.title || "Ready"}
            </strong>
            <div className="highlight-value">
              {formatNumber(dashboardData?.highlight?.value)}
            </div>
            <p className="highlight-copy">
              {dashboardData?.highlight?.secondary ||
                "Seed the database to view the latest aggregated performance."}
            </p>
            <span className="highlight-chip">
              {dashboardData?.highlight?.deltaLabel || "Modern responsive layout"}
            </span>
          </aside>
        </section>

        <FilterBar
          filters={filters}
          options={filterOptions}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          loading={loadingData}
        />

        {error ? (
          <section className="panel error-panel">{error}</section>
        ) : dashboardData ? (
          <>
            <SummaryStats summary={dashboardData.summary} />
            <DashboardContent
              dashboardId={activeDashboard}
              data={dashboardData}
              accent={activeMeta?.accent || "#5fe0b0"}
            />
          </>
        ) : (
          <section className="panel loading-panel">Loading dashboard data...</section>
        )}
      </main>
    </div>
  );
}
