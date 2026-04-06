import { formatDate, formatDateLabel } from "../utils/dateRange.js";

function round(value) {
  return Number(value.toFixed(1));
}

function calculatePercentage(value, total) {
  if (!total) {
    return 0;
  }

  return round((value / total) * 100);
}

function sumRows(rows, field) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

function sortByNumericValue(items, key) {
  return [...items].sort((left, right) => Number(right[key] || 0) - Number(left[key] || 0));
}

function groupBy(rows, keyBuilder) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = keyBuilder(row);
    const bucket = grouped.get(key) || [];
    bucket.push(row);
    grouped.set(key, bucket);
  });

  return grouped;
}

function buildHomePassSummary(rows) {
  const homePassed = sumRows(rows, "home_passed");
  const customers = sumRows(rows, "customer_base");
  const uniqueCities = new Set(rows.map((row) => row.city)).size;
  const uniqueSocieties = new Set(rows.map((row) => row.society)).size;
  const uniqueManagers = new Set(rows.map((row) => row.manager_name)).size;
  const connectRatePct = calculatePercentage(customers, homePassed);

  return {
    homePassed,
    customers,
    connectRatePct,
    cards: [
      {
        label: "Home Passed",
        value: homePassed,
        format: "number",
        detail: "Total serviceable homes"
      },
      {
        label: "Customers",
        value: customers,
        format: "number",
        detail: "Active connection base"
      },
      {
        label: "Connect Rate",
        value: connectRatePct,
        format: "percent",
        detail: "Customers vs home pass"
      },
      {
        label: "Cities",
        value: uniqueCities,
        format: "number",
        detail: "Live operating markets"
      },
      {
        label: "Societies",
        value: uniqueSocieties,
        format: "number",
        detail: "Coverage footprint"
      },
      {
        label: "Managers",
        value: uniqueManagers,
        format: "number",
        detail: "Managers in coverage"
      },
      {
        label: "Avg / Society",
        value: uniqueSocieties ? round(homePassed / uniqueSocieties) : 0,
        format: "number",
        detail: "Home pass density"
      },
      {
        label: "Avg Cust / City",
        value: uniqueCities ? round(customers / uniqueCities) : 0,
        format: "number",
        detail: "Demand concentration"
      }
    ]
  };
}

function buildHomePassSeries(rows) {
  const grouped = groupBy(rows, (row) => formatDate(row.record_date));

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, bucket]) => ({
      date,
      label: formatDateLabel(date),
      homePassed: sumRows(bucket, "home_passed"),
      customers: sumRows(bucket, "customer_base")
    }));
}

function buildHomePassCoverage(rows, keyBuilder) {
  return sortByNumericValue(
    [...groupBy(rows, keyBuilder).entries()].map(([key, bucket]) => ({
      key,
      homePassed: sumRows(bucket, "home_passed"),
      customers: sumRows(bucket, "customer_base"),
      connectRatePct: calculatePercentage(
        sumRows(bucket, "customer_base"),
        sumRows(bucket, "home_passed")
      ),
      cities: new Set(bucket.map((row) => row.city)).size,
      societies: new Set(bucket.map((row) => row.society)).size,
      managers: new Set(bucket.map((row) => row.manager_name)).size,
      sharePct: calculatePercentage(
        sumRows(bucket, "home_passed"),
        sumRows(rows, "home_passed")
      )
    })),
    "homePassed"
  );
}

function buildHomePassCircleCoverage(rows) {
  return buildHomePassCoverage(rows, (row) => row.circle).map((item) => ({
    ...item,
    label: item.key
  }));
}

function buildHomePassCityCoverage(rows) {
  return buildHomePassCoverage(rows, (row) => `${row.city}|${row.circle}`)
    .map((item) => {
      const [city, circle] = item.key.split("|");

      return {
        ...item,
        label: city,
        city,
        circle
      };
    })
    .slice(0, 8);
}

