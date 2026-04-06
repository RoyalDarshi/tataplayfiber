const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(pathname, params = {}) {
  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const url = normalizedBase.startsWith("http://") ||
    normalizedBase.startsWith("https://")
    ? new URL(pathname, `${normalizedBase}/`)
    : new URL(`${normalizedBase}/${pathname}`, window.location.origin);

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

  return payload;
}

export function fetchDashboards() {
  return request("dashboards");
}

export function fetchFilters(filters = {}) {
  return request("filters", filters);
}

export function fetchDashboardData(dashboardId, filters) {
  return request(`dashboards/${dashboardId}`, filters);
}
