import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import LineTrendChart from "../components/charts/LineTrendChart.jsx";
import InsightStack from "../components/InsightStack.jsx";
import KpiDeck from "../components/KpiDeck.jsx";
import LeaderboardTable from "../components/LeaderboardTable.jsx";
import MetricBars from "../components/MetricBars.jsx";
import PerformanceBars from "../components/PerformanceBars.jsx";
import { formatNumber, formatPercent } from "../utils/formatters.js";

function PanelHeader({ kicker, title, copy }) {
  return (
    <div className="panel-header">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h2 className="section-title">{title}</h2>
        {copy && <p className="section-copy">{copy}</p>}
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
      right: 0
    };

    if (leftCandidate.series.some((item) => item.date === entry.date)) {
      const leftEntry = leftCandidate.series.find((item) => item.date === entry.date);
      current.left = leftEntry?.mtd || 0;
      current.label = leftEntry?.label || current.label;
    }

    if (rightCandidate.series.some((item) => item.date === entry.date)) {
      const rightEntry = rightCandidate.series.find((item) => item.date === entry.date);
      current.right = rightEntry?.mtd || 0;
      current.label = rightEntry?.label || current.label;
    }

    dateMap.set(entry.date, current);
  });

  return [...dateMap.values()].sort((left, right) => left.date.localeCompare(right.date));
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
      formatter: formatNumber
    },
    {
      metric: "FTD",
      left: leftCandidate.ftd,
      right: rightCandidate.ftd,
      formatter: formatNumber
    },
    {
      metric: "Target",
      left: leftCandidate.target,
      right: rightCandidate.target,
      formatter: formatNumber
    },
    {
      metric: "Achievement",
      left: leftCandidate.achievementPct,
      right: rightCandidate.achievementPct,
      formatter: formatPercent
    },
    {
      metric: "Customers",
      left: leftCandidate.customers,
      right: rightCandidate.customers,
      formatter: formatNumber
    },
    {
      metric: "Home Passed",
      left: leftCandidate.homePassed,
      right: rightCandidate.homePassed,
      formatter: formatNumber
    },
    {
      metric: "Delta vs LMTD",
      left: leftCandidate.deltaPct,
      right: rightCandidate.deltaPct,
      formatter: formatSignedPercent
    }
  ];

  return rows.map((row) => ({
    ...row,
    winner:
      row.left === row.right
        ? "Tie"
        : row.left > row.right
          ? leftCandidate.name
          : rightCandidate.name
  }));
}

function buildCompareNotes(leftCandidate, rightCandidate) {
  if (!leftCandidate || !rightCandidate) {
    return ["Select two managers from the filtered slice to start the comparison."];
  }

  const mtdLeader = leftCandidate.mtd >= rightCandidate.mtd ? leftCandidate : rightCandidate;
  const achievementLeader =
    leftCandidate.achievementPct >= rightCandidate.achievementPct
      ? leftCandidate
      : rightCandidate;
  const customerLeader =
    leftCandidate.customers >= rightCandidate.customers ? leftCandidate : rightCandidate;

  return [
    `${mtdLeader.name} leads the head-to-head by ${formatNumber(
      Math.abs(leftCandidate.mtd - rightCandidate.mtd)
    )} MTD.`,
    `${achievementLeader.name} is converting best at ${formatPercent(
      achievementLeader.achievementPct
    )} of target.`,
    `${customerLeader.name} carries the larger base with ${formatNumber(
      customerLeader.customers
    )} customers.`,
    `${leftCandidate.name} is strongest on ${leftCandidate.primaryKpi}, while ${rightCandidate.name} leans on ${rightCandidate.primaryKpi}.`
  ];
}

function CompareProfileCard({ label, candidate, tone }) {
  if (!candidate) {
    return <div className="empty-state">No manager selected.</div>;
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
          <span>Customers</span>
          <strong>{formatNumber(candidate.customers)}</strong>
        </div>
        <div className="compare-card-metric">
          <span>Home Passed</span>
          <strong>{formatNumber(candidate.homePassed)}</strong>
        </div>
        <div className="compare-card-metric">
          <span>Vs LMTD</span>
          <strong>{formatSignedPercent(candidate.deltaPct)}</strong>
        </div>
      </div>
    </article>
  );
}

