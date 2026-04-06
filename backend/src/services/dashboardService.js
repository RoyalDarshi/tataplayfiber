import pool from "../database.js";
import { getAttendanceFilterOptions, buildAttendancePayload } from "./attendanceService.js";
import { dashboardRegistry } from "../config/dashboardRegistry.js";
import { buildHomePassPayload } from "./homePassService.js";
import {
  formatDate,
  formatDateLabel,
  getPeriodOptions,
  resolveDateRange
} from "../utils/dateRange.js";

const FILTER_COLUMN_MAP = {
  circle: "circle",
  city: "city",
  cluster: "cluster",
  society: "society",
  manager: "manager_name",
  role: "role",
  kpi: "kpi_name"
};

function round(value) {
  return Number(value.toFixed(1));
}

function calculatePercentage(value, total) {
  if (!total) {
    return 0;
  }

  return round((value / total) * 100);
}

function calculateDelta(current, previous) {
  if (!previous) {
    return 0;
  }

  return round(((current - previous) / previous) * 100);
}

function sumRows(rows, field) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

function sortByMtd(items) {
  return [...items].sort((left, right) => right.mtd - left.mtd);
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

function aggregateSeries(rows, valueField) {
  const grouped = groupBy(rows, (row) => formatDate(row.record_date));

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, bucket]) => ({
      date,
      label: formatDateLabel(date),
      value: sumRows(bucket, valueField)
    }));
}

function buildTotalSeries(rows) {
  const grouped = groupBy(rows, (row) => formatDate(row.record_date));

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, bucket]) => ({
      date,
      label: formatDateLabel(date),
      mtd: sumRows(bucket, "mtd"),
      target: sumRows(bucket, "target"),
      ftd: sumRows(bucket, "ftd")
    }));
}

function buildSummary(rows) {
  const target = sumRows(rows, "target");
  const ftd = sumRows(rows, "ftd");
  const mtd = sumRows(rows, "mtd");
  const lm = sumRows(rows, "lm");
  const lmtd = sumRows(rows, "lmtd");
  const customers = sumRows(rows, "customer_base");
  const homePassed = sumRows(rows, "home_passed");

  return {
    target,
    ftd,
    mtd,
    lm,
    lmtd,
    customers,
    homePassed,
    achievementPct: calculatePercentage(mtd, target),
    momentumPct: calculateDelta(mtd, lmtd)
  };
}

function buildKpiCards(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => row.kpi_name).entries()].map(
      ([kpiName, bucket]) => {
        const target = sumRows(bucket, "target");
        const ftd = sumRows(bucket, "ftd");
        const mtd = sumRows(bucket, "mtd");
        const lm = sumRows(bucket, "lm");
        const lmtd = sumRows(bucket, "lmtd");

        return {
          kpiName,
          target,
          ftd,
          mtd,
          lm,
          lmtd,
          achievementPct: calculatePercentage(mtd, target),
          deltaPct: calculateDelta(mtd, lmtd),
          series: aggregateSeries(bucket, "mtd")
        };
      }
    )
  );
}

function buildPerformanceGroups(rows, level) {
  return sortByMtd(
    [...groupBy(rows, (row) => row[level]).entries()].map(([label, bucket]) => {
      const target = sumRows(bucket, "target");
      const mtd = sumRows(bucket, "mtd");

      return {
        label,
        target,
        ftd: sumRows(bucket, "ftd"),
        mtd,
        lm: sumRows(bucket, "lm"),
        lmtd: sumRows(bucket, "lmtd"),
        customers: sumRows(bucket, "customer_base"),
        homePassed: sumRows(bucket, "home_passed"),
        achievementPct: calculatePercentage(mtd, target)
      };
    })
  );
}

function buildClusterPerformance(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => `${row.cluster}|${row.city}|${row.circle}`)].map(
      ([compoundKey, bucket]) => {
        const [cluster, city, circle] = compoundKey.split("|");
        const target = sumRows(bucket, "target");
        const mtd = sumRows(bucket, "mtd");

        return {
          label: cluster,
          cluster,
          city,
          circle,
          target,
          mtd,
          achievementPct: calculatePercentage(mtd, target),
          societies: [...new Set(bucket.map((row) => row.society))].length
        };
      }
    )
  );
}

function buildSocietyPerformance(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => `${row.society}|${row.cluster}|${row.city}`)].map(
      ([compoundKey, bucket]) => {
        const [society, cluster, city] = compoundKey.split("|");
        const target = sumRows(bucket, "target");
        const mtd = sumRows(bucket, "mtd");
        const primaryKpi =
          buildKpiCards(bucket)[0]?.kpiName || bucket[0]?.kpi_name || "KPI";

        return {
          label: society,
          society,
          cluster,
          city,
          target,
          mtd,
          achievementPct: calculatePercentage(mtd, target),
          primaryKpi
        };
      }
    )
  ).slice(0, 8);
}

