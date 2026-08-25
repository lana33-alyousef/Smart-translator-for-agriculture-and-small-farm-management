import { useState } from "react";
import { MdSentimentSatisfiedAlt } from "react-icons/md";
import "./DailyReports.css";
import StatsCard from "../../Component/StatsCard/StatsCard";

export default function DailyReports() {
  const [view, setView] = useState("daily");
  const isDaily = view === "daily";

  return (
    <div className="daily-reports-page" dir="rtl">
      <div className="daily-reports-shell">
        <header className="daily-reports-top">
          <div className="daily-reports-nav">
            <div className="daily-reports-brand">
              <img src="/img/logo.png" alt="AgriSmart logo" />
              <span className="daily-reports-logo">AgriSmart</span>
            </div>

            <nav dir="rtl">
              <span className="daily-reports-menu">☰</span>
              <span className="daily-reports-search">بحث</span>
              <a href="/tips">نصائح و إرشادات</a>
              <a href="/about">من نحن</a>
              <a href="/contact">تواصل معنا</a>
            </nav>
          </div>
        </header>

        <div
          className="daily-reports-toggle"
          role="tablist"
          aria-label="التقارير اليومية والشهرية">
          <button
            type="button"
            className={`daily-reports-toggle__label ${isDaily ? "is-active" : ""}`}
            onClick={() => setView("daily")}>
            تقارير يومية
          </button>

          <button
            type="button"
            className={`daily-reports-toggle__label ${!isDaily ? "is-active" : ""}`}
            onClick={() => setView("monthly")}>
            تقارير شهرية
          </button>

          <span
            className={`daily-reports-toggle__thumb ${isDaily ? "is-daily" : "is-monthly"}`}
            aria-hidden="true"
          />
        </div>

        <main className="daily-reports-content">
          <section className="daily-hero-card">
            <div className="daily-hero-art">
              <img
                src="/img/undraw_new-year-2025_1tmm%201.png"
                alt=""
                aria-hidden="true"
              />
            </div>

            <div className="daily-hero-copy">
              <span className="daily-hero-badge">
                <img src="/img/eget.png" alt="" aria-hidden="true" />
                {isDaily ? "التقارير اليومية" : "التقارير الشهرية"}
              </span>

              <div className="daily-hero-titleRow">
                <div className="daily-hero-mood">
                  <span className="daily-hero-moodIcon">
                    <MdSentimentSatisfiedAlt size={22} />
                  </span>
                  <span>مثالية</span>
                </div>

                <h1>
                  {isDaily
                    ? "الحالة العامة للمزرعة: هذا اليوم"
                    : "الحالة العامة للمزرعة: هذا الشهر"}
                </h1>
              </div>
            </div>
          </section>

          <section className="daily-stats-card">
            <div className="daily-stats-card__header">
              <span>{isDaily ? "إحصائيات اليوم" : "إحصائيات الشهر"}</span>
              <img src="/img/bbvcf.png" alt="" aria-hidden="true" />
            </div>

            <div className="daily-stats-grid">
              <StatsCard
                label={
                  isDaily ? "معدل الرطوبة اليوم" : "إجمالي الرطوبة هذا الشهر"
                }
                value={isDaily ? "50%" : "1350%"}
                variant="sky"
              />
              <StatsCard
                label={
                  isDaily ? "حالة الرطوبة هذا الشهر" : "حالة الرطوبة اليوم"
                }
                value="90%"
                variant="pink"
              />
              <StatsCard
                label={isDaily ? "ملوحة التربة اليوم" : "إنتاجية الشهر"}
                value={isDaily ? "1.5 ds/m" : "60 Kg"}
                variant="green"
              />
            </div>
          </section>

          <section className="daily-summary-card">
            <div className="daily-summary-art" aria-hidden="true">
              <img
                src="/img/502c293323163feb0c000aace4fbd854ae4615c8.png"
                alt=""
              />
            </div>

            <div className="daily-summary-grid">
              <div className="daily-summary-text">
                <h2>{isDaily ? "ملخص اليوم" : "ملخص الشهر"}</h2>
                <p>
                  {isDaily
                    ? "تم تشغيل نظام الري مرتين بسبب انخفاض رطوبة التربة."
                    : "تم تسجيل ارتفاع في الرطوبة خلال الفترة الأخيرة."}
                </p>
                <p>
                  {isDaily
                    ? "درجة الحرارة كانت مستقرة مع تحسن بسيط في الإضاءة."
                    : "لوحظت زيادة متوازنة في معدلات النمو وجودة الزراعة."}
                </p>
                <p>
                  {isDaily
                    ? "لا توجد مشاكل أو أمراض ملحوظة اليوم."
                    : "لا توجد مشاكل أو أمراض ملحوظة خلال هذا الشهر."}
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
