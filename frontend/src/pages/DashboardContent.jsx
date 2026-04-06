import LineTrendChart from "../components/charts/LineTrendChart.jsx";
import InsightStack from "../components/InsightStack.jsx";
import KpiDeck from "../components/KpiDeck.jsx";
import LeaderboardTable from "../components/LeaderboardTable.jsx";
import PerformanceBars from "../components/PerformanceBars.jsx";
import { formatNumber, formatPercent } from "../utils/formatters.js";

function PanelHeader({ title }) {
  return (
    <div className="panel-header">
      <h2 className="section-title">{title}</h2>
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
      <article className="panel panel-span-12 panel-pad">
        <PanelHeader title="Core KPI Cards" />
        <KpiDeck cards={data.kpiCards} accent={accent} />
      </article>

      <article className="panel panel-span-8 panel-pad">
        <PanelHeader title="Sales Trend" />
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
        <PanelHeader title="City Performance" />
        <PerformanceBars
          items={data.cities}
          renderMeta={(item) =>
            `${item.customers.toLocaleString("en-IN")} customers | ${item.homePassed.toLocaleString("en-IN")} homes`
          }
        />
      </article>

      <article className="panel panel-span-7 panel-pad">
        <PanelHeader title="Top Managers" />
        <LeaderboardTable rows={data.managers} />
      </article>

      <article className="panel panel-span-5 panel-pad">
        <PanelHeader title="Performance Highlights" />
        <InsightStack insights={data.insights} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader title="High-Impact Societies" />
        <SocietyCards societies={data.societies} />
      </article>
    </section>
  );
}

function RegionalNetwork({ data, accent }) {
  return (
    <section className="content-grid">
      <article className="panel panel-span-7 panel-pad">
        <PanelHeader title="Network Throughput" />
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
        <PanelHeader title="Regional Leaders" />
        <PerformanceBars
          items={data.circles}
          renderMeta={(item) => `${formatPercent(item.achievementPct)} achievement`}
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader title="Cluster Performance" />
        <PerformanceBars
          items={data.clusters}
          renderMeta={(item) => `${item.city}, ${item.circle} | ${item.societies} societies`}
        />
      </article>

      <article className="panel panel-span-6 panel-pad">
        <PanelHeader title="KPI Performance Cards" />
        <KpiDeck cards={data.kpiCards} accent={accent} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader title="Top Societies by Output" />
        <SocietyCards societies={data.societies} />
      </article>
    </section>
  );
}

function ManagerPulse({ data, accent }) {
  return (
    <section className="content-grid">
      <article className="panel panel-span-4 panel-pad">
        <PanelHeader title="Role Contribution" />
        <PerformanceBars
          items={data.roles}
          renderMeta={(item) => `${item.managers} managers active`}
        />
      </article>

      <article className="panel panel-span-8 panel-pad">
        <PanelHeader title="Manager Output Trend" />
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
        <PanelHeader title="Manager Leaderboard" />
        <LeaderboardTable rows={data.managers} />
      </article>

      <article className="panel panel-span-4 panel-pad">
        <PanelHeader title="Manager Insights" />
        <InsightStack insights={data.insights} />
      </article>

      <article className="panel panel-span-12 panel-pad">
        <PanelHeader title="KPI Cards by Manager Slice" />
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
