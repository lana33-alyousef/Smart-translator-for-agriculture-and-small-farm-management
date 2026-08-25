// import { useState } from "react";
// import { FiArrowLeft } from "react-icons/fi";
// import "./FarmSettings.css";
// import SettingRow from "../../Component/SettingRow/SettingRow";

// export default function FarmSettings() {
//   const [location, setLocation] = useState("");
//   const [crop, setCrop] = useState("");
//   const [area, setArea] = useState("");
//   const [irrigation, setIrrigation] = useState("");
//   const [irrigationOpen, setIrrigationOpen] = useState(false);

//   return (
//     <section className="farm-settings-card">
//       <button type="button" className="farm-back" aria-label="رجوع">
//         <FiArrowLeft size={24} />
//       </button>

//       <div className="farm-settings">
//         <SettingRow
//           icon="/img/trac.png"
//           label="موقع المزرعة"
//           control={
//             <input
//               className="farm-input"
//               placeholder="أدخل الموقع"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//             />
//           }
//         />

//         <SettingRow
//           icon="/img/pp.png"
//           label="نوع المحصول"
//           control={
//             <input
//               className="farm-input"
//               placeholder="اختر نوع المحصول"
//               value={crop}
//               onChange={(e) => setCrop(e.target.value)}
//             />
//           }
//         />

//         <SettingRow
//           icon="/img/fluent-emoji-high-contrast_farmer.png"
//           label="مساحة المزرعة"
//           control={
//             <input
//               className="farm-input"
//               placeholder="المساحة (م²)"
//               value={area}
//               onChange={(e) => setArea(e.target.value)}
//             />
//           }
//         />

//         <SettingRow
//           icon="/img/water.png"
//           label="طريقة الري المعتمدة"
//           control={
//             <div className="farm-select">
//               <button
//                 type="button"
//                 className="farm-select__current"
//                 onClick={() => setIrrigationOpen((s) => !s)}>
//                 <span className="farm-select__text">
//                   {irrigation || "اختر طريقة الري"}
//                 </span>
//                 <span
//                   className={`farm-select__chev ${irrigationOpen ? "open" : ""}`}
//                   aria-hidden="true">
//                   ▾
//                 </span>
//               </button>

//               {irrigationOpen && (
//                 <div className="farm-select__options">
//                   <button
//                     type="button"
//                     className="farm-select__option"
//                     onClick={() => {
//                       setIrrigation("طريقة الري بالرش");
//                       setIrrigationOpen(false);
//                     }}>
//                     طريقة الري بالرش
//                   </button>
//                   <button
//                     type="button"
//                     className="farm-select__option"
//                     onClick={() => {
//                       setIrrigation("طريقة الري بالتنقيط");
//                       setIrrigationOpen(false);
//                     }}>
//                     طريقة الري بالتنقيط
//                   </button>
//                 </div>
//               )}
//             </div>
//           }
//         />
//       </div>
//     </section>
//   );
// }









import { useState } from "react";
import { FiArrowRight } from "react-icons/fi"; // تعديل اتجاه السهم ليناسب الواجهات العربية المريحة
import "./FarmSettings.css";
import SettingRow from "../../Component/SettingRow/SettingRow";

export default function FarmSettings() {
  const [location, setLocation] = useState("");
  const [crop, setCrop] = useState("");
  const [area, setArea] = useState("");
  const [irrigation, setIrrigation] = useState("");
  const [irrigationOpen, setIrrigationOpen] = useState(false);

  const handleSaveFarmData = () => {
    console.log("Saving farm data:", { location, crop, area, irrigation });
    alert("تم تحديث بيانات المزرعة بنجاح! 🌱");
  };

  return (
    <section className="farm-settings-card">
      {/* رأس الصفحة الاحترافي */}
      <div className="farm-settings-header">
        <button type="button" className="farm-back" aria-label="رجوع">
          <FiArrowRight size={24} />
        </button>
        <h2 className="farm-settings-title">إعدادات المزرعة والنظام</h2>
      </div>

      <div className="farm-settings-body">
        
        {/* موقع المزرعة */}
        <SettingRow
          icon="/img/trac.png"
          label="موقع المزرعة"
          control={
            <div className="farm-input-group">
              <input
                className="farm-input"
                placeholder="أدخل موقع الأرض أو المحافظة"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          }
        />

        {/* نوع المحصول */}
        <SettingRow
          icon="/img/pp.png"
          label="نوع المحصول الأساسي"
          control={
            <div className="farm-input-group">
              <input
                className="farm-input"
                placeholder="مثال: القمح، الزيتون، الطماطم"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
              />
            </div>
          }
        />

        {/* مساحة المزرعة */}
        <SettingRow
          icon="/img/fluent-emoji-high-contrast_farmer.png"
          label="مساحة المزرعة الكلية"
          control={
            <div className="farm-input-group">
              <input
                className="farm-input"
                placeholder="المساحة بالدونم أو المتر المربع (م²)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          }
        />

        {/* طريقة الري المعتمدة */}
        <SettingRow
          icon="/img/water.png"
          label="طريقة الري المعتمدة"
          control={
            <div className="farm-input-group">
              <div className="farm-select">
                <button
                  type="button"
                  className="farm-select__current"
                  onClick={() => setIrrigationOpen((s) => !s)}>
                  <span className="farm-select__text">
                    {irrigation || "اختر نظام الري النشط"}
                  </span>
                  <span
                    className={`farm-select__chev ${irrigationOpen ? "open" : ""}`}
                    aria-hidden="true">
                    ▾
                  </span>
                </button>

                 
              </div>
            </div>
          }
        />

        {/* زر أكشن موحد لحفظ البيانات أسفل الكرت للتخلص من الجمود الافتراضي للواجهة */}
        <div className="farm-actions-footer">
          <button type="button" className="farm-submit-btn" onClick={handleSaveFarmData}>
            حفظ بيانات المزرعة
          </button>
        </div>

      </div>
    </section>
  );
}