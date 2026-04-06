import LineTrendChart from "../components/charts/LineTrendChart.jsx";
import InsightStack from "../components/InsightStack.jsx";
import KpiDeck from "../components/KpiDeck.jsx";
import LeaderboardTable from "../components/LeaderboardTable.jsx";
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

function RegionalNetwork({ data, accent }) {
  return (
    <section className="content-grid">
      <article className="panel panel-span-7 panel-pad">
        <PanelHeader
          kicker="Regional Trend"
          title="Network Throughput"
          copy="Track output movement and compare current production with target shape."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "mtd", label: "MTD", color: accent },
            { key: "ftd", label: "FTD", color: "#5fe0b0" }
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-5 panel-pad">
        <PanelHeader
          kicker="Circle Ranking"
          title="Regional Leaders"
          copy="Best circles by MTD and target achievement."
        />
        <PerformanceBars
          items={data.circles}
          renderMeta={(item) => `${formatPercent(item.achievementPct)} achievement`}
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="Cluster Focus"
          title="Cluster Performance"
          copy="Clusters are ranked by active output inside the filter selection."
        />
        <PerformanceBars
          items={data.clusters}
          renderMeta={(item) => `${item.city}, ${item.circle} | ${item.societies} societies`}
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader
          kicker="KPI Contribution"
          title="KPI Performance Cards"
          copy="Use KPI-level performance to understand the strongest regional levers."
        />
        <KpiDeck cards={data.kpiCards} accent={accent} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="Society Coverage"
          title="Top Societies by Output"
          copy="Societies stay visible in a responsive card layout across screen sizes."
        />
        <SocietyCards societies={data.societies} />
      </article>
    </section>
  );
}

function ManagerPulse({ data, accent }) {
  return (
    <section className="content-grid">
      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Role Mix"
          title="Role Contribution"
          copy="See how ASM and CSM groups contribute to the active number."
        />
        <PerformanceBars
          items={data.roles}
          renderMeta={(item) => `${item.managers} managers active`}
        />
      </article>

      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Productivity Trend"
          title="Manager Output Trend"
          copy="Track overall MTD and FTD movement for the selected manager slice."
        />
        <LineTrendChart
          data={data.totalSeries}
          lines={[
            { key: "mtd", label: "MTD", color: accent },
            { key: "ftd", label: "FTD", color: "#86b9ff" }
          ]}
          height={320}
        />
      </article>

      <article className="panel panel-span-8 panel-pad">
        <PanelHeader
          kicker="Team Board"
          title="Manager Leaderboard"
          copy="A clean, wide table for desktop and horizontal scroll on smaller screens."
        />
        <LeaderboardTable rows={data.managers} />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader
          kicker="Signals"
          title="Manager Insights"
          copy="Short summaries that spotlight where action is needed."
        />
        <InsightStack insights={data.insights} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader
          kicker="KPI Load"
          title="KPI Cards by Manager Slice"
          copy="Useful for understanding whether productivity is broad-based or concentrated."
        />
        <KpiDeck cards={data.kpiCards} accent={accent} />
      </article>
    </section>
  );
}

export default function DashboardContent({ dashboardId, data, accent }) {
  if (dashboardId === "regional-network") {
    return <RegionalNetwork data={data} accent={accent} />;
  }

  if (dashboardId === "manager-pulse") {
    return <ManagerPulse data={data} accent={accent} />;
  }

  return <SalesOverview data={data} accent={accent} />;
}
