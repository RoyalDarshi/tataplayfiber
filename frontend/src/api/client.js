const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(pathname, params = {}) {
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
