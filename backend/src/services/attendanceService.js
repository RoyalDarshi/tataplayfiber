import { createAttendanceSeedRecords } from "../data/attendanceSampleData.js";
import { formatDateLabel, getPeriodOptions, resolveDateRange } from "../utils/dateRange.js";

const ATTENDANCE_FILTER_ACCESSORS = {
  circle: (row) => row.state,
  city: (row) => row.city,
  cluster: (row) => row.asm,
  society: (row) => row.csm,
  manager: (row) => row.managerName,
  role: (row) => row.roleName,
  kpi: (row) => row.finalStatus
};

const ATTENDANCE_RECORDS = createAttendanceSeedRecords();

function round(value) {
  return Number(value.toFixed(1));
}

function calculatePercentage(value, total) {
  if (!total) {
    return 0;
  }

  return round((value / total) * 100);
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return round(
    values.reduce((total, value) => total + Number(value || 0), 0) / values.length
  );
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

function filterAttendanceRows(filters = {}) {
  const dateWindow = resolveDateRange(filters);
  const rows = ATTENDANCE_RECORDS.filter((row) => {
    if (
      row.attendanceDate < dateWindow.startDate ||
      row.attendanceDate > dateWindow.endDate
    ) {
      return false;
    }

    return Object.entries(ATTENDANCE_FILTER_ACCESSORS).every(
      ([filterKey, accessor]) => {
        const filterValue = filters[filterKey];

        return !filterValue || filterValue === "All"
          ? true
          : accessor(row) === filterValue;
      }
    );
  });

  return { rows, dateWindow };
}

function getDistinctAttendanceValues(accessor, filters) {
  const { rows } = filterAttendanceRows(filters);

  return [...new Set(rows.map(accessor).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function countRows(rows, predicate) {
  return rows.reduce((total, row) => total + (predicate(row) ? 1 : 0), 0);
}

function buildAttendanceSummary(rows) {
  const employeeCount = new Set(rows.map((row) => row.employeeCode)).size;
  const presentDays = countRows(rows, (row) => row.finalStatus === "PRESENT");
  const leaveDays = countRows(rows, (row) => row.finalStatus === "LEAVE");
  const absentDays = countRows(rows, (row) => row.finalStatus === "ABSENT");
  const pendingRegularizations = countRows(
    rows,
    (row) => row.regularizationStatus === "Pending"
  );
  const presentRows = rows.filter((row) => row.finalStatus === "PRESENT");
  const onTimeCheckIns = countRows(
    presentRows,
    (row) => row.checkInTime && row.checkInTime <= "09:45"
  );
  const avgWorkingHours = average(presentRows.map((row) => row.workingHours));
  const presentRatePct = calculatePercentage(presentDays, rows.length);
  const onTimeRatePct = calculatePercentage(onTimeCheckIns, presentRows.length);

  return {
    employeeCount,
    presentDays,
    leaveDays,
    absentDays,
    pendingRegularizations,
    avgWorkingHours,
    presentRatePct,
    onTimeRatePct,
    cards: [
      {
        label: "Employees",
        value: employeeCount,
        format: "number",
        detail: "Unique employee count"
      },
      {
        label: "Present Rate",
        value: presentRatePct,
        format: "percent",
        detail: "Final present status"
      },
      {
        label: "Present Days",
        value: presentDays,
        format: "number",
        detail: "Employee-day attendance"
      },
      {
        label: "Leave Days",
        value: leaveDays,
        format: "number",
        detail: "Approved and pending leave"
      },
      {
        label: "Absent Days",
        value: absentDays,
        format: "number",
        detail: "Final unresolved absences"
      },
      {
        label: "Avg Hours",
        value: avgWorkingHours,
        format: "hours",
        detail: "Across present days"
      },
      {
        label: "On-Time Check-In",
        value: onTimeRatePct,
        format: "percent",
        detail: "Before 09:45 AM"
      },
      {
        label: "Pending Regularizations",
        value: pendingRegularizations,
        format: "number",
        detail: "Needs manager action"
      }
    ]
  };
}

function buildAttendanceSeries(rows) {
  const grouped = groupBy(rows, (row) => row.attendanceDate);

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, bucket]) => ({
      date,
      label: formatDateLabel(date),
      present: countRows(bucket, (row) => row.finalStatus === "PRESENT"),
      leave: countRows(bucket, (row) => row.finalStatus === "LEAVE"),
      absent: countRows(bucket, (row) => row.finalStatus === "ABSENT")
    }));
}

function buildAttendanceStatusBreakdown(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => row.finalStatus).entries()].map(([status, bucket]) => ({
      label: status,
      mtd: bucket.length,
      target: rows.length,
      achievementPct: calculatePercentage(bucket.length, rows.length),
      pending: countRows(bucket, (row) => row.regularizationStatus === "Pending")
    }))
  );
}

