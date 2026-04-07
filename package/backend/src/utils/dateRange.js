const PERIODS = [
  { value: "last-7-days", label: "Last 7 Days", days: 7 },
  { value: "last-30-days", label: "Last 30 Days", days: 30 },
  { value: "last-90-days", label: "Last 90 Days", days: 90 },
  { value: "year-to-date", label: "Year To Date", days: null },
  { value: "custom", label: "Custom Range", days: null }
];

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatDate(dateValue) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

export function formatDateLabel(dateValue) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
  }).format(new Date(dateValue));
}

export function getPeriodOptions() {
  return PERIODS;
}

export function resolveDateRange({ period, startDate, endDate } = {}) {
  if (startDate && endDate) {
    return { startDate, endDate };
  }

  const today = new Date();
  const safePeriod = period || "last-30-days";
  const selected = PERIODS.find((item) => item.value === safePeriod);

  if (selected?.value === "year-to-date") {
    return {
      startDate: formatDate(new Date(today.getFullYear(), 0, 1)),
      endDate: formatDate(today)
    };
  }

  const days = selected?.days || 30;
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  return {
    startDate: formatDate(start),
    endDate: formatDate(today)
  };
}