function buildManagerPerformance(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => `${row.manager_name}|${row.role}|${row.city}`)].map(
      ([compoundKey, bucket]) => {
        const [name, role, city] = compoundKey.split("|");
        const target = sumRows(bucket, "target");
        const mtd = sumRows(bucket, "mtd");
        const topKpi = buildKpiCards(bucket)[0]?.kpiName || "KPI";

        return {
          name,
          role,
          city,
          circle: bucket[0].circle,
          target,
          ftd: sumRows(bucket, "ftd"),
          mtd,
          lmtd: sumRows(bucket, "lmtd"),
          achievementPct: calculatePercentage(mtd, target),
          primaryKpi: topKpi
        };
      }
    )
  ).slice(0, 10);
}

function buildManagerComparisonCandidates(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => `${row.manager_name}|${row.role}|${row.city}`)].map(
      ([compoundKey, bucket]) => {
        const [name, role, city] = compoundKey.split("|");
        const target = sumRows(bucket, "target");
        const mtd = sumRows(bucket, "mtd");
        const lmtd = sumRows(bucket, "lmtd");
        const topKpi = buildKpiCards(bucket)[0]?.kpiName || "KPI";

        return {
          id: compoundKey,
          name,
          role,
          city,
          circle: bucket[0].circle,
          target,
          ftd: sumRows(bucket, "ftd"),
          mtd,
          lmtd,
          customers: sumRows(bucket, "customer_base"),
          homePassed: sumRows(bucket, "home_passed"),
          achievementPct: calculatePercentage(mtd, target),
          deltaPct: calculateDelta(mtd, lmtd),
          primaryKpi: topKpi,
          series: buildTotalSeries(bucket)
        };
      }
    )
  );
}

function buildRolePerformance(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => row.role).entries()].map(([role, bucket]) => {
      const target = sumRows(bucket, "target");
      const mtd = sumRows(bucket, "mtd");

      return {
        label: role,
        role,
        managers: [...new Set(bucket.map((row) => row.manager_name))].length,
        target,
        mtd,
        achievementPct: calculatePercentage(mtd, target)
      };
    })
  );
}

function buildHighlight(dashboardId, { kpiCards, circles, managers, compareCandidates }) {
  if (dashboardId === "leaderboard-dashboard") {
    const leader = managers[0];
    return leader
      ? {
          eyebrow: "Top Manager",
          title: leader.name,
          value: leader.mtd,
          secondary: `${leader.achievementPct}% of target`,
          deltaLabel: `${leader.primaryKpi} leading KPI`
        }
      : null;
  }

  if (dashboardId === "compare-dashboard") {
    const leader = compareCandidates[0];
    const challenger = compareCandidates[1];
    return leader
      ? {
          eyebrow: "Head To Head",
          title: challenger ? `${leader.name} vs ${challenger.name}` : leader.name,
          value: challenger ? leader.mtd - challenger.mtd : leader.mtd,
          secondary: challenger
            ? `${leader.name} leads by ${(leader.mtd - challenger.mtd).toLocaleString(
                "en-IN"
              )} MTD`
            : `${leader.achievementPct}% of target`,
          deltaLabel: challenger
            ? `${leader.achievementPct}% vs ${challenger.achievementPct}% achieved`
            : `${leader.primaryKpi} leading KPI`
        }
      : null;
  }

  const leader = kpiCards[0];
  return leader
    ? {
        eyebrow: "Best KPI",
        title: leader.kpiName,
        value: leader.mtd,
        secondary: `${leader.achievementPct}% of target`,
        deltaLabel: `${leader.deltaPct}% vs LMTD`
      }
    : null;
}

function buildInsights(
  dashboardId,
  { summary, kpiCards, circles, managers, roles, compareCandidates }
) {
  const topKpi = kpiCards[0];
  const topCircle = circles[0];
  const topManager = managers[0];
  const topRole = roles[0];
  const leader = compareCandidates[0];
  const challenger = compareCandidates[1];
  const insights = [];

  if (dashboardId === "leaderboard-dashboard") {
    if (topManager) {
      insights.push(
        `${topManager.name} is the current leaderboard leader with ${topManager.mtd.toLocaleString(
          "en-IN"
        )} MTD.`
      );
    }

    if (topCircle) {
      insights.push(
        `${topCircle.label} is the strongest circle at ${topCircle.achievementPct}% of target.`
      );
    }

    if (topKpi) {
      insights.push(
        `${topKpi.kpiName} is the highest-performing KPI with ${topKpi.deltaPct}% delta versus LMTD.`
      );
    }

    insights.push(
      `Overall momentum is ${summary.momentumPct}% versus LMTD for the same filtered slice.`
    );

    return insights;
  }

  if (dashboardId === "compare-dashboard") {
    if (leader && challenger) {
      insights.push(
        `${leader.name} is ahead of ${challenger.name} by ${(leader.mtd - challenger.mtd).toLocaleString(
          "en-IN"
        )} MTD in the current slice.`
      );
    }

    if (topRole) {
      insights.push(
        `${topRole.role} contributes ${topRole.achievementPct}% of target in the current comparison window.`
      );
    }

    if (topKpi) {
      insights.push(
        `${topKpi.kpiName} remains the strongest KPI reference point at ${topKpi.achievementPct}% of target.`
      );
    }

    insights.push(
      `Overall momentum is ${summary.momentumPct}% versus LMTD for the same filtered slice.`
    );

    return insights;
  }

  if (topCircle) {
    insights.push(
      `${topCircle.label} contributes ${calculatePercentage(
        topCircle.mtd,
        summary.mtd
      )}% of current MTD output.`
    );
  }

  if (topKpi) {
    insights.push(
      `${topKpi.kpiName} is tracking at ${topKpi.achievementPct}% of target across the selected filters.`
    );
  }

  if (topManager) {
    insights.push(
      `${topManager.name} leads the manager table with ${topManager.mtd.toLocaleString(
        "en-IN"
      )} MTD and ${topManager.primaryKpi} as the strongest KPI.`
    );
  }

  insights.push(
    `Overall momentum is ${summary.momentumPct}% versus LMTD for the same filtered slice.`
  );

  return insights;
}