function SocietyCards({ societies }) {
  if (!societies?.length) {
    return <div className="empty-state">No societies match the selected filters.</div>;
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
    return <div className="empty-state">No societies match the selected filters.</div>;
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
          <strong className="society-value">{formatNumber(society.homePassed)}</strong>
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
  return (
    <section className="content-grid">
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
            { key: "ftd", label: "FTD", color: "#ffbc73" }
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

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="KPI Matrix"
          title="Core KPI Cards"
          copy="Each card carries the value, target, delta, and a compact trend line."
        />
        <KpiDeck cards={data.kpiCards} accent={accent} />
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
  const topHotspot = data.hotspots?.[0];
  const pulseCards = [
    {
      label: "Top Circle",
      value: topCircle?.label || "-",
      detail: topCircle
        ? `${formatNumber(topCircle.homePassed)} home passed | ${formatPercent(
            topCircle.sharePct
          )} footprint share`
        : "No circle data"
    },
    {
      label: "Best Hotspot",
      value: topHotspot ? `${topHotspot.city}, ${topHotspot.circle}` : "-",
      detail: topHotspot
        ? `${formatPercent(topHotspot.connectRatePct)} connect rate`
        : "No hotspot data"
    },
    {
      label: "Avg / Manager",
      value: data.managers?.length
        ? formatNumber(
            Math.round((Number(data.summary?.homePassed) || 0) / data.managers.length)
          )
        : "0",
      detail: "Home passed per manager"
    },
    {
      label: "Conversion Base",
      value: formatPercent(data.summary?.connectRatePct),
      detail: `${formatNumber(data.summary?.customers)} active customers`
    }
  ];
  const managerColumns = [
    { key: "name", header: "Manager" },
    { key: "role", header: "Role" },
    {
      key: "location",
      header: "Location",
      render: (row) => `${row.city}, ${row.circle}`
    },
    {
      key: "homePassed",
      header: "Home Passed",
      render: (row) => formatNumber(row.homePassed)
    },
    {
      key: "customers",
      header: "Customers",
      render: (row) => formatNumber(row.customers)
    },
    {
      key: "connectRatePct",
      header: "Connect Rate",
      render: (row) => formatPercent(row.connectRatePct)
    },
    {
      key: "societies",
      header: "Societies",
      render: (row) => formatNumber(row.societies)
    }
  ];
  const circleColumns = [
    { key: "label", header: "Circle" },
    {
      key: "homePassed",
      header: "Home Passed",
      render: (row) => formatNumber(row.homePassed)
    },
    {
      key: "customers",
      header: "Customers",
      render: (row) => formatNumber(row.customers)
    },
    {
      key: "connectRatePct",
      header: "Connect Rate",
      render: (row) => formatPercent(row.connectRatePct)
    },
    {
      key: "cities",
      header: "Cities",
      render: (row) => formatNumber(row.cities)
    },
    {
      key: "societies",
      header: "Societies",
      render: (row) => formatNumber(row.societies)
    },
    {
      key: "managers",
      header: "Managers",
      render: (row) => formatNumber(row.managers)
    },
    {
      key: "sharePct",
      header: "Share",
      render: (row) => formatPercent(row.sharePct)
    }
  ];

  return (
    <section className="content-grid">
      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Coverage Trend"
          title="Daily Home Pass vs Customer Base"
          copy="See how coverage expansion and active customer demand move together across the selected footprint."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "homePassed", label: "Home Passed", color: accent },
            { key: "customers", label: "Customers", color: "#5fe0b0" }
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Coverage Pulse"
          title="Footprint Snapshot"
          copy="A faster read on the footprint, hotspot, and conversion shape behind the selected slice."
        />
        <MiniStatGrid cards={pulseCards} />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Circle Coverage"
          title="Home Pass by Circle"
          copy="Use this to see which circles hold the most footprint today."
        />
        <MetricBars
          items={data.circles}
          valueKey="homePassed"
          renderMeta={(item) =>
            `${formatNumber(item.customers)} customers | ${formatPercent(item.connectRatePct)} connect rate`
          }
          renderFooter={(item) => (
            <>
              <span>{formatPercent(item.sharePct)} share</span>
              <span>{formatNumber(item.cities)} cities</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Hotspots"
          title="Conversion Hotspots"
          copy="Cities ranked by strongest connect rate within the filtered footprint."
        />
        <MetricBars
          items={data.hotspots}
          valueKey="connectRatePct"
          valueFormatter={formatPercent}
          renderMeta={(item) =>
            `${item.city}, ${item.circle} | ${formatNumber(item.customers)} customers`
          }
          renderFooter={(item) => (
            <>
              <span>{formatNumber(item.homePassed)} home passed</span>
              <span>{formatPercent(item.sharePct)} share</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="City Board"
          title="Coverage By City"
          copy="Cities with the strongest combination of home pass scale and conversion."
        />
        <MetricBars
          items={data.cities}
          valueKey="homePassed"
          renderMeta={(item) =>
            `${item.city}, ${item.circle} | ${formatPercent(item.connectRatePct)} connect rate`
          }
          renderFooter={(item) => (
            <>
              <span>{formatNumber(item.customers)} customers</span>
              <span>{formatNumber(item.societies)} societies</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Coverage Matrix"
          title="Circle Coverage Table"
          copy="A denser footprint view for circle-level coverage, penetration, and market spread."
        />
        <DataTable
          columns={circleColumns}
          rows={data.circles}
          rowKey={(row) => row.label}
          emptyMessage="No circle coverage rows available."
        />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Manager Footprint"
          title="Manager Coverage Board"
          copy="Managers ranked by home pass footprint, customer base, and society coverage."
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

function LeaderboardDashboard({ data }) {
  const kpiRows = (data.kpiCards || []).map((card) => ({
    ...card,
    label: card.kpiName
  }));

  return (
    <section className="content-grid">
      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Primary Board"
          title="Manager Leaderboard"
          copy="The top managers stay front and center so the strongest performers are visible immediately."
        />
        <LeaderboardTable rows={data.managers} />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Signals"
          title="Leaderboard Insights"
          copy="Quick notes that explain who is leading and where the leaderboard is tilting."
        />
        <InsightStack insights={data.insights} />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Circle Rank"
          title="Top Circles"
          copy="Circle ranking by MTD and target achievement."
        />
        <PerformanceBars
          items={data.circles}
          renderMeta={(item) =>
            `${formatPercent(item.achievementPct)} achievement | ${formatNumber(item.customers)} customers`
          }
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Cluster Rank"
          title="Top Clusters"
          copy="Clusters with the strongest filtered output."
        />
        <MetricBars
          items={data.clusters}
          valueKey="mtd"
          renderMeta={(item) =>
            `${item.city}, ${item.circle} | ${formatNumber(item.societies)} societies`
          }
          renderFooter={(item) => (
            <>
              <span>Target {formatNumber(item.target)}</span>
              <span>{formatPercent(item.achievementPct)}</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="KPI Rank"
          title="Top KPIs"
          copy="KPI leaderboard for a fast view of the strongest levers."
        />
        <MetricBars
          items={kpiRows}
          valueKey="mtd"
          renderMeta={(item) =>
            `Target ${formatNumber(item.target)} | FTD ${formatNumber(item.ftd)}`
          }
          renderFooter={(item) => (
            <>
              <span>{formatPercent(item.achievementPct)} achieved</span>
              <span>{formatPercent(item.deltaPct)} vs LMTD</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Society Rank"
          title="Top Societies"
          copy="A compact leaderboard for the highest-output societies in the selected slice."
        />
        <SocietyCards societies={data.societies} />
      </article>
    </section>
  );
}

function CompareDashboard({ data, accent }) {
  const candidates = data.compareCandidates || [];
  const [leftId, setLeftId] = useState(candidates[0]?.id || "");
  const [rightId, setRightId] = useState(candidates[1]?.id || candidates[0]?.id || "");

  useEffect(() => {
    if (!candidates.length) {
      setLeftId("");
      setRightId("");
      return;
    }

    const firstId = candidates[0]?.id || "";
    const secondId = candidates.find((candidate) => candidate.id !== firstId)?.id || firstId;
    const candidateIds = new Set(candidates.map((candidate) => candidate.id));

    setLeftId((current) => (candidateIds.has(current) ? current : firstId));
    setRightId((current) => {
      if (candidateIds.has(current) && current !== leftId) {
        return current;
      }

      return secondId;
    });
  }, [candidates, leftId]);

  const leftCandidate =
    candidates.find((candidate) => candidate.id === leftId) || candidates[0];
  const rightCandidate =
    candidates.find((candidate) => candidate.id === rightId && candidate.id !== leftCandidate?.id) ||
    candidates.find((candidate) => candidate.id !== leftCandidate?.id) ||
    candidates[0];
  const comparisonSeries = buildHeadToHeadSeries(leftCandidate, rightCandidate);
  const comparisonRows = buildComparisonRows(leftCandidate, rightCandidate);
  const comparisonNotes = buildCompareNotes(leftCandidate, rightCandidate);
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
            detail: winner ? `${formatNumber(winner.mtd)} MTD in the active slice` : "No leader"
          },
          {
            label: "MTD Gap",
            value: formatNumber(Math.abs(leftCandidate.mtd - rightCandidate.mtd)),
            detail: `${winner?.name || "Leader"} advantage`
          },
          {
            label: "Achievement Gap",
            value: formatPercent(
              Math.abs(leftCandidate.achievementPct - rightCandidate.achievementPct)
            ),
            detail: "Difference in target achievement"
          },
          {
            label: "Customer Gap",
            value: formatNumber(Math.abs(leftCandidate.customers - rightCandidate.customers)),
            detail: "Difference in customer base"
          }
        ]
      : [];
  const comparisonColumns = [
    { key: "metric", header: "Metric" },
    {
      key: "left",
      header: leftCandidate?.name || "Left",
      render: (row) => row.formatter(row.left)
    },
    {
      key: "right",
      header: rightCandidate?.name || "Right",
      render: (row) => row.formatter(row.right)
    },
    { key: "winner", header: "Winner" }
  ];

  function handleLeftChange(nextId) {
    setLeftId(nextId);

    if (nextId === rightId) {
      setRightId(
        candidates.find((candidate) => candidate.id !== nextId)?.id || nextId
      );
    }
  }

  function handleRightChange(nextId) {
    setRightId(nextId);

    if (nextId === leftId) {
      setLeftId(
        candidates.find((candidate) => candidate.id !== nextId)?.id || nextId
      );
    }
  }

  return (
    <section className="content-grid">
      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Pick Two"
          title="Head-To-Head Manager Comparison"
          copy="Choose any two managers from the filtered slice and compare their output side by side."
        />
        <div className="compare-selector-grid">
          <label className="form-field">
            <span>Manager A</span>
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
            <span>Manager B</span>
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
        </div>
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Manager A"
          title="Selected Profile"
          copy="A compact read of the first selected manager."
        />
        <CompareProfileCard label="Manager A" candidate={leftCandidate} tone="is-left" />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Manager B"
          title="Selected Profile"
          copy="A compact read of the second selected manager."
        />
        <CompareProfileCard label="Manager B" candidate={rightCandidate} tone="is-right" />
      </article>

      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Trend"
          title="MTD Head-To-Head"
          copy="The trend line shows who is actually ahead over time, not just at the latest total."
        />
        <LineTrendChart
          data={comparisonSeries}
          lines={[
            {
              key: "left",
              label: leftCandidate?.name || "Manager A",
              color: accent
            },
            {
              key: "right",
              label: rightCandidate?.name || "Manager B",
              color: "#6f8bff"
            }
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Readout"
          title="Head-To-Head Notes"
          copy="Quick takeaways from the selected manager pair."
        />
        <InsightStack insights={comparisonNotes} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Scoreboard"
          title="Comparison Snapshot"
          copy="The key gaps between the two selected managers at a glance."
        />
        <MiniStatGrid cards={compareCards} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Metric Table"
          title="Manager Vs Manager"
          copy="Exact metric-by-metric values so you can see who wins where."
        />
        <DataTable
          columns={comparisonColumns}
          rows={comparisonRows}
          rowKey={(row) => row.metric}
          emptyMessage="No manager comparison rows available."
        />
      </article>
    </section>
  );
}

function AttendanceDashboard({ data, accent }) {
  const actionCards = [
    {
      label: "Pending Queue",
      value: formatNumber(data.summary?.pendingRegularizations),
      detail: "Regularization actions still pending"
    },
    {
      label: "Absent Days",
      value: formatNumber(data.summary?.absentDays),
      detail: "Final unresolved absences"
    },
    {
      label: "Leave Days",
      value: formatNumber(data.summary?.leaveDays),
      detail: "Leave movement in the active window"
    },
    {
      label: "On-Time Check-In",
      value: formatPercent(data.summary?.onTimeRatePct),
      detail: "Check-ins before 09:45 AM"
    }
  ];
  const employeeColumns = [
    { key: "employeeCode", header: "Employee Code" },
    { key: "employeeName", header: "Employee Name" },
    {
      key: "owner",
      header: "Owner",
      render: (row) => `${row.asm} | ${row.managerName}`
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
      )
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
            {row.latestLeaveType !== "-" ? row.latestLeaveType : row.latestCheckInTime}
          </span>
        </div>
      )
    },
    {
      key: "presentDays",
      header: "Present",
      render: (row) => formatNumber(row.presentDays)
    },
    {
      key: "leaveDays",
      header: "Leave",
      render: (row) => formatNumber(row.leaveDays)
    },
    {
      key: "absentDays",
      header: "Absent",
      render: (row) => formatNumber(row.absentDays)
    },
    {
      key: "attendancePct",
      header: "Attendance %",
      render: (row) => formatPercent(row.attendancePct)
    },
    {
      key: "avgWorkingHours",
      header: "Avg Hours",
      render: (row) => formatHours(row.avgWorkingHours)
    },
    {
      key: "pendingRegularizations",
      header: "Pending Reg.",
      render: (row) => formatNumber(row.pendingRegularizations)
    }
  ];

  return (
    <section className="content-grid">
      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Daily Movement"
          title="Attendance Trend"
          copy="Track present, leave, and absent employee-days across the selected attendance window."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "present", label: "Present", color: accent },
            { key: "leave", label: "Leave", color: "#ffbc73" },
            { key: "absent", label: "Absent", color: "#6f8bff" }
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Action Pulse"
          title="Attendance Health"
          copy="The pieces most likely to need a manager follow-up today."
        />
        <MiniStatGrid cards={actionCards} />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Manager Queue"
          title="Exception Load By Manager"
          copy="Pending regularizations and final absences are combined here to surface manager follow-up pressure."
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
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Regularization Trend"
          title="Pending vs Approved"
          copy="Use the daily queue movement to see whether the team is clearing regularization pressure."
        />
        <LineTrendChart
          data={data.regularizationTrend}
          lines={[
            { key: "pending", label: "Pending", color: accent },
            { key: "approved", label: "Approved", color: "#5fe0b0" },
            { key: "absent", label: "Absent", color: "#6f8bff" }
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Status Mix"
          title="Final Status Breakdown"
          copy="Read the share of present, leave, and absent employee-days."
        />
        <MetricBars
          items={data.statusBreakdown}
          valueKey="mtd"
          renderMeta={(item) =>
            `${formatPercent(item.achievementPct)} of all records | ${formatNumber(item.pending || 0)} pending`
          }
          renderFooter={(item) => (
            <>
              <span>{formatNumber(item.mtd)} employee-days</span>
              <span>{formatPercent(item.achievementPct)}</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="ASM Board"
          title="ASM Attendance Health"
          copy="ASM groups ranked by final present rate across the active window."
        />
        <MetricBars
          items={data.asmPerformance}
          valueKey="mtd"
          renderMeta={(item) =>
            `${formatNumber(item.employees)} employees | ${formatHours(item.avgWorkingHours)} avg hrs`
          }
          renderFooter={(item) => (
            <>
              <span>{formatPercent(item.achievementPct)} present rate</span>
              <span>{formatNumber(item.cities)} cities</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Leave Signals"
          title="Top Leave Reasons"
          copy="The most common leave reasons in the active slice."
        />
        <MetricBars
          items={data.leaveTypes}
          valueKey="mtd"
          renderMeta={(item) => `${formatPercent(item.achievementPct)} of leave entries`}
          renderFooter={(item) => (
            <>
              <span>{formatNumber(item.mtd)} leave rows</span>
              <span>{formatPercent(item.achievementPct)}</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Exception Table"
          title="Employee Exception View"
          copy="Employees stay sorted toward the top when attendance is weak, absences are high, or regularizations are still pending."
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

export default function DashboardContent({ dashboardId, data, accent }) {
  if (dashboardId === "regional-network") {
    return <HomePassDashboard data={data} accent={accent} />;
  }

  if (dashboardId === "leaderboard-dashboard") {
    return <LeaderboardDashboard data={data} accent={accent} />;
  }

  if (dashboardId === "compare-dashboard") {
    return <CompareDashboard data={data} accent={accent} />;
  }

  if (dashboardId === "manager-pulse") {
    return <AttendanceDashboard data={data} accent={accent} />;
  }

  return <SalesOverview data={data} accent={accent} />;
}
