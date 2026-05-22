export function ScoreBar({ value = 0 }) {
  const color = value >= 70 ? '#2ab87a' : value >= 50 ? '#e8a020' : '#d4562a';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="score-text">{Math.round(value)}</span>
    </div>
  );
}