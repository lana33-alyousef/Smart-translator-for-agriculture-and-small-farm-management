import "./SettingsSwitch.css";

export default function SettingsSwitch({
  checked,
  smallLabel,
  onClick,
  checkedThumbIcon = "/img/sun.png",
  uncheckedThumbIcon = "/img/moon.png",
  variant = "decorated",
}) {
  const switchClasses = [
    "settings-switch",
    checked ? "is-on" : "is-off",
    variant === "simple" ? "settings-switch--simple" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const trackStyle =
    variant === "decorated"
      ? checked
        ? {
            background: "linear-gradient(180deg, #a8d35f 0%, #95c74d 100%)",
          }
        : {
            background: "linear-gradient(180deg, #d0d0d0 0%, #c8c8c8 100%)",
          }
      : undefined;

  const thumbIconSrc = checked ? checkedThumbIcon : uncheckedThumbIcon;

  return (
    <label className={switchClasses} aria-label={checked ? "مفعّل" : "متوقف"}>
      <input
        className="settings-switch__input"
        type="checkbox"
        checked={checked}
        onChange={onClick}
        aria-hidden="true"
      />
      <span
        className="settings-switch__track"
        aria-hidden="true"
        style={trackStyle}>
        {!checked ? (
          <span className="settings-switch__hint">{smallLabel}</span>
        ) : null}
        <span className="settings-switch__ornament settings-switch__ornament--one" />
        <span className="settings-switch__ornament settings-switch__ornament--two" />
        <span className="settings-switch__ornament settings-switch__ornament--three" />
        <span className="settings-switch__ornament settings-switch__ornament--four" />
        <span className="settings-switch__thumb" role="img" aria-hidden="true">
          <img
            src={thumbIconSrc}
            alt=""
            className="settings-switch__thumb-img"
          />
        </span>
      </span>
    </label>
  );
}
