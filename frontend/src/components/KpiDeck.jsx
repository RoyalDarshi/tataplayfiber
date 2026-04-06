import LineTrendChart from "./charts/LineTrendChart.jsx";
import { formatNumber, formatPercent } from "../utils/formatters.js";

const CARD_COLORS = [
  "#4dc7a3",
  "#6f8bff",
  "#ff8f6b",
  "#16c4bf",
  "#ffbb54",
  "#f578b1"
];

function hexToRgba(hexColor, alpha) {
  if (!hexColor || !hexColor.startsWith("#")) {
    return `rgba(77, 199, 163, ${alpha})`;
  }

  const normalized = hexColor.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;
  const integer = Number.parseInt(safeHex, 16);
  const red = (integer >> 16) & 255;
  const green = (integer >> 8) & 255;
  const blue = integer & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function KpiDeck({ cards, accent }) {
  if (!cards?.length) {
    return <div className="empty-state">No KPI cards available.</div>;
  }

  return (
    <div className="kpi-grid is-stacked">
      {cards.map((card, index) => (
        <article
          key={card.kpiName}
          className="kpi-card is-stacked"
          style={{
            "--card-accent": index === 0 ? accent : CARD_COLORS[index % CARD_COLORS.length],
            "--card-accent-soft": hexToRgba(
              index === 0 ? accent : CARD_COLORS[index % CARD_COLORS.length],
              0.18
            ),
            "--card-accent-ring": hexToRgba(
              index === 0 ? accent : CARD_COLORS[index % CARD_COLORS.length],
              0.28
            )
          }}
        >
          <div className="kpi-top is-stacked">
            <span className="kpi-name">{card.kpiName}</span>
          </div>

          <div className="kpi-card-body">
            <div className="kpi-chart-panel">
              <LineTrendChart
                data={card.series}
                lines={[
                  {
                    key: "value",
                    label: card.kpiName,
                    color:
                      index === 0 ? accent : CARD_COLORS[index % CARD_COLORS.length]
                  }
                ]}
                height={220}
                compact
                showArea={false}
              />
            </div>

            <div className="kpi-stats-grid">
              <div className="kpi-stat-item">
                <span className="kpi-stat-label">Target</span>
                <strong className="kpi-stat-value">{formatNumber(card.target)}</strong>
              </div>
              <div className="kpi-stat-item">
                <span className="kpi-stat-label">FTD</span>
                <strong className="kpi-stat-value">{formatNumber(card.ftd)}</strong>
              </div>
              <div className="kpi-stat-item is-featured">
                <span className="kpi-stat-label">MTD</span>
                <strong className="kpi-stat-value">{formatNumber(card.mtd)}</strong>
              </div>
              <div className="kpi-stat-item">
                <span className="kpi-stat-label">LM</span>
                <strong className="kpi-stat-value">{formatNumber(card.lm)}</strong>
              </div>
              <div className="kpi-stat-item">
                <span className="kpi-stat-label">LMTD</span>
                <strong className="kpi-stat-value">{formatNumber(card.lmtd)}</strong>
              </div>
              <div className="kpi-stat-item">
                <span className="kpi-stat-label">Achievement</span>
                <strong className="kpi-stat-value">
                  {formatPercent(card.achievementPct)}
                </strong>
              </div>
              <div className="kpi-stat-item">
                <span className="kpi-stat-label">Delta</span>
                <strong
                  className={`kpi-stat-value ${
                    card.deltaPct >= 0 ? "is-positive-text" : "is-negative-text"
                  }`}
                >
                  {card.deltaPct >= 0 ? "+" : ""}
                  {formatPercent(card.deltaPct)}
                </strong>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
