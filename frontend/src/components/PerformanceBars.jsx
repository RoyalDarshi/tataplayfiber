import { formatNumber, formatPercent } from "../utils/formatters.js";

export default function PerformanceBars({ items, renderMeta }) {
  if (!items?.length) {
    return <div className="empty-state">No performance data available.</div>;
  }

  const peakValue = Math.max(...items.map((item) => item.mtd), 1);

  return (
    <div className="performance-list">
      {items.map((item) => (
        <article key={`${item.label}-${item.target}`} className="performance-item">
          <div className="performance-head">
            <div>
              <strong>{item.label}</strong>
              {renderMeta && <span className="performance-sub">{renderMeta(item)}</span>}
            </div>
            <strong>{formatNumber(item.mtd)}</strong>
          </div>

          <div className="performance-bar">
            <span
              className="performance-fill"
              style={{ width: `${Math.max((item.mtd / peakValue) * 100, 8)}%` }}
            />
          </div>

          <div className="performance-meta">
            <span>Target {formatNumber(item.target)}</span>
            <span>{formatPercent(item.achievementPct)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
