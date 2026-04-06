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

const CASCADING_FILTER_FIELDS = [
  ["circle", "circles"],
  ["city", "cities"],
  ["cluster", "clusters"],
  ["society", "societies"],
  ["manager", "managers"],
  ["role", "roles"]
];

const INITIAL_FILTERS = {
  circle: "All",
  city: "All",
  cluster: "All",
  society: "All",
  manager: "All",
  role: "All",
  period: "last-30-days",
  startDate: "",
  endDate: ""
};

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

  return (
    <div className="app-shell" style={themeStyle}>
      <Sidebar
        dashboards={dashboards}
        activeDashboard={activeDashboard}
        onSelectDashboard={setActiveDashboard}
      />

      <main className="content">
        <section className="hero-panel hero-panel--simple panel">
          <h2 className="hero-title hero-title--compact">
            {activeMeta?.title || "Fiber Dashboard"}
          </h2>
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
            <DashboardContent
              dashboardId={activeDashboard}
              data={dashboardData}
              accent={activeMeta?.accent || "#5fe0b0"}
            />
            <SummaryStats summary={dashboardData.summary} />
          </>
        ) : (
          <section className="panel loading-panel">Loading dashboard data...</section>
        )}
      </main>
    </div>
  );
}