function buildWhereClause(filters) {
  const dateWindow = resolveDateRange(filters);
  const values = [dateWindow.startDate, dateWindow.endDate];
  const conditions = ["record_date BETWEEN $1 AND $2"];

  Object.entries(FILTER_COLUMN_MAP).forEach(([filterKey, columnName]) => {
    const value = filters[filterKey];
    if (value && value !== "All") {
      values.push(value);
      conditions.push(`${columnName} = $${values.length}`);
    }
  });

  return {
    text: `WHERE ${conditions.join(" AND ")}`,
    values,
    dateWindow
  };
}

async function getDistinctValues(columnName, filters) {
  const { text, values } = buildWhereClause(filters);
  const { rows } = await pool.query(
    `SELECT DISTINCT ${columnName} AS value
    FROM performance_records
    ${text}
    ORDER BY value`,
    values
  );

  return rows.map((row) => row.value);
}

export async function getFilterOptions(dashboardIdOrFilters = {}, maybeFilters = {}) {
  let dashboardId = dashboardRegistry[0].id;
  let filters = maybeFilters;

  if (
    typeof dashboardIdOrFilters === "object" &&
    dashboardIdOrFilters !== null &&
    !Array.isArray(dashboardIdOrFilters)
  ) {
    filters = dashboardIdOrFilters;
  } else {
    dashboardId = dashboardIdOrFilters;
  }

  if (dashboardId === "manager-pulse") {
    return getAttendanceFilterOptions(filters);
  }

  const dateWindow = resolveDateRange(filters);
  const [circles, cities, clusters, societies, managers, roles, kpis] =
    await Promise.all([
      getDistinctValues("circle", filters),
      getDistinctValues("city", filters),
      getDistinctValues("cluster", filters),
      getDistinctValues("society", filters),
      getDistinctValues("manager_name", filters),
      getDistinctValues("role", filters),
      getDistinctValues("kpi_name", filters)
    ]);

  return {
    circles,
    cities,
    clusters,
    societies,
    managers,
    roles,
    kpis,
    periods: getPeriodOptions(),
    defaultDateRange: dateWindow
  };
}

export async function getDashboardPayload(dashboardId, filters = {}) {
  const activeDashboard =
    dashboardRegistry.find((item) => item.id === dashboardId) ||
    dashboardRegistry[0];

  if (activeDashboard.id === "manager-pulse") {
    return buildAttendancePayload(activeDashboard, filters);
  }

  const { text, values, dateWindow } = buildWhereClause(filters);

  const { rows } = await pool.query(
    `SELECT
      record_date,
      circle,
      city,
      cluster,
      society,
      home_passed,
      customer_base,
      entity_ms,
      manager_name,
      role,
      kpi_name,
      target,
      ftd,
      mtd,
      lm,
      lmtd
    FROM performance_records
    ${text}
    ORDER BY record_date ASC`,
    values
  );

  const summary = buildSummary(rows);
  const kpiCards = buildKpiCards(rows);
  const circles = buildPerformanceGroups(rows, "circle");
  const clusters = buildClusterPerformance(rows);
  const societies = buildSocietyPerformance(rows);
  const managers = buildManagerPerformance(rows);
  const compareCandidates = buildManagerComparisonCandidates(rows);
  const roles = buildRolePerformance(rows);

  if (activeDashboard.id === "regional-network") {
    return buildHomePassPayload(activeDashboard, rows, dateWindow, filters);
  }

  return {
    meta: {
      ...activeDashboard,
      totalRecords: rows.length,
      dateRange: dateWindow
    },
    summary,
    highlight: buildHighlight(dashboardId, {
      kpiCards,
      circles,
      managers,
      compareCandidates
    }),
    insights: buildInsights(dashboardId, {
      summary,
      kpiCards,
      circles,
      managers,
      roles,
      compareCandidates
    }),
    totalSeries: buildTotalSeries(rows),
    kpiCards,
    circles,
    clusters: clusters.slice(0, 8),
    societies,
    managers,
    compareCandidates,
    roles,
    filtersApplied: {
      ...filters,
      ...dateWindow
    }
  };
}
