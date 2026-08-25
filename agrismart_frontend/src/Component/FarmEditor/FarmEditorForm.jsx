import React from "react";
import sidePlant from "../../img/flower.png";

const FarmEditorForm = ({ fields = [] }) => {
  return (
    <section className="farm-editor-form">
      <img
        src={sidePlant}
        alt="زينة نباتية"
        className="farm-editor-form__plant"
      />

      <div className="farm-editor-form__rows">
        {fields.map((field) => (
          <label key={field} className="farm-editor-form__row">
            <span>{field}</span>
            <input type="text" />
          </label>
        ))}
      </div>

      <div className="farm-editor-form__actions">
        <button type="button">تعديل</button>
        <button type="button">حفظ</button>
      </div>
    </section>
  );
};

export default FarmEditorForm;
