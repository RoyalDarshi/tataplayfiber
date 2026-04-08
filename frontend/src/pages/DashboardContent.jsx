import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import LineTrendChart from "../components/charts/LineTrendChart.jsx";
import InsightStack from "../components/InsightStack.jsx";
import KpiDeck from "../components/KpiDeck.jsx";
import LeaderboardTable from "../components/LeaderboardTable.jsx";
import MetricBars from "../components/MetricBars.jsx";
import PerformanceBars from "../components/PerformanceBars.jsx";
import { formatNumber, formatPercent } from "../utils/formatters.js";
import { fetchDashboardData } from "../api/client.js";

function PanelHeader({ kicker, title, copy }) {
  return (
    <div className="panel-header">
      <div>
        {/* <p className="section-kicker">{kicker}</p> */}
        <h2 className="section-title">{title}</h2>
        {/* {copy && <p className="section-copy">{copy}</p>} */}
      </div>
    </div>
  );
}

function formatHours(value) {
  return `${Number(value || 0).toFixed(1)} hrs`;
}

function formatSignedPercent(value) {
  const numericValue = Number(value || 0);
  return `${numericValue > 0 ? "+" : ""}${formatPercent(numericValue)}`;
}

function MiniStatGrid({ cards }) {
  if (!cards?.length) {
    return null;
  }

  return (
    <div className="mini-stat-grid">
      {cards.map((card) => (
        <article key={card.label} className="mini-stat-card">
          <span className="mini-stat-label">{card.label}</span>
          <strong className="mini-stat-value">{card.value}</strong>
          <span className="mini-stat-copy">{card.detail}</span>
        </article>
      ))}
    </div>
  );
}

function StatusPill({ label, tone = "neutral" }) {
  return <span className={`status-pill is-${tone}`}>{label}</span>;
}

