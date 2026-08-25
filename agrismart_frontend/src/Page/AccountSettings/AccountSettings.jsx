// import { useState } from "react";
// import { FiArrowLeft } from "react-icons/fi";
// import "./AccountSettings.css";
// import SettingRow from "../../Component/SettingRow/SettingRow";

// export default function AccountSettings() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const handleDeleteAccount = () => {
//     if (window.confirm("هل أنت متأكد من رغبتك في حذف الحساب؟")) {
//       console.log("Delete account");
//       // Add delete logic here
//     }
//   };

//   return (
//     <section className="account-settings-card">
//       <button type="button" className="account-back" aria-label="رجوع">
//         <FiArrowLeft size={24} />
//       </button>

//       <div className="account-settings">
//         <SettingRow
//           icon="/img/mmnjk.png"
//           label="تعديل الاسم"
//           control={
//             <input
//               className="account-input"
//               placeholder="الاسم الكامل"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//             />
//           }
//         />

//         <SettingRow
//           icon="/img/oooppk.png"
//           label="تعديل البريد الإلكتروني"
//           control={
//             <input
//               className="account-input"
//               placeholder="example@mail.com"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           }
//         />

//         <SettingRow
//           icon="/img/carbon_password.png"
//           label="تعديل كلمة المرور"
//           control={
//             <input
//               className="account-input"
//               type="password"
//               placeholder="••••••••"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//           }
//         />

//         <SettingRow
//           icon="/img/bbvcf.png"
//           label="حذف الحساب"
//           control={
//             <button
//               className="account-delete"
//               type="button"
//               onClick={handleDeleteAccount}>
//               حذف الحساب
//             </button>
//           }
//         />
//       </div>
//     </section>
//   );
// }














import React, { useState } from "react";
import { FiUser, FiMail, FiLock, FiTrash2, FiCamera, FiArrowRight, FiCheck } from "react-icons/fi";
import "./AccountSettings.css";

export default function AccountSettings() {
  const [formData, setFormData] = useState({
    fullName: "أحمد العلي",
    email: "example@mail.com",
    currentPassword: "",
    newPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="settings-container">
      {/* رأس الصفحة مع زر العودة */}
      <div className="settings-header">
        <button className="back-btn" aria-label="عودة">
          <FiArrowRight />
        </button>
        <h2>إعدادات الحساب</h2>
      </div>

      <div className="settings-grid">
        {/* القسم الأيمن: الصورة الشخصية والمعلومات السريعة */}
        <div className="profile-card">
          <div className="avatar-wrapper">
            <div className="avatar-placeholder">
              <FiUser />
            </div>
            <button className="change-avatar-btn" title="تغيير الصورة">
              <FiCamera />
            </button>
          </div>
          <h3>{formData.fullName}</h3>
          <p>{formData.email}</p>
        </div>

        {/* القسم الأيسر: فورم التعديل الرئيسي */}
        <div className="forms-wrapper">
          {/* كرت المعلومات الأساسية */}
          <div className="settings-card">
            <h4 className="card-title">المعلومات الأساسية</h4>
            <div className="input-group-row">
              <div className="custom-input-field">
                <label>الاسم الكامل</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="custom-input-field">
                <label>البريد الإلكتروني</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>
            <button className="save-btn">
              <FiCheck /> حفظ التغييرات
            </button>
          </div>

          {/* كرت تغيير كلمة المرور */}
          <div className="settings-card">
            <h4 className="card-title">أمان الحساب</h4>
            <div className="input-group-row">
              <div className="custom-input-field">
                <label>كلمة المرور الحالية</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input 
                    type="password" 
                    name="currentPassword" 
                    placeholder="••••••••" 
                    value={formData.currentPassword} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="custom-input-field">
                <label>كلمة المرور الجديدة</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input 
                    type="password" 
                    name="newPassword" 
                    placeholder="••••••••" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>
            <button className="save-btn secondary">تحديث كلمة المرور</button>
          </div>

          {/* كرت منطقة الخطر (حذف الحساب) */}
          <div className="settings-card danger-zone">
            <div className="danger-flex">
              <div>
                <h4>حذف الحساب</h4>
                <p>بمجرد حذف حسابك، لن تتمكن من استعادة أي بيانات متعلقة بمزارعك أو مخزونك.</p>
              </div>
              <button className="delete-account-btn">
                <FiTrash2 /> حذف الحساب بالكامل
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}