function buildAttendanceManagerQueue(rows) {
  return [...groupBy(rows, (row) => row.managerName).entries()]
    .map(([managerName, bucket]) => {
      const pendingRegularizations = countRows(
        bucket,
        (row) => row.regularizationStatus === "Pending"
      );
      const absentDays = countRows(bucket, (row) => row.finalStatus === "ABSENT");
      const leaveDays = countRows(bucket, (row) => row.finalStatus === "LEAVE");
      const presentDays = countRows(bucket, (row) => row.finalStatus === "PRESENT");
      const issueCount = pendingRegularizations + absentDays;

      return {
        label: managerName,
        managerName,
        mtd: issueCount,
        issueCount,
        pendingRegularizations,
        absentDays,
        leaveDays,
        presentDays,
        employees: new Set(bucket.map((row) => row.employeeCode)).size,
        achievementPct: calculatePercentage(presentDays, bucket.length),
        avgWorkingHours: average(
          bucket
            .filter((row) => row.finalStatus === "PRESENT")
            .map((row) => row.workingHours)
        )
      };
    })
    .sort((left, right) => {
      if (right.issueCount !== left.issueCount) {
        return right.issueCount - left.issueCount;
      }

      return left.achievementPct - right.achievementPct;
    })
    .slice(0, 8);
}

function buildAttendanceAsmPerformance(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => row.asm).entries()].map(([asm, bucket]) => {
      const presentDays = countRows(bucket, (row) => row.finalStatus === "PRESENT");

      return {
        label: asm,
        mtd: presentDays,
        target: bucket.length,
        achievementPct: calculatePercentage(presentDays, bucket.length),
        employees: new Set(bucket.map((row) => row.employeeCode)).size,
        avgWorkingHours: average(
          bucket
            .filter((row) => row.finalStatus === "PRESENT")
            .map((row) => row.workingHours)
        ),
        cities: new Set(bucket.map((row) => row.city)).size
      };
    })
  );
}

function buildAttendanceRegularizationTrend(rows) {
  return [...groupBy(rows, (row) => row.attendanceDate).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, bucket]) => ({
      date,
      label: formatDateLabel(date),
      pending: countRows(bucket, (row) => row.regularizationStatus === "Pending"),
      approved: countRows(bucket, (row) => row.regularizationStatus === "Approved"),
      absent: countRows(bucket, (row) => row.finalStatus === "ABSENT")
    }));
}

function buildAttendanceRegularizationBreakdown(rows) {
  return sortByMtd(
    [...groupBy(rows, (row) => row.regularizationStatus).entries()].map(
      ([status, bucket]) => ({
        label: status,
        mtd: bucket.length,
        target: rows.length,
        achievementPct: calculatePercentage(bucket.length, rows.length)
      })
    )
  );
}

function buildAttendanceLeaveTypes(rows) {
  const leaveRows = rows.filter((row) => row.leaveType);

  return sortByMtd(
    [...groupBy(leaveRows, (row) => row.leaveType).entries()].map(([leaveType, bucket]) => ({
      label: leaveType,
      mtd: bucket.length,
      target: leaveRows.length || 1,
      achievementPct: calculatePercentage(bucket.length, leaveRows.length || 1)
    }))
  );
}

function buildAttendanceEmployeeRows(rows) {
  return [...groupBy(rows, (row) => row.employeeCode).entries()]
    .map(([employeeCode, bucket]) => {
      const latestRecord = [...bucket].sort((left, right) =>
        right.attendanceDate.localeCompare(left.attendanceDate)
      )[0];
      const presentDays = countRows(bucket, (row) => row.finalStatus === "PRESENT");
      const leaveDays = countRows(bucket, (row) => row.finalStatus === "LEAVE");
      const absentDays = countRows(bucket, (row) => row.finalStatus === "ABSENT");
      const pendingRegularizations = countRows(
        bucket,
        (row) => row.regularizationStatus === "Pending"
      );

      return {
        employeeCode,
        employeeName: bucket[0].employeeName,
        roleName: bucket[0].roleName,
        managerName: bucket[0].managerName,
        asm: bucket[0].asm,
        city: bucket[0].city,
        state: bucket[0].state,
        presentDays,
        leaveDays,
        absentDays,
        attendancePct: calculatePercentage(presentDays, bucket.length),
        avgWorkingHours: average(
          bucket
            .filter((row) => row.finalStatus === "PRESENT")
            .map((row) => row.workingHours)
        ),
        pendingRegularizations,
        latestAttendanceDate: latestRecord?.attendanceDate || "",
        latestFinalStatus: latestRecord?.finalStatus || "-",
        latestRegularizationStatus: latestRecord?.regularizationStatus || "-",
        latestCheckInTime: latestRecord?.checkInTime || "-",
        latestLeaveType: latestRecord?.leaveType || "-"
      };
    })
    .sort((left, right) => {
      if (right.absentDays !== left.absentDays) {
        return right.absentDays - left.absentDays;
      }

      if (right.pendingRegularizations !== left.pendingRegularizations) {
        return right.pendingRegularizations - left.pendingRegularizations;
      }

      return left.attendancePct - right.attendancePct;
    })
    .slice(0, 12);
}

