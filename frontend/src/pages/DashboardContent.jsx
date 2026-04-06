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
          kicker="Quick Read"
          title="Coverage Insights"
          copy="Short operating takeaways for expansion and conversion."
        />
        <InsightStack insights={data.insights} />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Circle Coverage"
          title="Home Pass by Circle"
          copy="Larger bars indicate wider coverage footprint across the selected circle."
        />
        <MetricBars
          items={data.circles}
          valueKey="homePassed"
          renderMeta={(item) =>
            `${formatNumber(item.customers)} customers | ${formatPercent(item.connectRatePct)} connect rate`
          }
          renderFooter={(item) => (
            <>
              <span>{formatNumber(item.managers)} managers</span>
              <span>{formatNumber(item.societies)} societies</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="City Density"
          title="City Coverage Board"
          copy="Track where customer pull is strongest against the available home pass footprint."
        />
        <MetricBars
          items={data.cities}
          valueKey="homePassed"
          renderMeta={(item) =>
            `${item.city}, ${item.circle} | ${formatNumber(item.customers)} customers`
          }
          renderFooter={(item) => (
            <>
              <span>{formatPercent(item.connectRatePct)} connect rate</span>
              <span>{formatNumber(item.societies)} societies</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Society Reach"
          title="Top Societies by Home Pass"
          copy="The card layout keeps the strongest societies visible across desktop and mobile."
        />
        <CoverageCards societies={data.societies} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Manager Board"
          title="Coverage Leaders"
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
  const kpiRows = (data.kpiCards || []).map((card) => ({
    ...card,
    label: card.kpiName
  }));
  const circleColumns = [
    { key: "label", header: "Circle" },
    {
      key: "target",
      header: "Target",
      render: (row) => formatNumber(row.target)
    },
    {
      key: "ftd",
      header: "FTD",
      render: (row) => formatNumber(row.ftd)
    },
    {
      key: "mtd",
      header: "MTD",
      render: (row) => formatNumber(row.mtd)
    },
    {
      key: "customers",
      header: "Customers",
      render: (row) => formatNumber(row.customers)
    },
    {
      key: "homePassed",
      header: "Home Passed",
      render: (row) => formatNumber(row.homePassed)
    },
    {
      key: "achievementPct",
      header: "Achievement",
      render: (row) => formatPercent(row.achievementPct)
    }
  ];

  return (
    <section className="content-grid">
      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Comparison Trend"
          title="MTD vs Target vs FTD"
          copy="Use the common trend line to compare overall movement before drilling into circles, roles, and KPIs."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "mtd", label: "MTD", color: accent },
            { key: "target", label: "Target", color: "#6f8bff" },
            { key: "ftd", label: "FTD", color: "#ffbc73" }
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Compare Notes"
          title="Comparison Insights"
          copy="A short narrative of the current performance gaps and leaders."
        />
        <InsightStack insights={data.insights} />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Circle Compare"
          title="Circle vs Circle"
          copy="How circles stack up on MTD, customers, and target achievement."
        />
        <PerformanceBars
          items={data.circles}
          renderMeta={(item) =>
            `${formatNumber(item.customers)} customers | ${formatPercent(item.achievementPct)} achievement`
          }
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Role Compare"
          title="Role vs Role"
          copy="Role contribution comparison across the active filter combination."
        />
        <PerformanceBars
          items={data.roles}
          renderMeta={(item) =>
            `${formatNumber(item.managers)} managers | ${formatPercent(item.achievementPct)} achievement`
          }
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Cluster Compare"
          title="Cluster vs Cluster"
          copy="Compare clusters on output and footprint concentration."
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

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="KPI Compare"
          title="KPI vs KPI"
          copy="See which KPI is leading and which still trails the target line."
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
          kicker="Comparison Table"
          title="Circle Comparison Table"
          copy="A denser comparison grid for circles when you need exact values instead of relative bars."
        />
        <DataTable
          columns={circleColumns}
          rows={data.circles}
          rowKey={(row) => row.label}
          emptyMessage="No circle comparison rows available."
        />
      </article>
    </section>
  );
}

function AttendanceDashboard({ data, accent }) {
  const employeeColumns = [
    { key: "employeeCode", header: "Employee Code" },
    { key: "employeeName", header: "Employee Name" },
    { key: "roleName", header: "Role" },
    { key: "managerName", header: "Manager" },
    { key: "asm", header: "ASM" },
    {
      key: "location",
      header: "Location",
      render: (row) => `${row.city}, ${row.state}`
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
      render: (row) => `${Number(row.avgWorkingHours || 0).toFixed(1)} hrs`
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
          kicker="Signals"
          title="Attendance Insights"
          copy="Short summaries that highlight where follow-up is needed."
        />
        <InsightStack insights={data.insights} />
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
          copy="Each ASM is ranked by final present employee-days in the selected window."
        />
        <MetricBars
          items={data.asmPerformance}
          valueKey="mtd"
          renderMeta={(item) =>
            `${formatNumber(item.employees)} employees | ${Number(item.avgWorkingHours || 0).toFixed(1)} avg hrs`
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
          kicker="Regularization"
          title="Regularization Queue"
          copy="Track which records are already approved and which still need action."
        />
        <MetricBars
          items={data.regularizations}
          valueKey="mtd"
          renderMeta={(item) => `${formatPercent(item.achievementPct)} of filtered rows`}
          renderFooter={(item) => (
            <>
              <span>{formatNumber(item.mtd)} rows</span>
              <span>{formatPercent(item.achievementPct)}</span>
            </>
          )}
        />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Exception Table"
          title="Employee Attendance View"
          copy="Employees are sorted toward exceptions first so low attendance and pending regularizations stay visible."
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
