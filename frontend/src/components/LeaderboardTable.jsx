import { formatNumber, formatPercent } from "../utils/formatters.js";

export default function LeaderboardTable({ rows }) {
  if (!rows?.length) {
    return <div className="empty-state">No leaderboard rows available.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Manager</th>
            <th>Role</th>
            <th>Location</th>
            <th>Primary KPI</th>
            <th>Target</th>
            <th>MTD</th>
            <th>Achievement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.name}-${row.city}`}>
              <td>{row.name}</td>
              <td>{row.role}</td>
              <td>{`${row.city}, ${row.circle}`}</td>
              <td>{row.primaryKpi}</td>
              <td>{formatNumber(row.target)}</td>
              <td>{formatNumber(row.mtd)}</td>
              <td>{formatPercent(row.achievementPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

