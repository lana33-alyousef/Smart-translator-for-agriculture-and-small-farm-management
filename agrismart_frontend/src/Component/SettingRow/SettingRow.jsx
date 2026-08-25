import "./SettingRow.css";

export default function SettingRow({
  icon,
  label,
  control,
  type = "default",
  children,
}) {
  return (
    <div className={`setting-row setting-row--${type}`}>
      <div className="setting-row__label" dir="rtl">
        {icon && <img src={icon} alt="" aria-hidden="true" />}
        <span>{label}</span>
      </div>
      <div className="setting-row__control">{control || children}</div>
    </div>
  );
}
