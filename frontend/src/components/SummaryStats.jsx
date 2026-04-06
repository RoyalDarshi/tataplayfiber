import {
  formatCompactNumber,
  formatNumber,
  formatPercent
} from "../utils/formatters.js";

export default function SummaryStats({ summary }) {
  const fallbackCards = [
    {
      label: "Target",
      value: formatNumber(summary?.target),
      detail: "Current selection"
    },
    {
      label: "FTD",
      value: formatNumber(summary?.ftd),
      detail: "Today movement"
    },
    {
      label: "MTD",
      value: formatNumber(summary?.mtd),
      detail: "Month to date"
    },
    {
      label: "LM",
      value: formatNumber(summary?.lm),
      detail: "Last month"
    },
    {
      label: "LMTD",
      value: formatNumber(summary?.lmtd),
      detail: "Last month to date"
    },
    {
      label: "Achievement",
      value: formatPercent(summary?.achievementPct),
      detail: "Against target"
    },
    {
      label: "Customers",
      value: formatCompactNumber(summary?.customers),
      detail: "Customer base"
    },
    {
      label: "Home Passed",
      value: formatCompactNumber(summary?.homePassed),
      detail: "Network reach"
    }
  ];
  const statCards = summary?.cards
    ? summary.cards.map((card) => ({
        label: card.label,
        value:
          card.format === "percent"
            ? formatPercent(card.value)
            : card.format === "hours"
              ? `${Number(card.value || 0).toFixed(1)} hrs`
              : card.format === "compact"
                ? formatCompactNumber(card.value)
                : formatNumber(card.value),
        detail: card.detail
      }))
    : fallbackCards;

  return (
    <section className="summary-grid">
      {statCards.map((card) => (
        <article key={card.label} className="panel stat-card">
          <span className="stat-label">{card.label}</span>
          <strong className="stat-value">{card.value}</strong>
          <span className="stat-detail">{card.detail}</span>
        </article>
      ))}
    </section>
  );
}
