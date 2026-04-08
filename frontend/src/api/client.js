const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const CACHE_TTL_MS = 2 * 60 * 1000;
const responseCache = new Map();

function buildCacheKey(pathname, params) {
  const entries = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return `${pathname}?${entries.map(([k, v]) => `${k}=${String(v)}`).join("&")}`;
}

async function request(pathname, params = {}, { useCache = true } = {}) {
  const cacheKey = buildCacheKey(pathname, params);
  const now = Date.now();
  const cached = responseCache.get(cacheKey);
  if (useCache && cached && now - cached.at < CACHE_TTL_MS) {
    return cached.payload;
  }

  const url = new URL(pathname, `${API_BASE_URL}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Unable to load data from the API.");
  }

  if (useCache) {
    responseCache.set(cacheKey, { at: now, payload });
  }

  return payload;
}

export function fetchDashboards() {
  return request("dashboards", {}, { useCache: true });
}

export function fetchFilters(dashboardId, filters = {}) {
  return request("filters", { dashboardId, ...filters }, { useCache: true });
}

export function fetchDashboardData(dashboardId, filters) {
  return request(`dashboards/${dashboardId}`, filters, { useCache: true });
}
