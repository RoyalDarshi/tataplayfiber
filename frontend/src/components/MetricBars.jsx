import { formatNumber } from "../utils/formatters.js";

export default function MetricBars({
  items,
  valueKey = "value",
  valueFormatter = formatNumber,
  renderMeta,
  renderFooter,
  emptyMessage = "No data available."
}) {
  if (!items?.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const peakValue = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);

  return (
    <div className="performance-list">
      {items.map((item) => (
        <article
          key={`${item.key || item.label}-${item[valueKey]}`}
          className="performance-item"
        >
          <div className="performance-head">
            <div>
              <strong>{item.label}</strong>
              {renderMeta && <span className="performance-sub">{renderMeta(item)}</span>}
            </div>
            <strong>{valueFormatter(item[valueKey])}</strong>
          </div>

          <div className="performance-bar">
            <span
              className="performance-fill"
              style={{
                width: `${Math.max((Number(item[valueKey] || 0) / peakValue) * 100, 8)}%`
              }}
            />
          </div>

          {renderFooter && <div className="performance-meta">{renderFooter(item)}</div>}
        </article>
      ))}
    </div>
  );
}
