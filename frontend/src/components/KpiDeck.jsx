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
      {cards.map((card, index) => {
        const cardAccent = index === 0 ? accent : CARD_COLORS[index % CARD_COLORS.length];
        const cardSoft = hexToRgba(cardAccent, 0.18);
        const cardRing = hexToRgba(cardAccent, 0.28);
        const lmtd = card.lmtd || card.target; // Fallback to target if lmtd isn't explicitly passed
        
        return (
          <article
            key={card.kpiName}
            className="kpi-card"
            style={{
              "--card-accent": cardAccent,
              "--card-accent-soft": cardSoft,
              "--card-accent-ring": cardRing,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px"
            }}
          >
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "16px" }}>
              <div className="kpi-top" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                <span className="kpi-name">{card.kpiName}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <strong className="kpi-value" style={{ margin: 0 }}>{formatNumber(card.mtd)}</strong>
                  <span
                    className={`delta-chip ${
                      card.deltaPct >= 0 ? "is-positive" : "is-negative"
                    }`}
                  >
                    {card.deltaPct >= 0 ? "+" : ""}
                    {formatPercent(card.deltaPct)}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.7)", padding: "8px 12px", border: `1px solid ${cardRing}`, borderRadius: "10px", flex: "0 0 auto" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-soft)", fontWeight: "600", marginBottom: "2px" }}>MTD</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-strong)" }}>{formatNumber(card.mtd)}</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.7)", padding: "8px 12px", border: `1px solid ${cardRing}`, borderRadius: "10px", flex: "0 0 auto" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-soft)", fontWeight: "600", marginBottom: "2px" }}>LMTD</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-strong)" }}>{formatNumber(lmtd)}</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.7)", padding: "8px 12px", border: `1px solid ${cardRing}`, borderRadius: "10px", flex: "0 0 auto" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-soft)", fontWeight: "600", marginBottom: "2px" }}>FTD</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-strong)" }}>{formatNumber(card.ftd)}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, height: "100%", minHeight: "150px", minWidth: 0, position: "relative", alignSelf: "stretch" }}>
              <LineTrendChart
                data={card.series}
                lines={[
                  {
                    key: "value",
                    label: card.kpiName,
                    color: cardAccent
                  }
                ]}
                height={150}
                showArea={true}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
