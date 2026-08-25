import React from "react";
import { FiArrowRightCircle } from "react-icons/fi";
import heroImage from "../../img/samad.png";

const FarmEditorHero = () => {
  return (
    <section className="farm-editor-hero">
      <div className="farm-editor-hero__copy">
        <h1>إدارة المزرع</h1>
        <p>
          تابع رحلة نمو محصولك خطوة بخطوة، من لحظة الزراعة وحتى الحصاد، لتتخذ
          القرار الصحيح في الوقت المناسب.
        </p>
      </div>

      <div className="farm-editor-hero__media">
        <img src={heroImage} alt="صورة الحقل" />
        <span className="farm-editor-hero__vertical">AgriSmart</span>
        <button
          type="button"
          className="farm-editor-hero__arrow"
          aria-label="متابعة">
          <FiArrowRightCircle />
        </button>
      </div>
    </section>
  );
};

export default FarmEditorHero;
