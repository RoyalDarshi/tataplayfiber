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
    <div className="kpi-grid">
      {cards.map((card, index) => (
        <article
          key={card.kpiName}
          className="kpi-card"
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
          <div className="kpi-top">
            <div>
              <span className="kpi-name">{card.kpiName}</span>
              <strong className="kpi-value">{formatNumber(card.mtd)}</strong>
            </div>
            <span
              className={`delta-chip ${
                card.deltaPct >= 0 ? "is-positive" : "is-negative"
              }`}
            >
              {card.deltaPct >= 0 ? "+" : ""}
              {formatPercent(card.deltaPct)}
            </span>
          </div>

          <div className="kpi-meta">
            <span>Target {formatNumber(card.target)}</span>
            <span>FTD {formatNumber(card.ftd)}</span>
            <span>{formatPercent(card.achievementPct)} achieved</span>
          </div>

          <LineTrendChart
            data={card.series}
            lines={[
              {
                key: "value",
                label: card.kpiName,
                color: index === 0 ? accent : CARD_COLORS[index % CARD_COLORS.length]
              }
            ]}
            height={120}
            compact
            showArea={false}
          />
        </article>
      ))}
    </div>
  );
}
