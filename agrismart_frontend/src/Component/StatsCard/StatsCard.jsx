import "./StatsCard.css";

export default function StatsCard({ icon, label, value, variant = "water" }) {
  return (
    <article className={`stats-card stats-card--${variant}`}>
      <div className="stats-card__value">
        <img src={icon} alt="" aria-hidden="true" />
        <strong>{value}</strong>
      </div>
      <p className="stats-card__label">{label}</p>
    </article>
  );
}
