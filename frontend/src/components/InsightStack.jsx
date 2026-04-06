export default function InsightStack({ insights }) {
  if (!insights?.length) {
    return <div className="empty-state">No insights to display.</div>;
  }

  return (
    <div className="insight-list">
      {insights.map((insight) => (
        <article key={insight} className="insight-item">
          {insight}
        </article>
      ))}
    </div>
  );
}

