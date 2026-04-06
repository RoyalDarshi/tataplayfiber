import { useId, useRef, useState } from "react";
import { formatNumber } from "../../utils/formatters.js";

function hexToRgba(hexColor, alpha) {
  if (!hexColor || !hexColor.startsWith("#")) {
    return hexColor;
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

function buildPath(points) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export default function LineTrendChart({
  data,
  lines,
  height = 300,
  compact = false,
  showArea = true
}) {
  if (!data?.length || !lines?.length) {
    return <div className="empty-state">No chart data available.</div>;
  }

  const [activeIndex, setActiveIndex] = useState(null);
  const stageRef = useRef(null);
  const gradientId = useId().replace(/:/g, "");
  const width = 1000;
  const padding = compact
    ? { top: 18, right: 12, bottom: 12, left: 12 }
    : { top: 22, right: 20, bottom: 40, left: 44 };
  const allValues = data.flatMap((entry) =>
    lines.map((line) => Number(entry[line.key] || 0))
  );
  const maxValue = Math.max(...allValues, 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const baseLine = height - padding.bottom;
  const step = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;
  const yScale = (value) =>
    baseLine - (Number(value || 0) / maxValue) * innerHeight;
  const xScale = (index) => padding.left + index * step;
  const labelInterval = compact
    ? Number.MAX_SAFE_INTEGER
    : Math.max(1, Math.floor(data.length / 5));
  const plottedLines = lines.map((line) => ({
    ...line,
    points: data.map((entry, index) => ({
      x: xScale(index),
      y: yScale(entry[line.key]),
      value: Number(entry[line.key] || 0)
    }))
  }));
  const activeEntry = activeIndex === null ? null : data[activeIndex];
  const activePoints =
    activeIndex === null
      ? []
      : plottedLines.map((line) => ({
          ...line,
          point: line.points[activeIndex]
        }));
  const activeX = activePoints[0]?.point?.x ?? 0;
  const edgeClass =
    activeIndex !== null
      ? activeIndex < 2
        ? "is-left-edge"
        : activeIndex > data.length - 3
          ? "is-right-edge"
          : ""
      : "";

  function setClosestIndex(clientX) {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const viewBoxX = ratio * width;
    const nextIndex =
      data.length === 1
        ? 0
        : clamp(
            Math.round((viewBoxX - padding.left) / step),
            0,
            data.length - 1
          );

    setActiveIndex(nextIndex);
  }

  function handlePointerMove(event) {
    setClosestIndex(event.clientX);
  }

  function handlePointerEnter() {
    if (activeIndex === null) {
      setActiveIndex(data.length - 1);
    }
  }

  function handleKeyDown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    setActiveIndex((current) => {
      const fallbackIndex = event.key === "ArrowLeft" ? data.length - 1 : 0;
      const baseIndex = current ?? fallbackIndex;

      return clamp(
        baseIndex + (event.key === "ArrowRight" ? 1 : -1),
        0,
        data.length - 1
      );
    });
  }

  return (
    <div className={`chart-shell ${compact ? "is-compact" : ""}`}>
      {!compact && lines.length > 1 && (
        <div className="chart-legend">
          {lines.map((line) => (
            <span key={line.key} className="legend-item">
              <span
                className="legend-swatch"
                style={{ backgroundColor: line.color }}
              />
              {line.label}
            </span>
          ))}
        </div>
      )}

      <div
        ref={stageRef}
        className="chart-stage"
        tabIndex={0}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
        onBlur={() => setActiveIndex(null)}
        onKeyDown={handleKeyDown}
      >
        {activeEntry && (
          <div
            className={`chart-tooltip ${compact ? "is-compact" : ""} ${edgeClass}`}
            style={{ left: `${(activeX / width) * 100}%` }}
          >
            <div className="chart-tooltip-head">{activeEntry.label}</div>
            <div className="chart-tooltip-body">
              {activePoints.map((line) => (
                <div key={line.key} className="chart-tooltip-row">
                  <span className="chart-tooltip-key">
                    <span
                      className="chart-tooltip-dot"
                      style={{ backgroundColor: line.color }}
                    />
                    {line.label}
                  </span>
                  <strong>{formatNumber(line.point.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <svg
          className="chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Trend chart. Hover or use arrow keys to inspect values."
        >
          <defs>
            <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hexToRgba(lines[0].color, 0.45)} />
              <stop offset="100%" stopColor={hexToRgba(lines[0].color, 0.02)} />
            </linearGradient>
          </defs>

          {Array.from({ length: compact ? 3 : 5 }, (_, index) => {
            const y =
              padding.top +
              (index * innerHeight) / (compact ? 2 : 4);

            return (
              <g key={`grid-${index}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(46, 79, 111, 0.12)"
                  strokeDasharray="4 8"
                />
                {!compact && (
                  <text
                    x={8}
                    y={y + 4}
                    fill="rgba(69, 96, 120, 0.58)"
                    fontSize="14"
                  >
                    {Math.round(maxValue - (index * maxValue) / 4).toLocaleString(
                      "en-IN"
                    )}
                  </text>
                )}
              </g>
            );
          })}

          {plottedLines.map((line, lineIndex) => {
            const linePath = buildPath(line.points);
            const areaPath = `${linePath} L ${line.points[line.points.length - 1].x} ${baseLine} L ${line.points[0].x} ${baseLine} Z`;

            return (
              <g key={line.key}>
                {showArea && !compact && lineIndex === 0 && (
                  <path d={areaPath} fill={`url(#area-${gradientId})`} />
                )}
                <path
                  d={linePath}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={compact ? 3.5 : 4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {activeEntry && (
            <g>
              <line
                className="chart-active-guide"
                x1={activeX}
                x2={activeX}
                y1={padding.top}
                y2={baseLine}
              />
              {activePoints.map((line) => (
                <circle
                  key={`active-${line.key}`}
                  className="chart-active-dot"
                  cx={line.point.x}
                  cy={line.point.y}
                  r={compact ? 5.5 : 6.5}
                  fill={line.color}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
              ))}
            </g>
          )}

          {!compact &&
            data.map((entry, index) => {
              if (index % labelInterval !== 0 && index !== data.length - 1) {
                return null;
              }

              return (
                <text
                  key={entry.date}
                  x={xScale(index)}
                  y={height - 10}
                  fill="rgba(69, 96, 120, 0.68)"
                  fontSize="14"
                  textAnchor="middle"
                >
                  {entry.label}
                </text>
              );
            })}
        </svg>
      </div>
    </div>
  );
}
