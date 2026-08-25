import React from "react";
import "./ReportToggle.css";

export default function ReportToggle({ value, onChange }) {
  const isDaily = value === "daily";

  return (
    <div className="report-toggle" role="tablist" aria-label="نوع التقرير">
      <button
        type="button"
        role="tab"
        aria-selected={isDaily}
        className={`report-toggle__button ${isDaily ? "is-daily" : "is-monthly"}`}
        onClick={() => onChange(isDaily ? "monthly" : "daily")}>
        <span className="report-toggle__text">
          {isDaily ? "التقارير اليومية" : "التقارير الشهرية"}
        </span>
      </button>
    </div>
  );
}
