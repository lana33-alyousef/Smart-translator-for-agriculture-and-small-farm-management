import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReportsSettings.css";

export default function ReportsSettings() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleDailyReports = () => {
    navigate("/reports");
  };

  const handleMonthlyReports = () => {
    navigate("/reports");
  };

  return (
    <div className="reports-settings">
      <div className="reports-settings__header">
        <h2>نوع التقرير المرغوب</h2>
      </div>

      <div className="reports-settings__buttons">
        <button
          className="reports-settings__btn reports-settings__btn--daily"
          onClick={handleDailyReports}>
          يومية
        </button>
        <button
          className="reports-settings__btn reports-settings__btn--monthly"
          onClick={handleMonthlyReports}>
          شهرية
        </button>
      </div>

      <div className="reports-settings__form">
        <label className="reports-settings__label">
          ادخل البريد الإلكتروني الذي تريد إرسال التقرير عليه
          <select className="reports-settings__dropdown"></select>
        </label>

        <input
          type="email"
          className="reports-settings__input"
          placeholder="ادخل البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </div>
  );
}