function buildHomePassSocietyCoverage(rows) {
  return buildHomePassCoverage(rows, (row) => `${row.society}|${row.cluster}|${row.city}`)
    .map((item) => {
      const [society, cluster, city] = item.key.split("|");

      return {
        ...item,
        label: society,
        society,
        cluster,
        city
      };
    })
    .slice(0, 8);
}

function buildHomePassConversionHotspots(rows) {
  return buildHomePassCoverage(rows, (row) => `${row.city}|${row.circle}`)
    .map((item) => {
      const [city, circle] = item.key.split("|");

      return {
        ...item,
        label: city,
        city,
        circle
      };
    })
    .filter((item) => item.homePassed > 0)
    .sort((left, right) => {
      if (right.connectRatePct !== left.connectRatePct) {
        return right.connectRatePct - left.connectRatePct;
      }

      return right.customers - left.customers;
    })
    .slice(0, 6);
}

function buildHomePassManagerRows(rows) {
  return sortByNumericValue(
    [...groupBy(rows, (row) => `${row.manager_name}|${row.role}|${row.city}`)].map(
      ([compoundKey, bucket]) => {
        const [name, role, city] = compoundKey.split("|");
        const homePassed = sumRows(bucket, "home_passed");
        const customers = sumRows(bucket, "customer_base");

        return {
          name,
          role,
          city,
          circle: bucket[0].circle,
          homePassed,
          customers,
          connectRatePct: calculatePercentage(customers, homePassed),
          societies: new Set(bucket.map((row) => row.society)).size
        };
      }
    ),
    "homePassed"
  ).slice(0, 10);
}

function buildHomePassHighlight(circles) {
  const leader = circles[0];

  return leader
    ? {
        eyebrow: "Top Circle",
        title: leader.label,
        value: leader.homePassed,
        secondary: `${leader.connectRatePct}% connect rate`,
        deltaLabel: `${leader.customers.toLocaleString("en-IN")} active customers`
      }
    : null;
}

function buildHomePassInsights({ summary, circles, cities, managers, hotspots }) {
  const topCircle = circles[0];
  const topCity = cities[0];
  const topManager = managers[0];
  const topHotspot = hotspots[0];
  const insights = [];

  if (topCircle) {
    insights.push(
      `${topCircle.label} carries ${calculatePercentage(
        topCircle.homePassed,
        summary.homePassed
      )}% of the current home pass footprint.`
    );
  }

  if (topCity) {
    insights.push(
      `${topCity.city}, ${topCity.circle} is converting ${topCity.connectRatePct}% of its home pass into customers.`
    );
  }

  if (topHotspot) {
    insights.push(
      `${topHotspot.city} is the top conversion hotspot at ${topHotspot.connectRatePct}% connect rate.`
    );
  }

  if (topManager) {
    insights.push(
      `${topManager.name} manages ${topManager.homePassed.toLocaleString(
        "en-IN"
      )} home pass with ${topManager.societies} societies in scope.`
    );
  }

  insights.push(
    `Overall connect rate is ${summary.connectRatePct}% across the selected coverage footprint.`
  );

  return insights;
}

export function buildHomePassPayload(activeDashboard, rows, dateWindow, filters) {
  const summary = buildHomePassSummary(rows);
  const circles = buildHomePassCircleCoverage(rows);
  const cities = buildHomePassCityCoverage(rows);
  const societies = buildHomePassSocietyCoverage(rows);
  const hotspots = buildHomePassConversionHotspots(rows);
  const managers = buildHomePassManagerRows(rows);

  return {
    meta: {
      ...activeDashboard,
      totalRecords: rows.length,
      dateRange: dateWindow
    },
    summary,
    highlight: buildHomePassHighlight(circles),
    insights: buildHomePassInsights({
      summary,
      circles,
      cities,
      managers,
      hotspots
    }),
    totalSeries: buildHomePassSeries(rows),
    circles: circles.slice(0, 6),
    cities,
    hotspots,
    societies,
    managers,
    filtersApplied: {
      ...filters,
      ...dateWindow
    }
  };
}