function buildAttendanceHighlight(summary, managerQueue) {
  const queueLeader = managerQueue[0];

  return {
    eyebrow: "Action Queue",
    title: `${summary.pendingRegularizations} Pending`,
    value: summary.pendingRegularizations,
    secondary: `${summary.absentDays.toLocaleString("en-IN")} unresolved absences in the active window`,
    deltaLabel: queueLeader
      ? `${queueLeader.label} has the heaviest manager queue`
      : `${summary.presentRatePct}% present rate`
  };
}

function buildAttendanceInsights({
  summary,
  statusBreakdown,
  asmPerformance,
  leaveTypes,
  managerQueue
}) {
  const topStatus = statusBreakdown[0];
  const topAsm = asmPerformance[0];
  const topLeaveType = leaveTypes[0];
  const topQueue = managerQueue[0];
  const insights = [];

  if (topStatus) {
    insights.push(
      `${topStatus.label} represents ${topStatus.achievementPct}% of the filtered employee-day records.`
    );
  }

  if (topAsm) {
    insights.push(
      `${topAsm.label} is leading with ${topAsm.achievementPct}% present rate across ${topAsm.employees} employees.`
    );
  }

  if (topQueue) {
    insights.push(
      `${topQueue.label} has ${topQueue.issueCount} exception records across pending regularizations and final absences.`
    );
  }

  if (topLeaveType) {
    insights.push(
      `${topLeaveType.label} is the most frequent leave reason at ${topLeaveType.achievementPct}% of all leave entries.`
    );
  }

  insights.push(
    `${summary.pendingRegularizations} records still need regularization action in the selected window.`
  );

  return insights;
}

export function getAttendanceFilterOptions(filters = {}) {
  const { dateWindow } = filterAttendanceRows(filters);

  return {
    circles: getDistinctAttendanceValues((row) => row.state, filters),
    cities: getDistinctAttendanceValues((row) => row.city, filters),
    clusters: getDistinctAttendanceValues((row) => row.asm, filters),
    societies: getDistinctAttendanceValues((row) => row.csm, filters),
    managers: getDistinctAttendanceValues((row) => row.managerName, filters),
    roles: getDistinctAttendanceValues((row) => row.roleName, filters),
    kpis: getDistinctAttendanceValues((row) => row.finalStatus, filters),
    periods: getPeriodOptions(),
    defaultDateRange: dateWindow
  };
}

export function buildAttendancePayload(activeDashboard, filters) {
  const { rows, dateWindow } = filterAttendanceRows(filters);
  const summary = buildAttendanceSummary(rows);
  const statusBreakdown = buildAttendanceStatusBreakdown(rows);
  const managerQueue = buildAttendanceManagerQueue(rows);
  const asmPerformance = buildAttendanceAsmPerformance(rows);
  const regularizationTrend = buildAttendanceRegularizationTrend(rows);
  const regularizations = buildAttendanceRegularizationBreakdown(rows);
  const leaveTypes = buildAttendanceLeaveTypes(rows);

  return {
    meta: {
      ...activeDashboard,
      totalRecords: rows.length,
      recordsLabel: "attendance rows",
      dateRange: dateWindow
    },
    summary,
    highlight: buildAttendanceHighlight(summary, managerQueue),
    insights: buildAttendanceInsights({
      summary,
      statusBreakdown,
      asmPerformance,
      leaveTypes,
      managerQueue
    }),
    totalSeries: buildAttendanceSeries(rows),
    statusBreakdown,
    managerQueue,
    asmPerformance,
    regularizationTrend,
    regularizations,
    leaveTypes,
    employeeRows: buildAttendanceEmployeeRows(rows),
    filtersApplied: {
      ...filters,
      ...dateWindow
    }
  };
}