function buildHeadToHeadSeries(leftCandidate, rightCandidate) {
  if (!leftCandidate || !rightCandidate) {
    return [];
  }

  const dateMap = new Map();

  [...leftCandidate.series, ...rightCandidate.series].forEach((entry) => {
    const current = dateMap.get(entry.date) || {
      date: entry.date,
      label: entry.label,
      left: 0,
      right: 0,
    };

    if (leftCandidate.series.some((item) => item.date === entry.date)) {
      const leftEntry = leftCandidate.series.find(
        (item) => item.date === entry.date,
      );
      current.left = leftEntry?.mtd || 0;
      current.label = leftEntry?.label || current.label;
    }

    if (rightCandidate.series.some((item) => item.date === entry.date)) {
      const rightEntry = rightCandidate.series.find(
        (item) => item.date === entry.date,
      );
      current.right = rightEntry?.mtd || 0;
      current.label = rightEntry?.label || current.label;
    }

    dateMap.set(entry.date, current);
  });

  return [...dateMap.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function buildComparisonRows(leftCandidate, rightCandidate) {
  if (!leftCandidate || !rightCandidate) {
    return [];
  }

  const rows = [
    {
      metric: "MTD",
      left: leftCandidate.mtd,
      right: rightCandidate.mtd,
      formatter: formatNumber,
    },
    {
      metric: "FTD",
      left: leftCandidate.ftd,
      right: rightCandidate.ftd,
      formatter: formatNumber,
    },
    {
      metric: "Target",
      left: leftCandidate.target,
      right: rightCandidate.target,
      formatter: formatNumber,
    },
    {
      metric: "Achievement",
      left: leftCandidate.achievementPct,
      right: rightCandidate.achievementPct,
      formatter: formatPercent,
    },
    {
      metric: "Customers",
      left: leftCandidate.customers,
      right: rightCandidate.customers,
      formatter: formatNumber,
    },
    {
      metric: "Home Passed",
      left: leftCandidate.homePassed,
      right: rightCandidate.homePassed,
      formatter: formatNumber,
    },
    {
      metric: "Delta vs LMTD",
      left: leftCandidate.deltaPct,
      right: rightCandidate.deltaPct,
      formatter: formatSignedPercent,
    },
  ];

  return rows.map((row) => ({
    ...row,
    winner:
      row.left === row.right
        ? "Tie"
        : row.left > row.right
          ? leftCandidate.name
          : rightCandidate.name,
  }));
}

function buildCompareNotes(leftCandidate, rightCandidate) {
  if (!leftCandidate || !rightCandidate) {
    return ["Select two people from the filtered slice to start the comparison."];
  }

  const mtdLeader =
    leftCandidate.mtd >= rightCandidate.mtd ? leftCandidate : rightCandidate;
  const achievementLeader =
    leftCandidate.achievementPct >= rightCandidate.achievementPct
      ? leftCandidate
      : rightCandidate;
  const customerLeader =
    leftCandidate.customers >= rightCandidate.customers
      ? leftCandidate
      : rightCandidate;

  return [
    `${mtdLeader.name} leads the head-to-head by ${formatNumber(
      Math.abs(leftCandidate.mtd - rightCandidate.mtd),
    )} MTD.`,
    `${achievementLeader.name} is converting best at ${formatPercent(
      achievementLeader.achievementPct,
    )} of target.`,
    `${customerLeader.name} carries the larger base with ${formatNumber(
      customerLeader.customers,
    )} customers.`,
    `${leftCandidate.name} is strongest on ${leftCandidate.primaryKpi}, while ${rightCandidate.name} leans on ${rightCandidate.primaryKpi}.`,
  ];
}

function CompareProfileCard({ label, candidate, tone }) {
  if (!candidate) {
    return <div className="empty-state">No person selected.</div>;
  }

  return (
    <article className={`compare-card ${tone}`}>
      <div className="compare-card-head">
        <div>
          <span className="compare-card-label">{label}</span>
          <strong className="compare-card-name">{candidate.name}</strong>
          <span className="compare-card-copy">
            {candidate.role} | {candidate.city}, {candidate.circle}
          </span>
        </div>
        <StatusPill label={candidate.primaryKpi} tone="info" />
      </div>

      <div className="compare-card-metrics">
        <div className="compare-card-metric">
          <span>MTD</span>
          <strong>{formatNumber(candidate.mtd)}</strong>
        </div>
        <div className="compare-card-metric">
          <span>Achievement</span>
          <strong>{formatPercent(candidate.achievementPct)}</strong>
        </div>
        <div className="compare-card-metric">
          <span>FTD</span>
          <strong>{formatNumber(candidate.ftd)}</strong>
        </div>
        <div className="compare-card-metric">
          <span>Target</span>
          <strong>{formatNumber(candidate.target)}</strong>
        </div>
      </div>
    </article>
  );
}

function SocietyCards({ societies }) {
  if (!societies?.length) {
    return (
      <div className="empty-state">
        No societies match the selected filters.
      </div>
    );
  }

  return (
    <div className="society-grid">
      {societies.map((society) => (
        <article
          key={`${society.society}-${society.cluster}`}
          className="society-card"
        >
          <span className="society-name">{society.society}</span>
          <p className="society-copy">{`${society.cluster} | ${society.city}`}</p>
          <strong className="society-value">{formatNumber(society.mtd)}</strong>
          <div className="society-meta">
            <span>{society.primaryKpi}</span>
            <span>{formatPercent(society.achievementPct)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function CoverageCards({ societies }) {
  if (!societies?.length) {
    return (
      <div className="empty-state">
        No societies match the selected filters.
      </div>
    );
  }

  return (
    <div className="society-grid">
      {societies.map((society) => (
        <article
          key={`${society.society}-${society.cluster}`}
          className="society-card"
        >
          <span className="society-name">{society.society}</span>
          <p className="society-copy">{`${society.cluster} | ${society.city}`}</p>
          <strong className="society-value">
            {formatNumber(society.homePassed)}
          </strong>
          <div className="society-meta">
            <span>{formatNumber(society.customers)} customers</span>
            <span>{formatPercent(society.connectRatePct)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function SalesOverview({ data, accent }) {
  const orderedKpiCards = (() => {
    if (!data?.kpiCards) return [];
    
    const cardMap = {};
    const others = [];
    
    data.kpiCards.forEach((card) => {
      const clonedCard = { ...card };
      const lowerName = clonedCard.kpiName.toLowerCase();
      
      if (lowerName.includes("retail")) {
        clonedCard.kpiName = "Penetration";
        cardMap["penetration"] = clonedCard;
      } else {
        cardMap[lowerName] = clonedCard;
      }
    });

    const ordered = [];
    ["gad", "act society", "ftr", "penetration"].forEach((key) => {
      if (cardMap[key]) ordered.push(cardMap[key]);
    });

    data.kpiCards.forEach((card) => {
      const lowerName = card.kpiName.toLowerCase();
      if (!["gad", "act society", "ftr", "retail", "retails outer", "penetration"].some(k => lowerName.includes(k))) {
        ordered.push(card);
      }
    });

    return ordered;
  })();

  return (
    <section className="content-grid">
      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="KPI Matrix"
          title="Core KPI Cards"
          copy="Each card carries the value, target, delta, and a compact trend line."
        />
        <KpiDeck cards={orderedKpiCards} accent={accent} />
      </article>

      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Momentum"
          title="Daily MTD and Target Trend"
          copy="Track the selected slice over time with live target comparison."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "mtd", label: "MTD", color: accent },
            { key: "target", label: "Target", color: "#9fc5ff" },
            { key: "ftd", label: "FTD", color: "#ffbc73" },
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Quick Read"
          title="Performance Highlights"
          copy="Fast insight blocks for daily decision making."
        />
        <InsightStack insights={data.insights} />
      </article>

      <article className="panel panel-span-5 panel-pad">
        <PanelHeader
          kicker="Regional Split"
          title="Circle Performance"
          copy="Which circles are pushing the most output right now."
        />
        <PerformanceBars
          items={data.circles}
          renderMeta={(item) =>
            `${item.customers.toLocaleString("en-IN")} customers | ${item.homePassed.toLocaleString("en-IN")} homes`
          }
        />
      </article>

      <article className="panel panel-span-7 panel-pad">
        <PanelHeader
          kicker="Leaderboard"
          title="Top Managers"
          copy="Best performing managers for the selected filter combination."
        />
        <LeaderboardTable rows={data.managers} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Society Watch"
          title="High-Impact Societies"
          copy="A compact view of the most active societies and their leading KPI."
        />
        <SocietyCards societies={data.societies} />
      </article>
    </section>
  );
}

function HomePassDashboard({ data, accent }) {
  const topCircle = data.circles?.[0];
  const topCity = data.hotspots?.[0] || data.cities?.[0];
  const gad = data.kpis?.gad;
  const ftr = data.kpis?.ftr;
  const summaryCards = [
    {
      label: "Home Passed",
      value: formatNumber(data.summary?.homePassed),
      detail: "Total serviceable homes",
    },
    {
      label: "Customers",
      value: formatNumber(data.summary?.customers),
      detail: "Active customer base",
    },
    {
      label: "GAD (MTD)",
      value: gad && gad.mtd != null ? formatNumber(gad.mtd) : "-",
      detail:
        gad && gad.target != null
          ? `${formatPercent(gad.achievementPct)} of target`
          : "No GAD data in this slice",
    },
    {
      label: "FTR (MTD)",
      value: ftr && ftr.mtd != null ? formatNumber(ftr.mtd) : "-",
      detail:
        ftr && ftr.target != null
          ? `${formatPercent(ftr.achievementPct)} of target`
          : "No FTR data in this slice",
    },
    {
      label: "Connect Rate",
      value: formatPercent(data.summary?.connectRatePct),
      detail: "Customers vs home pass",
    },
    {
      label: "Top Circle",
      value: topCircle?.label || "-",
      detail: topCircle
        ? `${formatNumber(topCircle.homePassed)} home passed`
        : "No circle coverage available",
    },
    {
      label: "Best City",
      value: topCity ? `${topCity.city}, ${topCity.circle}` : "-",
      detail: topCity
        ? `${formatPercent(topCity.connectRatePct)} connect rate`
        : "No city ranking available",
    },
    {
      label: "Managers",
      value: formatNumber(data.managers?.length || 0),
      detail: "Managers in current footprint",
    },
  ];
  const cityColumns = [
    { key: "city", header: "City" },
    { key: "circle", header: "Circle" },
    {
      key: "homePassed",
      header: "Home Passed",
      render: (row) => formatNumber(row.homePassed),
    },
    {
      key: "customers",
      header: "Customers",
      render: (row) => formatNumber(row.customers),
    },
    {
      key: "connectRatePct",
      header: "Connect Rate",
      render: (row) => formatPercent(row.connectRatePct),
    },
    {
      key: "societies",
      header: "Societies",
      render: (row) => formatNumber(row.societies),
    },
  ];
  const managerColumns = [
    { key: "name", header: "Manager" },
    { key: "role", header: "Role" },
    {
      key: "location",
      header: "Location",
      render: (row) => `${row.city}, ${row.circle}`,
    },
    {
      key: "homePassed",
      header: "Home Passed",
      render: (row) => formatNumber(row.homePassed),
    },
    {
      key: "customers",
      header: "Customers",
      render: (row) => formatNumber(row.customers),
    },
    {
      key: "connectRatePct",
      header: "Connect Rate",
      render: (row) => formatPercent(row.connectRatePct),
    },
  ];

  return (
    <section className="content-grid">
      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Footprint Snapshot"
          title="Home Pass Overview"
          copy="The footprint story reduced to a few numbers that are easy to explain."
        />
        <MiniStatGrid cards={summaryCards} />
      </article>

      <article className="panel panel-span-7 panel-pad">
        <PanelHeader
          kicker="Coverage Trend"
          title="Home Passed vs Customers"
          copy="See how network reach and active demand move together over time."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "homePassed", label: "Home Passed", color: accent },
            { key: "customers", label: "Customers", color: "#4a90e2" },
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-5 panel-pad">
        <PanelHeader
          kicker="City View"
          title="Coverage by City"
          copy="Top cities by footprint with demand and connect rate."
        />
        <DataTable
          columns={cityColumns}
          rows={data.cities}
          rowKey={(row) => `${row.city}-${row.circle}`}
          emptyMessage="No city coverage rows available."
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="KPI Trend"
          title="GAD Trend"
          copy="GAD movement across the selected Home Pass slice."
        />
        <LineTrendChart
          data={data.kpiSeries}
          lines={[{ key: "gad", label: "GAD", color: "#8e7dff" }]}
          height={320}
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="KPI Trend"
          title="FTR Trend"
          copy="FTR movement across the selected Home Pass slice."
        />
        <LineTrendChart
          data={data.kpiSeries}
          lines={[{ key: "ftr", label: "FTR", color: "#ffbc73" }]}
          height={320}
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Circle Rank"
          title="Coverage by Circle"
          copy="Circles ordered by footprint in the selected view."
        />
        <MetricBars
          items={data.circles}
          valueKey="homePassed"
          renderMeta={(item) =>
            `${formatPercent(item.connectRatePct)} connect rate | ${formatNumber(item.customers)} customers`
          }
          renderFooter={(item) => (
            <>
              <span>{formatNumber(item.managers)} managers</span>
              <span>{formatPercent(item.sharePct)} share</span>
            </>
          )}
          emptyMessage="No home pass rows available."
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Manager View"
          title="Manager Coverage"
          copy="Managers ranked by coverage so ownership stays easy to follow."
        />
        <DataTable
          columns={managerColumns}
          rows={data.managers}
          rowKey={(row) => `${row.name}-${row.city}`}
          emptyMessage="No manager coverage rows available."
        />
      </article>
    </section>
  );
}

function buildLeaderboardRows(rows, key) {
  return [...(rows || [])]
    .sort((left, right) => Number(right[key] || 0) - Number(left[key] || 0))
    .slice(0, 20)
    .map((row) => ({
      ...row,
      label: row.name,
    }));
}

function LeaderboardDashboard({ data }) {
  const managers = data.managers || [];
  const mtdRows = buildLeaderboardRows(managers, "mtd");
  const achievementRows = buildLeaderboardRows(managers, "achievementPct");
  const ftdRows = buildLeaderboardRows(managers, "ftd");
  const penetrationRows = buildLeaderboardRows(managers, "connectRatePct");
  const topMtd = mtdRows[0];
  const topAchievement = achievementRows[0];
  const topFtd = ftdRows[0];
  const topHomePassed = penetrationRows[0];
  const summaryCards = [
    {
      label: "GAD Leader",
      value: topMtd?.name || "-",
      detail: topMtd ? `${formatNumber(topMtd.mtd)} GAD` : "No manager data",
    },
    {
      label: "ACH Leader",
      value: topAchievement?.name || "-",
      detail: topAchievement
        ? `${formatPercent(topAchievement.achievementPct)} achieved`
        : "No manager data",
    },
    {
      label: "PEN Leader",
      value: topFtd?.name || "-",
      detail: topFtd ? `${formatNumber(topFtd.ftd)} PEN` : "No manager data",
    },
    {
      label: "HP Leader",
      value: topHomePassed?.name || "-",
      detail: topHomePassed
        ? `${formatPercent(topHomePassed.connectRatePct)} HP`
        : "No manager data",
    },
  ];

  return (
    <section className="content-grid">
      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Top View"
          title="Leaderboard Summary"
          copy="One line for each ranking lens so the dashboard stays easy to explain."
        />
        <MiniStatGrid cards={summaryCards} />
      </article>

      <article className="panel panel-span-3 panel-pad">
        <PanelHeader
          kicker="Rank 1"
          title="GAD T20"
          copy="Managers with the highest gross adds/devices."
        />
        <MetricBars
          items={mtdRows}
          valueKey="mtd"
          renderMeta={(item) => `${item.role} | ${item.city}`}
          renderFooter={(item) => (
            <>
              <span>Target {formatNumber(item.target)}</span>
              <span>{formatPercent(item.achievementPct)}</span>
            </>
          )}
          emptyMessage="No GAD leaderboard rows available."
        />
      </article>

      <article className="panel panel-span-3 panel-pad">
        <PanelHeader
          kicker="Rank 2"
          title="ACH T20"
          copy="Managers with the highest achievement percentage."
        />
        <MetricBars
          items={achievementRows}
          valueKey="achievementPct"
          valueFormatter={formatPercent}
          renderMeta={(item) => `${item.role} | ${item.city}`}
          renderFooter={(item) => (
            <>
              <span>MTD {formatNumber(item.mtd)}</span>
              <span>Target {formatNumber(item.target)}</span>
            </>
          )}
          emptyMessage="No achievement leaderboard rows available."
        />
      </article>

      <article className="panel panel-span-3 panel-pad">
        <PanelHeader
          kicker="Rank 3"
          title="PEN T20"
          copy="Managers with the highest today's production."
        />
        <MetricBars
          items={ftdRows}
          valueKey="ftd"
          renderMeta={(item) => `${item.role} | ${item.city}`}
          renderFooter={(item) => (
            <>
              <span>MTD {formatNumber(item.mtd)}</span>
              <span>{formatPercent(item.achievementPct)}</span>
            </>
          )}
          emptyMessage="No PEN leaderboard rows available."
        />
      </article>

      <article className="panel panel-span-3 panel-pad">
        <PanelHeader
          kicker="Rank 4"
          title="HP T20"
          copy="Managers with the highest home passed count."
        />
        <MetricBars
          items={penetrationRows}
          valueKey="connectRatePct"
          valueFormatter={formatPercent}
          renderMeta={(item) => `${item.role} | ${item.city}`}
          renderFooter={(item) => (
            <>
              <span>Customers {formatNumber(item.customers)}</span>
              <span>HP {formatNumber(item.homePassed)}</span>
            </>
          )}
          emptyMessage="No HP leaderboard rows available."
        />
      </article>
    </section>
  );
}

function CompareDashboard({ data, accent }) {
  const candidates = data.compareCandidates || [];
  const [leftId, setLeftId] = useState(candidates[0]?.id || "");
  const [rightId, setRightId] = useState(candidates[1]?.id || candidates[0]?.id || "");

  const periods = data?.filterOptions?.periods || [];
  const defaultPeriod =
    periods.find((item) => item.value === "last-30-days")?.value ||
    periods[1]?.value ||
    periods[0]?.value ||
    "last-30-days";
  const [leftPeriod, setLeftPeriod] = useState(defaultPeriod);
  const [rightPeriod, setRightPeriod] = useState(defaultPeriod);
  const [leftStartDate, setLeftStartDate] = useState("");
  const [leftEndDate, setLeftEndDate] = useState("");
  const [rightStartDate, setRightStartDate] = useState("");
  const [rightEndDate, setRightEndDate] = useState("");

  const baseFilters = data?.filtersApplied || {};
  const [leftPayload, setLeftPayload] = useState(null);
  const [rightPayload, setRightPayload] = useState(null);
  const [loadingSides, setLoadingSides] = useState(false);

  useEffect(() => {
    if (!candidates.length) {
      setLeftId("");
      setRightId("");
      return;
    }

    const candidateIds = new Set(candidates.map((candidate) => candidate.id));
    const firstId = candidates[0]?.id || "";
    const secondId = candidates[1]?.id || firstId;

    setLeftId((current) => (candidateIds.has(current) ? current : firstId));
    setRightId((current) => (candidateIds.has(current) ? current : secondId));
  }, [candidates]);

  useEffect(() => {
    let cancelled = false;

    async function loadSides() {
      if (!leftId && !rightId) {
        setLeftPayload(null);
        setRightPayload(null);
        return;
      }

      try {
        setLoadingSides(true);
        const [leftNext, rightNext] = await Promise.all([
          fetchDashboardData("compare-dashboard", {
            ...baseFilters,
            period: leftPeriod,
            startDate: leftPeriod === "custom" ? leftStartDate : "",
            endDate: leftPeriod === "custom" ? leftEndDate : "",
          }),
          fetchDashboardData("compare-dashboard", {
            ...baseFilters,
            period: rightPeriod,
            startDate: rightPeriod === "custom" ? rightStartDate : "",
            endDate: rightPeriod === "custom" ? rightEndDate : "",
          }),
        ]);

        if (!cancelled) {
          setLeftPayload(leftNext);
          setRightPayload(rightNext);
        }
      } finally {
        if (!cancelled) setLoadingSides(false);
      }
    }

    loadSides();

    return () => {
      cancelled = true;
    };
  }, [
    baseFilters,
    leftPeriod,
    rightPeriod,
    leftStartDate,
    leftEndDate,
    rightStartDate,
    rightEndDate,
    leftId,
    rightId,
  ]);

  useEffect(() => {
    if (leftPeriod !== "custom") {
      setLeftStartDate("");
      setLeftEndDate("");
    }
  }, [leftPeriod]);

  useEffect(() => {
    if (rightPeriod !== "custom") {
      setRightStartDate("");
      setRightEndDate("");
    }
  }, [rightPeriod]);

  const leftCandidates = leftPayload?.compareCandidates || candidates;
  const rightCandidates = rightPayload?.compareCandidates || candidates;

  const leftCandidate =
    leftCandidates.find((candidate) => candidate.id === leftId) || leftCandidates[0];
  const rightCandidate =
    rightCandidates.find((candidate) => candidate.id === rightId) || rightCandidates[0];
  const comparisonSeries = buildHeadToHeadSeries(leftCandidate, rightCandidate);
  const comparisonRows = buildComparisonRows(leftCandidate, rightCandidate);
  const winner =
    leftCandidate && rightCandidate
      ? leftCandidate.mtd >= rightCandidate.mtd
        ? leftCandidate
        : rightCandidate
      : null;
  const compareCards =
    leftCandidate && rightCandidate
      ? [
          {
            label: "Current Leader",
            value: winner?.name || "-",
            detail: winner
              ? `${formatNumber(winner.mtd)} MTD in the active slice`
              : "No leader",
          },
          {
            label: "MTD Gap",
            value: formatNumber(
              Math.abs(leftCandidate.mtd - rightCandidate.mtd),
            ),
            detail: `${winner?.name || "Leader"} advantage`,
          },
          {
            label: "Achievement Gap",
            value: formatPercent(
              Math.abs(
                leftCandidate.achievementPct - rightCandidate.achievementPct,
              ),
            ),
            detail: "Difference in target achievement",
          },
          {
            label: "Customer Gap",
            value: formatNumber(
              Math.abs(leftCandidate.customers - rightCandidate.customers),
            ),
            detail: "Difference in customer base",
          },
        ]
      : [];
  const comparisonColumns = [
    { key: "metric", header: "Metric" },
    {
      key: "left",
      header: leftCandidate?.name || "Person A",
      render: (row) => row.formatter(row.left),
    },
    {
      key: "right",
      header: rightCandidate?.name || "Person B",
      render: (row) => row.formatter(row.right),
    },
    { key: "winner", header: "Winner" },
  ];

  function handleLeftChange(nextId) {
    setLeftId(nextId);
  }

  function handleRightChange(nextId) {
    setRightId(nextId);
  }

  return (
    <section className="content-grid">
      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Pick Two"
          title="Head-To-Head Comparison"
          copy="Compare any two people side by side. They can be the same or different, and each side can use a different time period."
        />
        <div className="compare-pair-row">
          <div className="compare-pair">
            <label className="form-field">
              <span>Person A</span>
              <select
                className="control"
                value={leftCandidate?.id || ""}
                onChange={(event) => handleLeftChange(event.target.value)}
              >
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} | {candidate.role} | {candidate.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Period A</span>
              <select
                className="control"
                value={leftPeriod}
                onChange={(event) => setLeftPeriod(event.target.value)}
              >
                {(periods.length
                  ? periods
                  : [{ value: defaultPeriod, label: "Period" }]
                ).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {leftPeriod === "custom" ? (
              <>
                <label className="form-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    className="control"
                    value={leftStartDate}
                    onChange={(event) => setLeftStartDate(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    className="control"
                    value={leftEndDate}
                    onChange={(event) => setLeftEndDate(event.target.value)}
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="compare-pair">
            <label className="form-field">
              <span>Person B</span>
              <select
                className="control"
                value={rightCandidate?.id || ""}
                onChange={(event) => handleRightChange(event.target.value)}
              >
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} | {candidate.role} | {candidate.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Period B</span>
              <select
                className="control"
                value={rightPeriod}
                onChange={(event) => setRightPeriod(event.target.value)}
              >
                {(periods.length
                  ? periods
                  : [{ value: defaultPeriod, label: "Period" }]
                ).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {rightPeriod === "custom" ? (
              <>
                <label className="form-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    className="control"
                    value={rightStartDate}
                    onChange={(event) => setRightStartDate(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    className="control"
                    value={rightEndDate}
                    onChange={(event) => setRightEndDate(event.target.value)}
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>
        {loadingSides ? (
          <div className="empty-state" style={{ paddingTop: 12 }}>
            Updating head-to-head periods...
          </div>
        ) : null}
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Person A"
          title="Profile Snapshot"
          copy="Key numbers for the first selected person in Period A."
        />
        <CompareProfileCard
          label="Person A"
          candidate={leftCandidate}
          tone="is-left"
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Person B"
          title="Profile Snapshot"
          copy="Key numbers for the second selected person in Period B."
        />
        <CompareProfileCard
          label="Person B"
          candidate={rightCandidate}
          tone="is-right"
        />
      </article>

      <article className="panel panel-span-7 panel-pad">
        <PanelHeader
          kicker="Trend"
          title="MTD Head-To-Head"
          copy="The trend shows who is ahead over time, not just on the latest total."
        />
        <LineTrendChart
          data={comparisonSeries}
          lines={[
            {
              key: "left",
              label: leftCandidate?.name || "Manager A",
              color: accent,
            },
            {
              key: "right",
              label: rightCandidate?.name || "Manager B",
              color: "#6f8bff",
            },
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-5 panel-pad">
        <PanelHeader
          kicker="Scoreboard"
          title="Head-To-Head Snapshot"
          copy="The key gaps between the selected managers at a glance."
        />
        <MiniStatGrid cards={compareCards} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Metric Table"
          title="A vs B"
          copy="Exact metric-by-metric values so you can see who wins where (across the chosen periods)."
        />
        <DataTable
          columns={comparisonColumns}
          rows={comparisonRows}
          rowKey={(row) => row.metric}
          emptyMessage="No comparison rows available."
        />
      </article>
    </section>
  );
}

function AttendanceOverview({ summary, breakdown }) {
  const segments = [
    {
      label: "Present",
      value:
        breakdown?.find((item) => item.label === "PRESENT")?.mtd ||
        summary.presentDays ||
        0,
      color: "var(--accent)",
    },
    {
      label: "Leave",
      value:
        breakdown?.find((item) => item.label === "LEAVE")?.mtd ||
        summary.leaveDays ||
        0,
      color: "#f4b267",
    },
    {
      label: "Absent",
      value:
        breakdown?.find((item) => item.label === "ABSENT")?.mtd ||
        summary.absentDays ||
        0,
      color: "#ea6f6f",
    },
  ];
  const total = segments.reduce(
    (runningTotal, segment) => runningTotal + segment.value,
    0,
  );
  let progress = 0;
  const ringFill = total
    ? `conic-gradient(${segments
        .map((segment) => {
          const start = progress;
          progress += (segment.value / total) * 100;
          return `${segment.color} ${start}% ${progress}%`;
        })
        .join(", ")})`
    : "conic-gradient(#e5ebf3 0% 100%)";

  return (
    <div className="attendance-overview">
      <div className="attendance-ring" style={{ background: ringFill }}>
        <div className="attendance-ring-center">
          <strong>{formatPercent(summary.presentRatePct)}</strong>
          <span>Present rate</span>
          <small>{formatNumber(summary.employeeCount)} employees</small>
        </div>
      </div>

      <div className="attendance-legend">
        {segments.map((segment) => (
          <div key={segment.label} className="attendance-legend-row">
            <span className="attendance-legend-key">
              <span
                className="attendance-legend-dot"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </span>
            <strong>{formatNumber(segment.value)}</strong>
          </div>
        ))}
        <div className="attendance-legend-row is-muted">
          <span>On-time check-in</span>
          <strong>{formatPercent(summary.onTimeRatePct)}</strong>
        </div>
        <div className="attendance-legend-row is-muted">
          <span>Pending requests</span>
          <strong>{formatNumber(summary.pendingRegularizations)}</strong>
        </div>
      </div>
    </div>
  );
}

function AttendanceDashboard({ data, accent }) {
  const summaryCards = [
    {
      label: "Checked In",
      value: formatNumber(data.summary?.presentDays),
      detail: "Final present employee-days",
    },
    {
      label: "Not Checked In",
      value: formatNumber(data.summary?.absentDays),
      detail: "Final unresolved absences",
    },
    {
      label: "On Leave",
      value: formatNumber(data.summary?.leaveDays),
      detail: "Leave employee-days",
    },
    {
      label: "Pending Requests",
      value: formatNumber(data.summary?.pendingRegularizations),
      detail: "Regularization follow-up",
    },
    {
      label: "On-Time Check-In",
      value: formatPercent(data.summary?.onTimeRatePct),
      detail: "Check-ins before 09:45 AM",
    },
    {
      label: "Avg Hours",
      value: formatHours(data.summary?.avgWorkingHours),
      detail: "Across present days",
    },
  ];
  const employeeColumns = [
    { key: "employeeCode", header: "Employee Code" },
    { key: "employeeName", header: "Employee Name" },
    {
      key: "owner",
      header: "Owner",
      render: (row) => `${row.asm} | ${row.managerName}`,
    },
    { key: "roleName", header: "Role" },
    {
      key: "latestFinalStatus",
      header: "Latest Status",
      render: (row) => (
        <div className="cell-stack">
          <StatusPill
            label={row.latestFinalStatus}
            tone={
              row.latestFinalStatus === "PRESENT"
                ? "positive"
                : row.latestFinalStatus === "ABSENT"
                  ? "negative"
                  : "warning"
            }
          />
          <span className="cell-sub">{row.latestAttendanceDate}</span>
        </div>
      ),
    },
    {
      key: "attendancePct",
      header: "Attendance %",
      render: (row) => formatPercent(row.attendancePct),
    },
    {
      key: "latestRegularizationStatus",
      header: "Latest Reg.",
      render: (row) => (
        <div className="cell-stack">
          <StatusPill
            label={row.latestRegularizationStatus}
            tone={
              row.latestRegularizationStatus === "Pending"
                ? "warning"
                : row.latestRegularizationStatus === "Approved"
                  ? "info"
                  : "neutral"
            }
          />
          <span className="cell-sub">
            {row.latestLeaveType !== "-"
              ? row.latestLeaveType
              : row.latestCheckInTime}
          </span>
        </div>
      ),
    },
    {
      key: "presentDays",
      header: "Present",
      render: (row) => formatNumber(row.presentDays),
    },
    {
      key: "leaveDays",
      header: "Leave",
      render: (row) => formatNumber(row.leaveDays),
    },
    {
      key: "absentDays",
      header: "Absent",
      render: (row) => formatNumber(row.absentDays),
    },
    {
      key: "avgWorkingHours",
      header: "Avg Hours",
      render: (row) => formatHours(row.avgWorkingHours),
    },
    {
      key: "pendingRegularizations",
      header: "Pending Reg.",
      render: (row) => formatNumber(row.pendingRegularizations),
    },
  ];

  return (
    <section className="content-grid">
      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Overview"
          title="Attendance Snapshot"
          copy="A quick attendance read inspired by a clean HR dashboard pattern."
        />
        <AttendanceOverview
          summary={data.summary || {}}
          breakdown={data.statusBreakdown}
        />
      </article>

      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Summary"
          title="Attendance Health"
          copy="The key cards you can use to explain attendance performance in one pass."
        />
        <MiniStatGrid cards={summaryCards} />
      </article>

      <article className="panel panel-span-7 panel-pad">
        <PanelHeader
          kicker="Daily Movement"
          title="Attendance Trend"
          copy="Track present, leave, and absent employee-days across the selected attendance window."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "present", label: "Present", color: accent },
            { key: "leave", label: "Leave", color: "#f4b267" },
            { key: "absent", label: "Absent", color: "#ea6f6f" },
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-5 panel-pad">
        <PanelHeader
          kicker="Manager Queue"
          title="Follow-Up by Manager"
          copy="Managers with the biggest exception load stay visible for action."
        />
        <MetricBars
          items={data.managerQueue}
          valueKey="mtd"
          renderMeta={(item) =>
            `${formatNumber(item.pendingRegularizations)} pending | ${formatNumber(item.absentDays)} absent`
          }
          renderFooter={(item) => (
            <>
              <span>{formatPercent(item.achievementPct)} present rate</span>
              <span>{formatNumber(item.employees)} employees</span>
            </>
          )}
          emptyMessage="No manager queue rows available."
        />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Employee View"
          title="Attendance Exception Table"
          copy="Employees with weaker attendance and pending requests stay easiest to review here."
        />
        <DataTable
          columns={employeeColumns}
          rows={data.employeeRows}
          rowKey={(row) => row.employeeCode}
          emptyMessage="No employee attendance rows available."
        />
      </article>
    </section>
  );
}

export default function DashboardContent({
  dashboardId,
  data,
  accent,
  filters,
  filterOptions,
}) {
  const enrichedData = useMemo(() => {
    if (dashboardId !== "compare-dashboard") {
      return data;
    }

    return {
      ...data,
      filtersApplied: data?.filtersApplied || filters,
      filterOptions: data?.filterOptions || filterOptions,
    };
  }, [dashboardId, data, filters, filterOptions]);

  if (dashboardId === "regional-network") {
    return <HomePassDashboard data={enrichedData} accent={accent} />;
  }

  if (dashboardId === "leaderboard-dashboard") {
    return <LeaderboardDashboard data={enrichedData} accent={accent} />;
  }

  if (dashboardId === "compare-dashboard") {
    return <CompareDashboard data={enrichedData} accent={accent} />;
  }

  if (dashboardId === "manager-pulse") {
    return <AttendanceDashboard data={enrichedData} accent={accent} />;
  }

  return <SalesOverview data={enrichedData} accent={accent} />;
}
